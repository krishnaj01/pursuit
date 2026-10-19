import csv
import io
from datetime import timedelta

from sqlalchemy import func, select

from app.models import Application, Notification, StageEvent, User
from app.services.reminders import today_in

TODAY = today_in("UTC")


async def add(client, **extra):
    payload = {
        "company_name": "Stripe",
        "company_domain": "stripe.com",
        "role": "Backend Engineer",
        "applied_on": (TODAY - timedelta(days=5)).isoformat(),
        "reminder_days": 0,
    } | extra
    response = await client.post("/api/v1/applications", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def parse(text: str) -> list[dict]:
    return list(csv.DictReader(io.StringIO(text.removeprefix("﻿"))))


async def test_export_csv_contains_applications_and_timeline(client):
    app = await add(
        client,
        notes="Referred by Priya",
        logo_url="/api/v1/logos/image/stripe.com",
        job_url="https://stripe.com/jobs/123",
    )
    await client.patch(
        f"/api/v1/applications/{app['id']}/stage",
        json={"stage": "interview", "event_date": (TODAY + timedelta(days=3)).isoformat()},
    )

    response = await client.get("/api/v1/account/export.csv")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "attachment" in response.headers["content-disposition"]

    [row] = parse(response.text)
    assert row["Company"] == "Stripe"
    assert row["Stage"] == "Interview"
    assert row["Notes"] == "Referred by Priya"
    assert row["Job URL"] == "https://stripe.com/jobs/123"
    assert row["Timeline"].startswith("Applied (")
    assert row["Custom logo URL"] == ""
    assert "Interview (" in row["Timeline"]


async def test_export_neutralises_spreadsheet_formulas(client):
    await add(client, company_name='=HYPERLINK("http://evil")', notes="+cmd|' /C calc'!A0")
    [row] = parse((await client.get("/api/v1/account/export.csv")).text)
    assert row["Company"].startswith("'=")
    assert row["Notes"].startswith("'+")


async def test_export_only_includes_own_data(client, db):
    other = User(google_sub="other", email="b@example.com", name="Bo", timezone="UTC")
    db.add(other)
    await db.flush()
    db.add(Application(user_id=other.id, company_name="Secret Co", role="SWE", applied_on=TODAY))
    await db.commit()
    await add(client)
    rows = parse((await client.get("/api/v1/account/export.csv")).text)
    assert [r["Company"] for r in rows] == ["Stripe"]


async def test_delete_account_requires_matching_email(client):
    response = await client.request(
        "DELETE", "/api/v1/account", json={"confirm_email": "wrong@example.com"}
    )
    assert response.status_code == 422
    assert (await client.get("/api/v1/auth/me")).status_code == 200


async def test_delete_account_removes_everything(client, db, user):
    app = await add(client)
    await client.get("/api/v1/notifications")  # creates today's digest
    await client.patch(f"/api/v1/applications/{app['id']}/stage", json={"stage": "rejected"})

    response = await client.request(
        "DELETE", "/api/v1/account", json={"confirm_email": "  A@Example.com "}
    )
    assert response.status_code == 204
    assert "jt_session" in response.headers.get("set-cookie", "")

    for model in (User, Application, StageEvent, Notification):
        assert await db.scalar(select(func.count()).select_from(model)) == 0
    assert (await client.get("/api/v1/auth/me")).status_code == 401
