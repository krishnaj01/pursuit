from datetime import timedelta

from app.services.reminders import today_in

TODAY = today_in("UTC")


async def create(client, **extra):
    payload = {
        "company_name": "Acme",
        "role": "SWE",
        "applied_on": (TODAY - timedelta(days=10)).isoformat(),
        "reminder_days": 3,
    } | extra
    return (await client.post("/api/v1/applications", json=payload)).json()


async def history(client, app_id):
    return (await client.get(f"/api/v1/applications/{app_id}/history")).json()


async def move(client, app_id, stage, days=None, **extra):
    body = {"stage": stage, **extra}
    if days is not None:
        body["event_date"] = (TODAY + timedelta(days=days)).isoformat()
    return (await client.patch(f"/api/v1/applications/{app_id}/stage", json=body)).json()


async def test_first_entry_tracks_applied_date(client):
    app = await create(client)
    first = (await history(client, app["id"]))[0]
    assert first["occurred_on"] == app["applied_on"]

    new_day = (TODAY - timedelta(days=20)).isoformat()
    edited = await client.patch(
        f"/api/v1/applications/{app['id']}/history/{first['id']}", json={"occurred_on": new_day}
    )
    assert edited.json()["applied_on"] == new_day

    future = await client.patch(
        f"/api/v1/applications/{app['id']}/history/{first['id']}",
        json={"occurred_on": (TODAY + timedelta(days=1)).isoformat()},
    )
    assert future.status_code == 422

    undeletable = await client.delete(f"/api/v1/applications/{app['id']}/history/{first['id']}")
    assert undeletable.status_code == 422


async def test_editing_latest_event_date_moves_reminder(client):
    app = await create(client)
    await move(client, app["id"], "interview", days=3)
    latest = (await history(client, app["id"]))[-1]

    new_date = (TODAY + timedelta(days=6)).isoformat()
    updated = await client.patch(
        f"/api/v1/applications/{app['id']}/history/{latest['id']}", json={"event_date": new_date}
    )
    body = updated.json()
    assert body["event_date"] == new_date
    assert body["next_reminder_on"] == new_date


async def test_editing_older_entry_leaves_current_state(client):
    app = await create(client)
    await move(client, app["id"], "oa_cleared", days=2)
    current = await move(client, app["id"], "interview", days=5)
    older = (await history(client, app["id"]))[1]

    updated = await client.patch(
        f"/api/v1/applications/{app['id']}/history/{older['id']}",
        json={"event_date": (TODAY + timedelta(days=1)).isoformat()},
    )
    assert updated.json()["next_reminder_on"] == current["next_reminder_on"]
    assert updated.json()["stage"] == "interview"


async def test_custom_label_edit_and_validation(client):
    app = await create(client)
    await move(client, app["id"], "custom", days=2, custom_stage_label="HR call")
    entries = await history(client, app["id"])
    custom, applied = entries[-1], entries[0]

    renamed = await client.patch(
        f"/api/v1/applications/{app['id']}/history/{custom['id']}",
        json={"custom_stage_label": "Founder chat"},
    )
    assert renamed.json()["custom_stage_label"] == "Founder chat"

    bad = await client.patch(
        f"/api/v1/applications/{app['id']}/history/{applied['id']}",
        json={"event_date": TODAY.isoformat()},
    )
    assert bad.status_code == 422


async def test_deleting_latest_reverts_stage_and_reminder(client):
    app = await create(client)
    await move(client, app["id"], "round_1", days=4)
    await move(client, app["id"], "rejected")
    rejected = (await history(client, app["id"]))[-1]

    reverted = await client.delete(f"/api/v1/applications/{app['id']}/history/{rejected['id']}")
    body = reverted.json()
    assert body["stage"] == "round_1"
    assert body["next_reminder_on"] == (TODAY + timedelta(days=4)).isoformat()
    assert body["reminder_kind"] == "event"
    assert [e["to_stage"] for e in await history(client, app["id"])] == ["applied", "round_1"]


async def test_deleting_latest_with_past_event_falls_back_to_status_check(client):
    app = await create(client)
    await move(client, app["id"], "assignment", days=0)
    await client.patch(
        f"/api/v1/applications/{app['id']}/history/{(await history(client, app['id']))[-1]['id']}",
        json={"event_date": (TODAY - timedelta(days=2)).isoformat()},
    )
    await move(client, app["id"], "interview", days=3)
    latest = (await history(client, app["id"]))[-1]

    body = (await client.delete(f"/api/v1/applications/{app['id']}/history/{latest['id']}")).json()
    assert body["stage"] == "assignment"
    assert body["reminder_kind"] == "status_check"
    assert body["next_reminder_on"] == (TODAY + timedelta(days=7)).isoformat()


async def test_no_reminder_options(client):
    app = await create(client)
    cleared = await client.delete(f"/api/v1/applications/{app['id']}/reminder")
    assert cleared.json()["next_reminder_on"] is None

    staged = await move(client, app["id"], "interview", days=2, remind=False)
    assert staged["event_date"] == (TODAY + timedelta(days=2)).isoformat()
    assert staged["next_reminder_on"] is None

    # Editing the event date doesn't resurrect a reminder the user turned off.
    latest = (await history(client, app["id"]))[-1]
    edited = await client.patch(
        f"/api/v1/applications/{app['id']}/history/{latest['id']}",
        json={"event_date": (TODAY + timedelta(days=5)).isoformat()},
    )
    assert edited.json()["next_reminder_on"] is None


async def test_cannot_touch_another_users_timeline(client):
    app = await create(client)
    entry = (await history(client, app["id"]))[0]
    missing = await client.delete(
        f"/api/v1/applications/{app['id']}/history/00000000-0000-0000-0000-000000000000"
    )
    assert missing.status_code == 404
    client.cookies.clear()
    assert (
        await client.delete(f"/api/v1/applications/{app['id']}/history/{entry['id']}")
    ).status_code == 401
