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


async def test_digest_is_built_once_on_the_first_visit_of_the_day(client, monkeypatch):
    from datetime import date

    from app.api.v1 import notifications as notifications_api
    from app.services import notifications as notifications_service

    def travel_to(day: date) -> None:
        for module in (notifications_api, notifications_service):
            monkeypatch.setattr(module, "today_in", lambda _tz, day=day: day)

    today = today_in("UTC")
    travel_to(today)
    payload = {"role": "SWE", "applied_on": today.isoformat(), "reminder_days": 0}

    await client.post("/api/v1/applications", json=payload | {"company_name": "First"})
    first_visit = (await client.get("/api/v1/notifications")).json()
    assert first_visit["unread_count"] == 1
    assert len(first_visit["items"][0]["application_ids"]) == 1

    # Later visits the same day don't rebuild the digest, even if something new is due.
    await client.post("/api/v1/notifications/read-all")
    await client.post("/api/v1/applications", json=payload | {"company_name": "Second"})
    later_visit = (await client.get("/api/v1/notifications")).json()
    assert later_visit["unread_count"] == 0
    assert len(later_visit["items"]) == 1

    # The next day's first visit builds a fresh digest with everything still due.
    travel_to(today + timedelta(days=1))
    next_day = (await client.get("/api/v1/notifications")).json()
    assert next_day["unread_count"] == 1
    assert len(next_day["items"]) == 2
    assert len(next_day["items"][0]["application_ids"]) == 2
