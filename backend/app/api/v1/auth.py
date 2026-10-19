from fastapi import APIRouter, HTTPException, Response, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import select

from app.core.config import get_settings
from app.core.deps import CurrentUser, DbSession
from app.core.security import InvalidTokenError, create_access_token, verify_google_id_token
from app.models import User
from app.schemas.user import GoogleLoginRequest, UserOut
from app.services.reminders import safe_zone

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_session_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token,
        max_age=settings.jwt_expire_minutes * 60,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )


@router.post("/google", response_model=UserOut)
async def login_with_google(payload: GoogleLoginRequest, response: Response, db: DbSession):
    try:
        # google-auth performs blocking HTTP to fetch Google's certs.
        claims = await run_in_threadpool(verify_google_id_token, payload.id_token)
    except InvalidTokenError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    timezone = safe_zone(payload.timezone).key
    user = await db.scalar(select(User).where(User.google_sub == claims["sub"]))
    if user is None:
        user = User(google_sub=claims["sub"])
        db.add(user)
    user.email = claims["email"]
    user.name = claims.get("name") or claims["email"].split("@")[0]
    user.avatar_url = claims.get("picture")
    user.timezone = timezone
    await db.commit()
    await db.refresh(user)

    _set_session_cookie(response, create_access_token(user.id))
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response) -> None:
    response.delete_cookie(get_settings().auth_cookie_name, path="/")


@router.get("/me", response_model=UserOut)
async def me(user: CurrentUser):
    return user
