from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.core.deps import CurrentUser
from app.schemas.logo import LogoResolution
from app.services.logos import resolve_logo

router = APIRouter(prefix="/logos", tags=["logos"])


@router.get("/resolve", response_model=LogoResolution)
async def resolve(
    _: CurrentUser,
    company: Annotated[str | None, Query(max_length=200)] = None,
    domain: Annotated[str | None, Query(max_length=255)] = None,
):
    if not (company or domain):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Provide a company or domain")
    return await resolve_logo(company, domain)
