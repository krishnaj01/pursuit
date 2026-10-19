from datetime import timedelta

from sqlalchemy import func, select

from app.models import Application, Notification, Stage
from app.services.notifications import generate_for_user
from app.services.reminders import today_in


async def add_app(db, user, company, reminder_offset, stage=Stage.APPLIED):
    today = today_in(user.timezone)
    app = Application(
        user_id=user.id,
        company_name=company,
        role="SWE",
        applied_on=today,
        stage=stage,
        next_reminder_on=today + timedelta(days=reminder_offset),
    )
    db.add(app)
    await db.commit()
    return app


async def test_digest_includes_only_due_active_apps(db, user):
    due = await add_app(db, user, "Due Co", 0)
    await add_app(db, user, "Overdue Co", -2)
    await add_app(db, user, "Later Co", 3)
    await add_app(db, user, "Gone Co", 0, stage=Stage.REJECTED)

    notification = await generate_for_user(db, user)
    assert notification is not None
    assert str(due.id) in notification.application_ids
    assert len(notification.application_ids) == 2
    assert notification.title == "2 applications to check today"


async def test_digest_is_idempotent_and_resurfaces_new_items(db, user):
    await add_app(db, user, "First", 0)
    first = await generate_for_user(db, user)
    first.read_at = first.created_at
    await db.commit()

    again = await generate_for_user(db, user)
    assert again.id == first.id
    assert again.read_at is not None  # nothing new, stays read

    await add_app(db, user, "Second", 0)
    refreshed = await generate_for_user(db, user)
    assert refreshed.id == first.id
    assert refreshed.read_at is None
    assert len(refreshed.application_ids) == 2
    assert await db.scalar(select(func.count()).select_from(Notification)) == 1


async def test_no_digest_when_nothing_due(db, user):
    await add_app(db, user, "Later", 5)
    assert await generate_for_user(db, user) is None
