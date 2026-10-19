from pydantic import BaseModel


class LogoResolution(BaseModel):
    domain: str | None
    logo_url: str | None
    fallback_url: str | None
