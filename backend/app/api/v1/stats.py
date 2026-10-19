from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.schemas.stats import StatsOut
from app.services.reminders import today_in
from app.services.stats import compute_stats

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("", response_model=StatsOut)
async def get_stats(db: DbSession, user: CurrentUser):
    return await compute_stats(db, user.id, today_in(user.timezone))
