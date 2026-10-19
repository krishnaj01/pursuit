from datetime import date, timedelta

from app.services.reminders import today_in


async def test_full_application_lifecycle(client):
    today = today_in("UTC")
    created = await client.post(
        "/api/v1/applications",
        json={
            "company_name": "Stripe",
            "role": "Backend Engineer",
            "applied_on": today.isoformat(),
            "reminder_days": 0,
            "logo_url": "https://img.example.com/stripe.png",
        },
    )
    assert created.status_code == 201, created.text
    app = created.json()
    assert app["next_reminder_on"] == today.isoformat()
    assert app["stage"] == "applied"

    due = await client.get("/api/v1/applications", params={"filter": "due"})
    assert [a["id"] for a in due.json()] == [app["id"]]

    notes = (await client.get("/api/v1/notifications")).json()
    assert notes["unread_count"] == 1
    assert notes["items"][0]["application_ids"] == [app["id"]]

    snoozed = await client.post(f"/api/v1/applications/{app['id']}/reminder", json={"days": 3})
    assert snoozed.json()["next_reminder_on"] == (today + timedelta(days=3)).isoformat()

    missing_date = await client.patch(
        f"/api/v1/applications/{app['id']}/stage", json={"stage": "interview"}
    )
    assert missing_date.status_code == 422

    interview_day = today + timedelta(days=5)
    staged = await client.patch(
        f"/api/v1/applications/{app['id']}/stage",
        json={"stage": "interview", "event_date": interview_day.isoformat()},
    )
    body = staged.json()
    assert body["next_reminder_on"] == interview_day.isoformat()
    assert body["reminder_kind"] == "event"

    cached_logo = await client.patch(
        f"/api/v1/applications/{app['id']}", json={"logo_url": "/api/v1/logos/image/stripe.com"}
    )
    assert cached_logo.json()["logo_url"] == "/api/v1/logos/image/stripe.com"
    bad_logo = await client.patch(
        f"/api/v1/applications/{app['id']}", json={"logo_url": "javascript:alert(1)"}
    )
    assert bad_logo.status_code == 422

    removed_logo = await client.patch(f"/api/v1/applications/{app['id']}", json={"logo_url": None})
    assert removed_logo.json()["logo_url"] is None

    rejected = await client.patch(
        f"/api/v1/applications/{app['id']}/stage", json={"stage": "rejected"}
    )
    assert rejected.json()["next_reminder_on"] is None
    blocked = await client.post(f"/api/v1/applications/{app['id']}/reminder", json={"days": 3})
    assert blocked.status_code == 422

    history = (await client.get(f"/api/v1/applications/{app['id']}/history")).json()
    assert [h["to_stage"] for h in history] == ["applied", "interview", "rejected"]

    stats = (await client.get("/api/v1/stats")).json()
    assert stats["total"] == 1 and stats["rejected"] == 1 and stats["response_rate"] == 1.0

    assert (await client.delete(f"/api/v1/applications/{app['id']}")).status_code == 204
    assert (await client.get("/api/v1/applications")).json() == []


async def test_list_is_ordered_by_upcoming_reminder(client):
    base = date(2026, 1, 1)
    for name, days in [("Later", 10), ("Soon", 1), ("Middle", 5)]:
        await client.post(
            "/api/v1/applications",
            json={
                "company_name": name,
                "role": "SWE",
                "applied_on": base.isoformat(),
                "reminder_days": days,
            },
        )
    names = [a["company_name"] for a in (await client.get("/api/v1/applications")).json()]
    assert names == ["Soon", "Middle", "Later"]


async def test_first_reminder_counts_from_date_added_not_applied_date(client):
    today = today_in("UTC")
    long_ago = today - timedelta(days=30)
    payload = {"company_name": "Old", "role": "SWE", "applied_on": long_ago.isoformat()}

    by_days = await client.post("/api/v1/applications", json=payload | {"reminder_days": 5})
    assert by_days.json()["next_reminder_on"] == (today + timedelta(days=5)).isoformat()

    custom_day = today + timedelta(days=12)
    custom = await client.post(
        "/api/v1/applications", json=payload | {"reminder_on": custom_day.isoformat()}
    )
    assert custom.json()["next_reminder_on"] == custom_day.isoformat()

    no_reminder = await client.post("/api/v1/applications", json=payload)
    assert no_reminder.status_code == 201
    assert no_reminder.json()["next_reminder_on"] is None

    both = await client.post(
        "/api/v1/applications",
        json=payload | {"reminder_days": 3, "reminder_on": custom_day.isoformat()},
    )
    assert both.status_code == 422


async def test_requires_auth(client):
    client.cookies.clear()
    assert (await client.get("/api/v1/applications")).status_code == 401


async def test_job_url_is_optional_validated_and_editable(client):
    today = today_in("UTC").isoformat()
    base = {"company_name": "Ramp", "role": "SWE", "applied_on": today, "reminder_days": 3}

    without = await client.post("/api/v1/applications", json=base)
    assert without.status_code == 201 and without.json()["job_url"] is None

    url = "https://jobs.example.com/ramp/software-engineer?ref=pursuit"
    created = await client.post("/api/v1/applications", json=base | {"job_url": f"  {url}  "})
    assert created.status_code == 201
    app = created.json()
    assert app["job_url"] == url

    for bad in ("javascript:alert(1)", "ftp://files.example.com/job", "not a url"):
        response = await client.post("/api/v1/applications", json=base | {"job_url": bad})
        assert response.status_code == 422, bad

    changed = await client.patch(
        f"/api/v1/applications/{app['id']}", json={"job_url": "https://example.com/new"}
    )
    assert changed.json()["job_url"] == "https://example.com/new"

    untouched = await client.patch(f"/api/v1/applications/{app['id']}", json={"notes": "Hi"})
    assert untouched.json()["job_url"] == "https://example.com/new"

    cleared = await client.patch(f"/api/v1/applications/{app['id']}", json={"job_url": None})
    assert cleared.json()["job_url"] is None
