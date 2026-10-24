import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select

from app.core.deps import DbSession, SessionUser
from app.core.security import generate_api_token
from app.models import ApiToken
from app.schemas.api_token import ApiTokenCreate, ApiTokenCreated, ApiTokenOut

router = APIRouter(prefix="/extension", tags=["extension"])

MAX_ACTIVE_TOKENS = 10


def _active(user_id: uuid.UUID):
    return (ApiToken.user_id == user_id, ApiToken.revoked_at.is_(None))


@router.post("/tokens", response_model=ApiTokenCreated, status_code=status.HTTP_201_CREATED)
async def create_token(payload: ApiTokenCreate, db: DbSession, user: SessionUser):
    active_count = await db.scalar(
        select(func.count()).select_from(ApiToken).where(*_active(user.id))
    )
    if (active_count or 0) >= MAX_ACTIVE_TOKENS:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="Too many connected extensions, disconnect one from your profile first",
        )
    token, prefix, token_hash = generate_api_token()
    api_token = ApiToken(user_id=user.id, name=payload.name, prefix=prefix, token_hash=token_hash)
    db.add(api_token)
    await db.commit()
    await db.refresh(api_token)
    return ApiTokenCreated(**ApiTokenOut.model_validate(api_token).model_dump(), token=token)


@router.get("/tokens", response_model=list[ApiTokenOut])
async def list_tokens(db: DbSession, user: SessionUser):
    return list(
        await db.scalars(
            select(ApiToken).where(*_active(user.id)).order_by(ApiToken.created_at.desc())
        )
    )


@router.delete("/tokens/{token_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_token(token_id: uuid.UUID, db: DbSession, user: SessionUser) -> None:
    api_token = await db.get(ApiToken, token_id)
    if api_token is None or api_token.user_id != user.id or api_token.revoked_at:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Token not found")
    api_token.revoked_at = datetime.now(UTC)
    await db.commit()
