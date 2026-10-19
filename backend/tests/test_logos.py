import httpx

from app.core.config import get_settings
from app.models import LogoAsset
from app.services.logos import get_cached_image, resolve_logo

PNG = b"\x89PNG\r\n\x1a\nfake"


def make_transport(calls: list[str], logo_dev_ok: bool = True):
    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request.url.host)
        if request.url.host == "img.logo.dev":
            if logo_dev_ok:
                return httpx.Response(200, content=PNG, headers={"content-type": "image/png"})
            return httpx.Response(404)
        if request.url.host == "www.google.com":
            return httpx.Response(200, content=b"ico", headers={"content-type": "image/png"})
        return httpx.Response(404)

    return httpx.MockTransport(handler)


async def test_logo_is_fetched_once_and_served_from_cache(db, monkeypatch):
    monkeypatch.setattr(get_settings(), "logo_dev_publishable_key", "pk_test")
    calls: list[str] = []
    transport = make_transport(calls)

    first = await resolve_logo(db, "Stripe", None, transport=transport)
    assert first.domain == "stripe.com"
    assert first.logo_url == "/api/v1/logos/image/stripe.com"
    assert "logo.dev" not in first.logo_url

    second = await resolve_logo(db, "Stripe", None, transport=transport)
    assert second == first
    assert calls == ["img.logo.dev"]  # second lookup hit only the cache

    cached = await get_cached_image(db, "stripe.com")
    assert cached.data == PNG and cached.source == "logo.dev"


async def test_falls_back_to_favicon(db, monkeypatch):
    monkeypatch.setattr(get_settings(), "logo_dev_publishable_key", "pk_test")
    calls: list[str] = []
    result = await resolve_logo(
        db, None, "https://www.Example.org/about", transport=make_transport(calls, False)
    )
    assert result.domain == "example.org"
    assert calls == ["img.logo.dev", "www.google.com"]
    assert (await db.get(LogoAsset, "example.org")).source == "favicon"


async def test_image_endpoint_serves_cached_logo(client, db):
    from datetime import UTC, datetime

    db.add(
        LogoAsset(
            domain="acme.com", data=PNG, content_type="image/png", fetched_at=datetime.now(UTC)
        )
    )
    await db.commit()
    client.cookies.clear()  # public endpoint
    response = await client.get("/api/v1/logos/image/acme.com")
    assert response.status_code == 200
    assert response.content == PNG
    assert "max-age" in response.headers["cache-control"]
    assert (await client.get("/api/v1/logos/image/missing.com")).status_code == 404
