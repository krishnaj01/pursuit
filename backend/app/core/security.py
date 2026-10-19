import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.core.config import get_settings


class InvalidTokenError(Exception):
    pass


def verify_google_id_token(token: str) -> dict:
    """Verify a Google Identity Services ID token and return its claims."""
    settings = get_settings()
    try:
        claims = id_token.verify_oauth2_token(
            token, google_requests.Request(), settings.google_client_id
        )
    except ValueError as exc:
        raise InvalidTokenError(str(exc)) from exc
    if not claims.get("email_verified", False):
        raise InvalidTokenError("Google account email is not verified")
    return claims


def create_access_token(user_id: UUID) -> str:
    settings = get_settings()
    now = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> UUID:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError) as exc:
        raise InvalidTokenError("Invalid or expired session") from exc


API_TOKEN_PREFIX = "pst_"
API_TOKEN_DISPLAY_LENGTH = 12


def hash_api_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def generate_api_token() -> tuple[str, str, str]:
    """Return (plaintext token, display prefix, hash) for a new personal access token."""
    token = API_TOKEN_PREFIX + secrets.token_urlsafe(32)
    return token, token[:API_TOKEN_DISPLAY_LENGTH], hash_api_token(token)
