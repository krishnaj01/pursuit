from sqlalchemy import func, select

from app.models import ApiToken
from app.services.reminders import today_in

TODAY = today_in("UTC").isoformat()


async def new_token(client) -> dict:
    response = await client.post("/api/v1/extension/tokens", json={"name": "Chrome"})
    assert response.status_code == 201, response.text
    return response.json()


def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def test_token_lifecycle_and_bearer_auth(client):
    created = await new_token(client)
    token = created["token"]
    assert token.startswith("pst_") and created["prefix"] == token[:12]

    listed = (await client.get("/api/v1/extension/tokens")).json()
    assert [t["id"] for t in listed] == [created["id"]]
    assert "token" not in listed[0]  # plaintext is never shown again

    # The extension has no cookie, only the token.
    session_cookies = dict(client.cookies)
    client.cookies.clear()
    me = await client.get("/api/v1/auth/me", headers=bearer(token))
    assert me.status_code == 200 and me.json()["email"] == "a@example.com"

    payload = {"company_name": "Ramp", "role": "SWE", "applied_on": TODAY, "reminder_days": 3}
    logged = await client.post("/api/v1/applications", json=payload, headers=bearer(token))
    assert logged.status_code == 201

    # Records when the extension was last used.
    client.cookies.update(session_cookies)
    listed = (await client.get("/api/v1/extension/tokens")).json()
    assert listed[0]["last_used_at"] is not None

    revoked = await client.delete(f"/api/v1/extension/tokens/{created['id']}")
    assert revoked.status_code == 204
    client.cookies.clear()
    assert (await client.get("/api/v1/auth/me", headers=bearer(token))).status_code == 401


async def test_invalid_tokens_are_rejected(client):
    client.cookies.clear()
    for token in ("pst_not-a-real-token", "not-even-prefixed", ""):
        response = await client.get("/api/v1/applications", headers=bearer(token))
        assert response.status_code == 401, token


async def test_tokens_cannot_perform_sensitive_actions(client):
    token = (await new_token(client))["token"]
    client.cookies.clear()
    for method, path, body in (
        ("POST", "/api/v1/extension/tokens", {"name": "x"}),
        ("GET", "/api/v1/extension/tokens", None),
        ("GET", "/api/v1/account/export.csv", None),
        ("DELETE", "/api/v1/account", {"confirm_email": "a@example.com"}),
    ):
        response = await client.request(method, path, json=body, headers=bearer(token))
        assert response.status_code == 401, (method, path)


async def test_active_token_limit(client):
    for _ in range(10):
        await new_token(client)
    over = await client.post("/api/v1/extension/tokens", json={})
    assert over.status_code == 409


async def test_lookup_finds_duplicates_by_link_or_company_and_role(client):
    base = {"role": "Backend Engineer", "applied_on": TODAY, "reminder_days": 3}
    stripe = (
        await client.post(
            "/api/v1/applications",
            json=base
            | {
                "company_name": "Stripe",
                "job_url": "https://stripe.com/jobs/listing/backend/123?gh_jid=42&utm_source=x",
            },
        )
    ).json()
    await client.post("/api/v1/applications", json=base | {"company_name": "Linear"})

    async def lookup(**params) -> list[str]:
        response = await client.get("/api/v1/applications/lookup", params=params)
        assert response.status_code == 200, response.text
        return [a["company_name"] for a in response.json()]

    # Same posting, different tracking params / www / trailing slash / fragment.
    assert await lookup(
        job_url="http://www.stripe.com/jobs/listing/backend/123/?ref=li&gh_jid=42#apply"
    ) == ["Stripe"]
    # A different job id is a different posting.
    assert await lookup(job_url="https://stripe.com/jobs/listing/backend/123?gh_jid=43") == []
    # Company + role, ignoring case and spacing.
    assert await lookup(company="  linear ", role="backend   ENGINEER") == ["Linear"]
    assert await lookup(company="Linear", role="Designer") == []

    missing = await client.get("/api/v1/applications/lookup", params={"company": "Linear"})
    assert missing.status_code == 400
    assert stripe["job_url"].startswith("https://stripe.com/jobs/listing/backend/123")


async def test_deleting_the_account_removes_tokens(client, db):
    await new_token(client)
    response = await client.request(
        "DELETE", "/api/v1/account", json={"confirm_email": "a@example.com"}
    )
    assert response.status_code == 204
    assert await db.scalar(select(func.count()).select_from(ApiToken)) == 0


async def test_last_used_is_not_rewritten_on_every_request(client, db):
    token = (await new_token(client))["token"]
    client.cookies.clear()
    await client.get("/api/v1/applications", headers=bearer(token))
    first = (await db.scalars(select(ApiToken.last_used_at))).one()
    await client.get("/api/v1/applications", headers=bearer(token))
    await db.close()
    second = (await db.scalars(select(ApiToken.last_used_at))).one()
    assert first is not None and second == first
