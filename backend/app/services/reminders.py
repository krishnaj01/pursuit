"""Reminder scheduling rules.

- New application: remind `reminder_days` after it was added to the app, on a custom date,
  or not at all.
- Moving to a dated stage (OA, interview, assignment...): remind on that event's date,
  unless the user opts out.
- Closed (offer or rejected): no further reminders.
- The user can schedule the next status check at any time (unless rejected), or clear it.
"""

from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.models import CLOSED_STAGES, FOLLOW_UP_STAGES, Application, ReminderKind, StageEvent
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
) -> date | None:
    """First reminder, counted from the day the application is added (not the applied date).

    Returns None when the user chose no reminder.
    """
    if reminder_on is not None:
        if reminder_on < today:
            raise ReminderError("The first reminder can't be in the past")
        return reminder_on
    if reminder_days is None:
        return None
    return today + timedelta(days=reminder_days)


def apply_stage_change(app: Application, update: StageUpdate, today: date) -> StageEvent:
    event = StageEvent(
        from_stage=app.stage,
        to_stage=update.stage,
        custom_stage_label=update.custom_stage_label,
        event_date=update.event_date,
        occurred_on=today,
    )
    app.stage = update.stage
    app.custom_stage_label = update.custom_stage_label

    if update.stage in CLOSED_STAGES:
        app.event_date = None
        app.next_reminder_on = None
        app.reminder_kind = ReminderKind.STATUS_CHECK
    elif update.stage in FOLLOW_UP_STAGES:
        app.event_date = None
        app.reminder_kind = ReminderKind.STATUS_CHECK
        if not update.remind:
            app.next_reminder_on = None
        elif update.follow_up_on is not None:
            if update.follow_up_on < today:
                raise ReminderError("The follow-up reminder can't be in the past")
            app.next_reminder_on = update.follow_up_on
        elif update.follow_up_days is not None:
            app.next_reminder_on = today + timedelta(days=update.follow_up_days)
        # otherwise keep the existing status-check reminder (or lack of one)
    elif update.remind:
        app.event_date = update.event_date
        app.next_reminder_on = update.event_date
        app.reminder_kind = ReminderKind.EVENT
    else:
        app.event_date = update.event_date
        app.next_reminder_on = None
        app.reminder_kind = ReminderKind.STATUS_CHECK

    app.stage_events.append(event)
    return event


def schedule_next_reminder(app: Application, update: ReminderUpdate, today: date) -> None:
    if app.stage in CLOSED_STAGES:
        raise ReminderError("Closed applications don't get reminders")
    next_on = update.on_date if update.on_date else today + timedelta(days=update.days or 0)
    if next_on < today:
        raise ReminderError("The next reminder can't be in the past")
    app.next_reminder_on = next_on
    app.reminder_kind = ReminderKind.STATUS_CHECK


def clear_reminder(app: Application) -> None:
    app.next_reminder_on = None
    app.reminder_kind = ReminderKind.STATUS_CHECK
