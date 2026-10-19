from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Job Tracker API"
    api_prefix: str = "/api/v1"

    database_url: str
    google_client_id: str

    jwt_secret: str = Field(min_length=32)
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7
    auth_cookie_name: str = "jt_session"
    cookie_secure: bool = False

    frontend_origin: str = "http://localhost:5173"

    logo_dev_publishable_key: str | None = None
    logo_dev_secret_key: str | None = None

    notification_job_interval_minutes: int = 60

    @field_validator("database_url")
    @classmethod
    def use_async_driver(cls, value: str) -> str:
        """Accept plain postgres URLs (e.g. from a hosting provider) and switch to asyncpg."""
        for prefix in ("postgres://", "postgresql://", "postgresql+psycopg2://"):
            if value.startswith(prefix):
                value = "postgresql+asyncpg://" + value.removeprefix(prefix)
                break
        # asyncpg does not understand libpq's sslmode / channel_binding query params.
        if value.startswith("postgresql+asyncpg://"):
            value = value.replace("sslmode=require", "ssl=require")
            value = (
                value.replace("&channel_binding=require", "")
                .replace("channel_binding=require&", "")
                .replace("?channel_binding=require", "")
            )
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
