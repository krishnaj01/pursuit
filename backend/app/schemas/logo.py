from pydantic import BaseModel


class LogoResolution(BaseModel):
    domain: str | None
    # Path to our cached copy (e.g. /api/v1/logos/image/stripe.com), never the upstream URL.
    logo_url: str | None
