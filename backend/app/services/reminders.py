"""Reminder scheduling rules.

- New application: remind `reminder_days` after it was added to the app (or on a custom date).
- Moving to a dated stage (OA, interview, assignment...): remind on that event's date.
- Rejected: no further reminders.
- After a reminder fires, the user schedules the next status check (unless rejected).
"""

from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.models import Application, ReminderKind, Stage, StageEvent
from app.schemas.application import ReminderUpdate, StageUpdate

DEFAULT_REOPEN_DAYS = 7


class ReminderError(ValueError):
    pass


def safe_zone(tz_name: str) -> ZoneInfo:
    try:
        return ZoneInfo(tz_name)
    except (ZoneInfoNotFoundError, ValueError):
        return ZoneInfo("UTC")


def today_in(tz_name: str) -> date:
    return datetime.now(safe_zone(tz_name)).date()


def initial_reminder(
    today: date, reminder_days: int | None = None, reminder_on: date | None = None
) -> date:
    """First reminder, counted from the day the application is added (not the applied date)."""
    if reminder_on is not None:
        if reminder_on < today:
            raise ReminderError("The first reminder can't be in the past")
        return reminder_on
    return today + timedelta(days=reminder_days or 0)


def apply_stage_change(app: Application, update: StageUpdate, today: date) -> StageEvent:
    event = StageEvent(
        from_stage=app.stage,
        to_stage=update.stage,
        custom_stage_label=update.custom_stage_label,
        event_date=update.event_date,
    )
    app.stage = update.stage
    app.custom_stage_label = update.custom_stage_label

    if update.stage == Stage.REJECTED:
        app.event_date = None
        app.next_reminder_on = None
        app.reminder_kind = ReminderKind.STATUS_CHECK
    elif update.stage == Stage.APPLIED:
        app.event_date = None
        app.reminder_kind = ReminderKind.STATUS_CHECK
        if app.next_reminder_on is None:
            app.next_reminder_on = today + timedelta(days=DEFAULT_REOPEN_DAYS)
    else:
        app.event_date = update.event_date
        app.next_reminder_on = update.event_date
        app.reminder_kind = ReminderKind.EVENT

    app.stage_events.append(event)
    return event


def schedule_next_reminder(app: Application, update: ReminderUpdate, today: date) -> None:
    if app.stage == Stage.REJECTED:
        raise ReminderError("Rejected applications don't get reminders")
    next_on = update.on_date if update.on_date else today + timedelta(days=update.days or 0)
    if next_on < today:
        raise ReminderError("The next reminder can't be in the past")
    app.next_reminder_on = next_on
    app.reminder_kind = ReminderKind.STATUS_CHECK
