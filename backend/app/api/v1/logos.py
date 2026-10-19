from typing import Annotated

from fastapi import APIRouter, Header, HTTPException, Path, Query, Response, status

from app.core.deps import CurrentUser, DbSession
from app.schemas.logo import LogoResolution
from app.services.logos import get_cached_image, resolve_logo

router = APIRouter(prefix="/logos", tags=["logos"])

IMAGE_CACHE_SECONDS = 60 * 60 * 24 * 30
# Serve a stale copy while revalidating in the background for a day past expiry.
IMAGE_CACHE_CONTROL = f"public, max-age={IMAGE_CACHE_SECONDS}, stale-while-revalidate=86400"


@router.get("/resolve", response_model=LogoResolution)
async def resolve(
    _: CurrentUser,
    db: DbSession,
    company: Annotated[str | None, Query(max_length=200)] = None,
    domain: Annotated[str | None, Query(max_length=255)] = None,
):
    if not (company or domain):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Provide a company or domain")
    return await resolve_logo(db, company, domain)


@router.get("/image/{domain}", response_class=Response)
async def image(
    db: DbSession,
    domain: Annotated[str, Path(max_length=255, pattern=r"^[a-zA-Z0-9.-]+$")],
    if_none_match: Annotated[str | None, Header()] = None,
):
    """Serve a cached logo. Public so it works in <img> tags; only cached logos are served."""
    cached = await get_cached_image(db, domain)
    if cached is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Logo not cached")
    headers = {"Cache-Control": IMAGE_CACHE_CONTROL, "ETag": cached.etag}
    if if_none_match and cached.etag in {tag.strip() for tag in if_none_match.split(",")}:
        return Response(status_code=status.HTTP_304_NOT_MODIFIED, headers=headers)
    return Response(content=cached.data, media_type=cached.content_type, headers=headers)
