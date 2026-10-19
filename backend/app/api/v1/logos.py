from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, Query, Response, status

from app.core.deps import CurrentUser, DbSession
from app.schemas.logo import LogoResolution
from app.services.logos import get_cached_image, resolve_logo

router = APIRouter(prefix="/logos", tags=["logos"])

IMAGE_CACHE_SECONDS = 60 * 60 * 24 * 30


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
):
    """Serve a cached logo. Public so it works in <img> tags; only cached logos are served."""
    asset = await get_cached_image(db, domain)
    if asset is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Logo not cached")
    return Response(
        content=asset.data,
        media_type=asset.content_type,
        headers={"Cache-Control": f"public, max-age={IMAGE_CACHE_SECONDS}"},
    )
