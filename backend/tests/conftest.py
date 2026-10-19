import os

# Tests must never pick up a developer's real .env (database, Google or logo.dev keys):
# explicit environment variables take precedence over the .env file in pydantic-settings.
os.environ.update(
    DATABASE_URL="sqlite+aiosqlite:///:memory:",
    GOOGLE_CLIENT_ID="test-client-id",
    JWT_SECRET="test-secret-" + "x" * 32,
    LOGO_DEV_PUBLISHABLE_KEY="",
    LOGO_DEV_SECRET_KEY="",
)

import pytest  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.core.config import get_settings  # noqa: E402
from app.core.security import create_access_token  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models import User  # noqa: E402


@pytest.fixture
async def session_factory():
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield async_sessionmaker(engine, expire_on_commit=False)
    await engine.dispose()


@pytest.fixture
async def db(session_factory):
    async with session_factory() as session:
        yield session


@pytest.fixture
async def user(db):
    user = User(google_sub="sub-1", email="a@example.com", name="Ada", timezone="UTC")
    db.add(user)
    await db.commit()
    return user


@pytest.fixture
async def client(session_factory, user):
    async def override_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        ac.cookies.set(get_settings().auth_cookie_name, create_access_token(user.id))
        yield ac
    app.dependency_overrides.clear()
