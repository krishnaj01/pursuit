import logging
from urllib.parse import quote

import httpx
from slugify import slugify

from app.core.config import get_settings
from app.schemas.logo import LogoResolution

logger = logging.getLogger(__name__)

LOGO_DEV_SEARCH_URL = "https://api.logo.dev/search"
LOGO_DEV_IMG_URL = "https://img.logo.dev/{domain}?token={token}&size=128&format=png&retina=true"
FAVICON_URL = "https://www.google.com/s2/favicons?domain={domain}&sz=128"


async def _search_domain(company: str, secret_key: str) -> str | None:
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
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
    if isinstance(results, list) and results:
        return results[0].get("domain")
    return None


def _guess_domain(company: str) -> str | None:
    slug = slugify(company, separator="")
    return f"{slug}.com" if slug else None


async def resolve_logo(company: str | None, domain: str | None) -> LogoResolution:
    settings = get_settings()
    if not domain and company:
        if settings.logo_dev_secret_key:
            domain = await _search_domain(company, settings.logo_dev_secret_key)
        domain = domain or _guess_domain(company)
    if not domain:
        return LogoResolution(domain=None, logo_url=None, fallback_url=None)

    domain = domain.strip().lower()
    fallback = FAVICON_URL.format(domain=quote(domain))
    primary = (
        LOGO_DEV_IMG_URL.format(domain=quote(domain), token=settings.logo_dev_publishable_key)
        if settings.logo_dev_publishable_key
        else fallback
    )
    return LogoResolution(domain=domain, logo_url=primary, fallback_url=fallback)
