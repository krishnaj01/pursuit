import logging
from pathlib import Path

from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy.ext.asyncio import AsyncEngine

logger = logging.getLogger(__name__)

ALEMBIC_INI = Path(__file__).resolve().parents[2] / "alembic.ini"


async def warn_if_schema_outdated(engine: AsyncEngine) -> None:
    """Log loudly when the database is behind the code's migrations.

    An outdated schema otherwise surfaces as confusing 500s on individual endpoints.
    """
    try:
        script = ScriptDirectory.from_config(Config(str(ALEMBIC_INI)))
        heads = set(script.get_heads())
        async with engine.connect() as conn:
            current = await conn.run_sync(
                lambda sync_conn: set(MigrationContext.configure(sync_conn).get_current_heads())
            )
    except Exception:
        logger.exception("Could not verify the database migration state")
        return
    if current != heads:
        logger.error(
            "Database schema is out of date (at %s, code expects %s). "
            "Run `uv run alembic upgrade head` in backend/.",
            ", ".join(sorted(current)) or "nothing",
            ", ".join(sorted(heads)),
        )
