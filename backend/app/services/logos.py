"""Company logo lookup with a database cache.

Logos are downloaded from logo.dev (falling back to Google's favicon service) once per
domain, normalised to small WebP images and stored in `logo_assets`. Applications reference
our own image endpoint, so rendering a table never hits the upstream API and its rate limits.
"""

import logging
from datetime import UTC, datetime, timedelta

import httpx
from slugify import slugify
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models import CompanyDomain, LogoAsset
from app.schemas.logo import LogoResolution
from app.services import logo_images
from app.services.logo_images import CachedImage

logger = logging.getLogger(__name__)

LOGO_DEV_SEARCH_URL = "https://api.logo.dev/search"
LOGO_DEV_IMG_URL = "https://img.logo.dev/{domain}"
FAVICON_URL = "https://www.google.com/s2/favicons"

MAX_LOGO_BYTES = 512 * 1024
FAILED_LOOKUP_RETRY = timedelta(days=7)
HTTP_TIMEOUT = 5.0


def normalize_domain(domain: str) -> str:
    domain = domain.strip().lower().removeprefix("https://").removeprefix("http://")
    return domain.split("/")[0].removeprefix("www.")


def image_path(domain: str) -> str:
    return f"{get_settings().api_prefix}/logos/image/{domain}"


async def _search_domain(client: httpx.AsyncClient, company: str, secret_key: str) -> str | None:
    try:
        response = await client.get(
            LOGO_DEV_SEARCH_URL,
            params={"q": company},
            headers={"Authorization": f"Bearer {secret_key}"},
        )
        response.raise_for_status()
        results = response.json()
    except (httpx.HTTPError, ValueError):
        logger.warning("logo.dev search failed for %r", company, exc_info=True)
        return None
    if isinstance(results, list) and results and results[0].get("domain"):
        return normalize_domain(results[0]["domain"])
    return None


async def _resolve_domain(
    session: AsyncSession, client: httpx.AsyncClient, company: str
) -> str | None:
    key = slugify(company)
    if not key:
        return None
    cached = await session.get(CompanyDomain, key)
    if cached:
        return cached.domain

    secret = get_settings().logo_dev_secret_key
    domain = await _search_domain(client, company, secret) if secret else None
    domain = domain or f"{slugify(company, separator='')}.com"

    session.add(CompanyDomain(lookup_key=key, domain=domain))
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
    return domain


async def _download(client: httpx.AsyncClient, url: str, params: dict) -> tuple[bytes, str] | None:
    try:
        response = await client.get(url, params=params, follow_redirects=True)
    except httpx.HTTPError:
        logger.warning("Logo download failed: %s", url, exc_info=True)
        return None
    content_type = response.headers.get("content-type", "").split(";")[0]
    if (
        response.status_code != 200
        or not content_type.startswith("image/")
        or not response.content
        or len(response.content) > MAX_LOGO_BYTES
    ):
        return None
    return response.content, content_type


async def _fetch_upstream(client: httpx.AsyncClient, domain: str) -> tuple[bytes, str, str] | None:
    token = get_settings().logo_dev_publishable_key
    if token:
        logo = await _download(
            client,
            LOGO_DEV_IMG_URL.format(domain=domain),
            # fallback=404 makes unknown domains fail instead of returning a monogram.
            {"token": token, "size": logo_images.OUTPUT_SIZE, "format": "png", "fallback": "404"},
        )
        if logo:
            return *logo, "logo.dev"
    favicon_params = {"domain": domain, "sz": logo_images.OUTPUT_SIZE}
    favicon = await _download(client, FAVICON_URL, favicon_params)
    if favicon:
        return *favicon, "favicon"
    return None


def _aware(moment: datetime) -> datetime:
    return moment if moment.tzinfo else moment.replace(tzinfo=UTC)


async def get_or_fetch_asset(
    session: AsyncSession, client: httpx.AsyncClient, domain: str
) -> LogoAsset | None:
    asset = await session.get(LogoAsset, domain)
    now = datetime.now(UTC)
    if asset and (asset.data or now - _aware(asset.fetched_at) < FAILED_LOOKUP_RETRY):
        return asset if asset.data else None

    fetched = await _fetch_upstream(client, domain)
    if asset is None:
        asset = LogoAsset(domain=domain)
        session.add(asset)
    if fetched:
        data, content_type, asset.source = fetched
        asset.data, asset.content_type = logo_images.normalize_for_storage(data, content_type)
    else:
        asset.data, asset.content_type, asset.source = None, None, None
    asset.fetched_at = now
    logo_images.cache_forget(domain)
    try:
        await session.commit()
    except IntegrityError:
        # Another request cached it concurrently.
        await session.rollback()
        asset = await session.get(LogoAsset, domain)
    return asset if asset and asset.data else None


async def resolve_logo(
    session: AsyncSession,
    company: str | None,
    domain: str | None,
    transport: httpx.AsyncBaseTransport | None = None,
) -> LogoResolution:
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT, transport=transport) as client:
        if domain:
            domain = normalize_domain(domain)
        elif company:
            domain = await _resolve_domain(session, client, company)
        if not domain:
            return LogoResolution(domain=None, logo_url=None)
        asset = await get_or_fetch_asset(session, client, domain)
    return LogoResolution(domain=domain, logo_url=image_path(domain) if asset else None)


async def get_cached_image(session: AsyncSession, domain: str) -> CachedImage | None:
    """Serve a stored logo, from memory when possible.

    Logos stored before WebP normalisation existed are converted the first time they're
    served, so existing data upgrades itself without a separate migration step.
    """
    domain = normalize_domain(domain)
    if cached := logo_images.cache_get(domain):
        return cached

    asset = await session.get(LogoAsset, domain)
    if asset is None or not asset.data or not asset.content_type:
        return None
    if asset.content_type != logo_images.OUTPUT_TYPE:
        data, content_type = logo_images.normalize_for_storage(asset.data, asset.content_type)
        if data is not asset.data:  # only persist when optimising actually helped
            asset.data, asset.content_type = data, content_type
            await session.commit()
    return logo_images.cache_put(domain, asset.data, asset.content_type)
