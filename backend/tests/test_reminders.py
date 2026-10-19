from datetime import date, timedelta

import pytest
from pydantic import ValidationError

from app.models import Application, ReminderKind, Stage
from app.schemas.application import ReminderUpdate, StageUpdate
from app.services import reminders

TODAY = date(2026, 10, 19)


def make_app(**kwargs) -> Application:
    defaults = dict(
        company_name="Acme",
        role="SWE",
        applied_on=TODAY,
        stage=Stage.APPLIED,
        next_reminder_on=TODAY + timedelta(days=7),
        reminder_kind=ReminderKind.STATUS_CHECK,
        stage_events=[],
    )
    return Application(**(defaults | kwargs))


def test_initial_reminder_adds_days():
    assert reminders.initial_reminder(TODAY, 5) == date(2026, 10, 24)


def test_dated_stage_moves_reminder_to_event():
    app = make_app()
    event_day = TODAY + timedelta(days=3)
    reminders.apply_stage_change(app, StageUpdate(stage="interview", event_date=event_day), TODAY)
    assert app.next_reminder_on == event_day
    assert app.event_date == event_day
    assert app.reminder_kind == ReminderKind.EVENT
    assert app.stage_events[-1].from_stage == Stage.APPLIED


def test_dated_stage_requires_date():
    with pytest.raises(ValidationError):
        StageUpdate(stage="assignment")


def test_custom_stage_requires_label():
    with pytest.raises(ValidationError):
        StageUpdate(stage="custom", event_date=TODAY)
    assert StageUpdate(stage="custom", custom_stage_label="HR", event_date=TODAY)


def test_rejected_clears_reminder():
    app = make_app()
    reminders.apply_stage_change(app, StageUpdate(stage="rejected"), TODAY)
    assert app.next_reminder_on is None
    assert app.event_date is None


def test_schedule_next_reminder_by_days_and_date():
    app = make_app(next_reminder_on=TODAY, reminder_kind=ReminderKind.EVENT)
    reminders.schedule_next_reminder(app, ReminderUpdate(days=3), TODAY)
    assert app.next_reminder_on == TODAY + timedelta(days=3)
    assert app.reminder_kind == ReminderKind.STATUS_CHECK

    reminders.schedule_next_reminder(app, ReminderUpdate(on_date=date(2026, 12, 1)), TODAY)
    assert app.next_reminder_on == date(2026, 12, 1)


def test_schedule_next_reminder_rejected_or_past_fails():
    with pytest.raises(reminders.ReminderError):
        reminders.schedule_next_reminder(
            make_app(stage=Stage.REJECTED), ReminderUpdate(days=3), TODAY
        )
    with pytest.raises(reminders.ReminderError):
        reminders.schedule_next_reminder(
            make_app(), ReminderUpdate(on_date=TODAY - timedelta(days=1)), TODAY
        )


def test_reminder_update_needs_exactly_one_field():
    with pytest.raises(ValidationError):
        ReminderUpdate()
    with pytest.raises(ValidationError):
        ReminderUpdate(days=3, on_date=TODAY)


def test_unknown_timezone_falls_back_to_utc():
    assert reminders.safe_zone("Not/AZone").key == "UTC"
