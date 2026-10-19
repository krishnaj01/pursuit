from datetime import date

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import CLOSED_STAGES, Application, Notification, User
from app.services.reminders import today_in


def _digest_text(apps: list[Application]) -> tuple[str, str]:
    count = len(apps)
    title = f"{count} application{'s' if count != 1 else ''} to check today"
    names = ", ".join(f"{a.company_name} ({a.role})" for a in apps[:3])
    more = f" and {count - 3} more" if count > 3 else ""
    return title, f"Time to follow up on {names}{more}."


async def due_applications(session: AsyncSession, user_id, today: date) -> list[Application]:
    result = await session.scalars(
        select(Application)
        .where(
            Application.user_id == user_id,
            Application.stage.not_in(CLOSED_STAGES),
            Application.next_reminder_on.is_not(None),
            Application.next_reminder_on <= today,
        )
        .order_by(Application.next_reminder_on, Application.company_name)
    )
    return list(result)


async def generate_for_user(session: AsyncSession, user: User) -> Notification | None:
    """Create or refresh today's digest notification. Safe to call repeatedly."""
    today = today_in(user.timezone)
    apps = await due_applications(session, user.id, today)
    existing = await session.scalar(
        select(Notification).where(Notification.user_id == user.id, Notification.for_date == today)
    )
    if not apps:
        return existing

    ids = [str(a.id) for a in apps]
    title, body = _digest_text(apps)

    if existing:
        newly_due = set(ids) - set(existing.application_ids)
        if newly_due:
            # Something new became due today: refresh the digest and surface it again.
            existing.application_ids = ids
            existing.title, existing.body = title, body
            existing.read_at = None
            await session.commit()
        return existing

    notification = Notification(
        user_id=user.id, for_date=today, application_ids=ids, title=title, body=body
    )
    session.add(notification)
    try:
        await session.commit()
    except IntegrityError:
        # A concurrent request (or the scheduler) created it first.
        await session.rollback()
        return await session.scalar(
            select(Notification).where(
                Notification.user_id == user.id, Notification.for_date == today
            )
        )
    return notification
