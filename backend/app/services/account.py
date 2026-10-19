"""Account-level data operations: full deletion and CSV export."""

import csv
import io
import uuid
from datetime import date, datetime

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Application, Notification, StageEvent, User
from app.models.enums import ReminderKind, Stage

STAGE_LABELS = {
    Stage.APPLIED: "Applied",
    Stage.AWAITING: "Awaiting",
    Stage.OA_CLEARED: "OA cleared",
    Stage.ASSIGNMENT: "Assignment",
    Stage.HACKATHON: "Hackathon",
    Stage.ROUND_1: "Round 1",
    Stage.ROUND_2: "Round 2",
    Stage.INTERVIEW: "Interview",
    Stage.OFFER: "Offer",
    Stage.REJECTED: "Rejected",
    Stage.CUSTOM: "Custom",
}

CSV_COLUMNS = [
    "Company",
    "Website",
    "Role",
    "Applied on",
    "Stage",
    "Event date",
    "Next reminder",
    "Reminder type",
    "Job URL",
    "Notes",
    "Custom logo URL",
    "Timeline",
    "Added on (UTC)",
]

CACHED_LOGO_PREFIX = "/api/v1/logos/image/"

# Spreadsheet apps execute cells starting with these as formulas (CSV injection).
FORMULA_PREFIXES = ("=", "+", "-", "@", "\t", "\r")


async def delete_account(session: AsyncSession, user_id: uuid.UUID) -> None:
    """Permanently remove a user and everything they own.

    Explicit deletes (children first) rather than relying on database cascades, so the
    result is the same on every backend and nothing is left behind.
    """
    app_ids = select(Application.id).where(Application.user_id == user_id)
    await session.execute(delete(StageEvent).where(StageEvent.application_id.in_(app_ids)))
    await session.execute(delete(Application).where(Application.user_id == user_id))
    await session.execute(delete(Notification).where(Notification.user_id == user_id))
    await session.execute(delete(User).where(User.id == user_id))
    await session.commit()


def _safe(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, datetime):
        text = value.strftime("%Y-%m-%d %H:%M")
    elif isinstance(value, date):
        text = value.isoformat()
    else:
        text = str(value)
    return f"'{text}" if text.startswith(FORMULA_PREFIXES) else text


def _stage_label(stage: Stage, custom_label: str | None) -> str:
    if stage == Stage.CUSTOM:
        return custom_label or "Custom"
    return STAGE_LABELS[stage]


def _custom_logo(url: str | None) -> str | None:
    """Only user-supplied logo URLs are meaningful outside the app; cached ones are internal."""
    return None if url and url.startswith(CACHED_LOGO_PREFIX) else url


def _timeline(app: Application) -> str:
    parts = []
    for event in app.stage_events:
        part = f"{_stage_label(event.to_stage, event.custom_stage_label)} ({event.occurred_on})"
        if event.event_date:
            part += f" [on {event.event_date}]"
        parts.append(part)
    return " → ".join(parts)


async def export_applications_csv(session: AsyncSession, user_id: uuid.UUID) -> str:
    apps = await session.scalars(
        select(Application)
        .options(selectinload(Application.stage_events))
        .where(Application.user_id == user_id)
        .order_by(Application.applied_on.desc(), Application.company_name)
    )
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(CSV_COLUMNS)
    for app in apps:
        writer.writerow(
            _safe(value)
            for value in (
                app.company_name,
                app.company_domain,
                app.role,
                app.applied_on,
                _stage_label(app.stage, app.custom_stage_label),
                app.event_date,
                app.next_reminder_on,
                "Event" if app.reminder_kind == ReminderKind.EVENT else "Status check",
                app.job_url,
                app.notes,
                _custom_logo(app.logo_url),
                _timeline(app),
                app.created_at,
            )
        )
    return buffer.getvalue()
