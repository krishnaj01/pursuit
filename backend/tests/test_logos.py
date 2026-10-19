import io
import os
from datetime import UTC, datetime

import httpx
from PIL import Image

from app.core.config import get_settings
from app.models import LogoAsset
from app.services import logo_images
from app.services.logo_images import OUTPUT_SIZE, OUTPUT_TYPE, optimize_image
from app.services.logos import get_cached_image, resolve_logo


def png(size: int = 256) -> bytes:
    """A photo-like (noisy) PNG, so compression behaves like a real logo, not a flat fill."""
    out = io.BytesIO()
    Image.frombytes("RGB", (size, size), os.urandom(size * size * 3)).save(out, "PNG")
    return out.getvalue()


def flat_png(size: int) -> bytes:
    out = io.BytesIO()
    Image.new("RGBA", (size, size), "#635bff").save(out, "PNG")
    return out.getvalue()


def image_size(data: bytes) -> tuple[int, int]:
    with Image.open(io.BytesIO(data)) as img:
        return img.size


def make_transport(calls: list[str], logo_dev_ok: bool = True):
    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request.url.host)
        if request.url.host == "img.logo.dev":
            if logo_dev_ok:
                return httpx.Response(200, content=png(), headers={"content-type": "image/png"})
            return httpx.Response(404)
        if request.url.host == "www.google.com":
            return httpx.Response(200, content=png(64), headers={"content-type": "image/png"})
        return httpx.Response(404)

    return httpx.MockTransport(handler)


async def store(db, domain: str, data: bytes, content_type: str = "image/png") -> None:
    db.add(
        LogoAsset(domain=domain, data=data, content_type=content_type, fetched_at=datetime.now(UTC))
    )
    await db.commit()


def test_optimize_downscales_to_small_webp():
    original = png(512)
    optimized = optimize_image(original)
    assert optimized is not None
    assert optimized[8:12] == b"WEBP"
    assert image_size(optimized) == (OUTPUT_SIZE, OUTPUT_SIZE)
    assert len(optimized) < len(original)


def test_optimize_keeps_small_images_small_and_rejects_non_images():
    assert image_size(optimize_image(png(32))) == (32, 32)  # never upscales
    assert optimize_image(b"<svg xmlns='http://www.w3.org/2000/svg'/>") is None
    assert optimize_image(b"not an image") is None


async def test_logo_is_fetched_once_stored_as_webp_and_served(db, monkeypatch):
    monkeypatch.setattr(get_settings(), "logo_dev_publishable_key", "pk_test")
    calls: list[str] = []
    transport = make_transport(calls)

    first = await resolve_logo(db, "Stripe", None, transport=transport)
    assert first.domain == "stripe.com"
    assert first.logo_url == "/api/v1/logos/image/stripe.com"

    second = await resolve_logo(db, "Stripe", None, transport=transport)
    assert second == first
    assert calls == ["img.logo.dev"]  # second lookup hit only the database

    stored = await db.get(LogoAsset, "stripe.com")
    assert stored.source == "logo.dev"
    assert stored.content_type == OUTPUT_TYPE
    assert image_size(stored.data) == (OUTPUT_SIZE, OUTPUT_SIZE)


async def test_falls_back_to_favicon(db, monkeypatch):
    monkeypatch.setattr(get_settings(), "logo_dev_publishable_key", "pk_test")
    calls: list[str] = []
    result = await resolve_logo(
        db, None, "https://www.Example.org/about", transport=make_transport(calls, False)
    )
    assert result.domain == "example.org"
    assert calls == ["img.logo.dev", "www.google.com"]
    stored = await db.get(LogoAsset, "example.org")
    assert stored.source == "favicon" and stored.content_type == OUTPUT_TYPE


async def test_legacy_png_is_upgraded_on_first_serve(db):
    await store(db, "legacy.com", png(256))
    served = await get_cached_image(db, "legacy.com")
    assert served.content_type == OUTPUT_TYPE
    assert image_size(served.data) == (OUTPUT_SIZE, OUTPUT_SIZE)
    await db.refresh(row := await db.get(LogoAsset, "legacy.com"))
    assert row.content_type == OUTPUT_TYPE  # persisted, not just converted in memory


async def test_original_is_kept_when_webp_would_be_larger(db, monkeypatch):
    # e.g. some tiny favicons compress better as PNG than as WebP
    tiny = flat_png(16)
    monkeypatch.setattr(logo_images, "optimize_image", lambda data: data + b"padding")
    await store(db, "tiny.com", tiny)
    served = await get_cached_image(db, "tiny.com")
    assert served.data == tiny and served.content_type == "image/png"


async def test_undecodable_images_are_served_unchanged(db):
    svg = b"<svg xmlns='http://www.w3.org/2000/svg'/>"
    await store(db, "vector.com", svg, "image/svg+xml")
    served = await get_cached_image(db, "vector.com")
    assert served.data == svg and served.content_type == "image/svg+xml"


async def test_repeat_requests_are_served_from_memory(db):
    await store(db, "memo.com", png())
    first = await get_cached_image(db, "memo.com")
    await db.delete(await db.get(LogoAsset, "memo.com"))
    await db.commit()
    assert await get_cached_image(db, "memo.com") == first  # no database read needed


async def test_image_endpoint_caching_headers_and_revalidation(client, db):
    await store(db, "acme.com", png())
    client.cookies.clear()  # public endpoint

    response = await client.get("/api/v1/logos/image/acme.com")
    assert response.status_code == 200
    assert response.headers["content-type"] == OUTPUT_TYPE
    assert "max-age" in response.headers["cache-control"]
    etag = response.headers["etag"]

    revalidated = await client.get("/api/v1/logos/image/acme.com", headers={"If-None-Match": etag})
    assert revalidated.status_code == 304
    assert revalidated.content == b""
    assert revalidated.headers["etag"] == etag

    stale = await client.get("/api/v1/logos/image/acme.com", headers={"If-None-Match": '"old"'})
    assert stale.status_code == 200

    assert (await client.get("/api/v1/logos/image/missing.com")).status_code == 404
