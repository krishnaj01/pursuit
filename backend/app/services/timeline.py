"""Editing an application's stage timeline.

The newest entry always mirrors the application's current stage, so edits to it (and
deleting it) flow back into the application's stage, event date and reminder.
"""

from datetime import date, timedelta

from app.models import Application, ReminderKind, Stage, StageEvent
from app.schemas.application import UNDATED_STAGES, StageEventUpdate
from app.services.reminders import DEFAULT_REOPEN_DAYS, ReminderError


def _is_initial(app: Application, event: StageEvent) -> bool:
    return bool(app.stage_events) and app.stage_events[0].id == event.id


def _is_latest(app: Application, event: StageEvent) -> bool:
    return bool(app.stage_events) and app.stage_events[-1].id == event.id


def edit_event(app: Application, event: StageEvent, update: StageEventUpdate, today: date) -> None:
    changes = update.model_dump(exclude_unset=True)

    if "occurred_on" in changes:
        occurred_on = changes["occurred_on"]
        if occurred_on is None:
            raise ReminderError("The date can't be empty")
        if occurred_on > today:
            raise ReminderError("A timeline entry can't happen in the future")
        event.occurred_on = occurred_on
        if _is_initial(app, event):
            app.applied_on = occurred_on  # the first entry is the application itself

    if "event_date" in changes:
        if event.to_stage in UNDATED_STAGES:
            raise ReminderError("This stage doesn't have an event date")
        if changes["event_date"] is None:
            raise ReminderError("This stage needs an event date")
        event.event_date = changes["event_date"]

    if "custom_stage_label" in changes:
        label = (changes["custom_stage_label"] or "").strip()
        if event.to_stage != Stage.CUSTOM:
            raise ReminderError("Only custom stages have a label")
        if not label:
            raise ReminderError("A custom stage needs a label")
        event.custom_stage_label = label

    if _is_latest(app, event):
        app.custom_stage_label = event.custom_stage_label
        if event.to_stage not in UNDATED_STAGES:
            app.event_date = event.event_date
            # Follow the moved event only if the user is being reminded about it.
            if app.reminder_kind == ReminderKind.EVENT and app.next_reminder_on is not None:
                app.next_reminder_on = event.event_date


def delete_event(app: Application, event: StageEvent, today: date) -> None:
    if _is_initial(app, event):
        raise ReminderError("The first entry can't be deleted — delete the application instead")

    was_latest = _is_latest(app, event)
    app.stage_events.remove(event)
    if was_latest:
        _revert_to_latest(app, today)


def _revert_to_latest(app: Application, today: date) -> None:
    """Make the application reflect its (new) newest timeline entry."""
    latest = app.stage_events[-1]
    was_rejected = app.stage == Stage.REJECTED
    had_event_reminder = (
        app.reminder_kind == ReminderKind.EVENT and app.next_reminder_on is not None
    )

    app.stage = latest.to_stage
    app.custom_stage_label = latest.custom_stage_label
    app.event_date = latest.event_date if latest.to_stage not in UNDATED_STAGES else None

    if app.stage == Stage.REJECTED:
        app.next_reminder_on = None
        app.reminder_kind = ReminderKind.STATUS_CHECK
    elif app.event_date and app.event_date >= today:
        app.next_reminder_on = app.event_date
        app.reminder_kind = ReminderKind.EVENT
    elif was_rejected or had_event_reminder:
        # The reminder belonged to the removed entry; fall back to a status check.
        app.next_reminder_on = today + timedelta(days=DEFAULT_REOPEN_DAYS)
        app.reminder_kind = ReminderKind.STATUS_CHECK
    # Otherwise keep the user's existing status-check reminder (or lack of one).
