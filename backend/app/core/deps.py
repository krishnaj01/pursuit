from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import (
    API_TOKEN_PREFIX,
    InvalidTokenError,
    decode_access_token,
    hash_api_token,
)
from app.db.session import get_db
from app.models import ApiToken, User

DbSession = Annotated[AsyncSession, Depends(get_db)]
SessionCookie = Annotated[str | None, Cookie(alias=get_settings().auth_cookie_name)]
BearerCredentials = Annotated[
    HTTPAuthorizationCredentials | None, Depends(HTTPBearer(auto_error=False))
]

# Avoid a database write on every extension request just to record usage.
LAST_USED_RESOLUTION = timedelta(minutes=5)


def _unauthorized() -> HTTPException:
    return HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")


async def _user_from_cookie(db: AsyncSession, session_token: str | None) -> User:
    if not session_token:
        raise _unauthorized()
    try:
        user_id = decode_access_token(session_token)
    except InvalidTokenError as exc:
        raise _unauthorized() from exc
    user = await db.get(User, user_id)
    if user is None:
        raise _unauthorized()
    return user


async def _user_from_api_token(db: AsyncSession, token: str) -> User:
    if not token.startswith(API_TOKEN_PREFIX):
        raise _unauthorized()
    api_token = await db.scalar(
        select(ApiToken).where(
            ApiToken.token_hash == hash_api_token(token), ApiToken.revoked_at.is_(None)
        )
    )
    if api_token is None:
        raise _unauthorized()
    user = await db.get(User, api_token.user_id)
    if user is None:
        raise _unauthorized()

    now = datetime.now(UTC)
    last_used = api_token.last_used_at
    if last_used is None or now - last_used.replace(tzinfo=last_used.tzinfo or UTC) > (
        LAST_USED_RESOLUTION
    ):
        await db.execute(
            update(ApiToken).where(ApiToken.id == api_token.id).values(last_used_at=now)
        )
        await db.commit()
    return user


async def get_current_user(
    db: DbSession, bearer: BearerCredentials = None, session_token: SessionCookie = None
) -> User:
    """Website session cookie, or a personal access token (browser extension)."""
    if bearer is not None:
        return await _user_from_api_token(db, bearer.credentials)
    return await _user_from_cookie(db, session_token)


async def get_session_user(db: DbSession, session_token: SessionCookie = None) -> User:
    """Website session only. Used for sensitive actions an extension token must not perform:
    managing tokens, exporting data and deleting the account."""
    return await _user_from_cookie(db, session_token)


CurrentUser = Annotated[User, Depends(get_current_user)]
SessionUser = Annotated[User, Depends(get_session_user)]
