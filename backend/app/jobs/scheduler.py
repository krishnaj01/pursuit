import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.services.notifications import generate_for_all_users

logger = logging.getLogger(__name__)


async def run_notification_job() -> None:
    async with SessionLocal() as session:
        count = await generate_for_all_users(session)
    logger.info("Reminder digest job finished: %d users with due applications", count)


def build_scheduler() -> AsyncIOScheduler:
    # Runs frequently so each user's digest appears soon after their local midnight.
    scheduler = AsyncIOScheduler(timezone="UTC")
    scheduler.add_job(
        run_notification_job,
        "interval",
        minutes=get_settings().notification_job_interval_minutes,
        id="reminder-digest",
        next_run_time=None,
        coalesce=True,
        max_instances=1,
    )
    return scheduler
