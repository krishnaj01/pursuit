from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Application, Stage, StageEvent
from app.schemas.stats import StageCount, StatsOut, UpcomingEvent, WeeklyCount

INTERVIEW_STAGES = frozenset({Stage.ROUND_1, Stage.ROUND_2, Stage.INTERVIEW})
WEEKS_OF_HISTORY = 12


def _week_start(day: date) -> date:
    return day - timedelta(days=day.weekday())


async def compute_stats(session: AsyncSession, user_id, today: date) -> StatsOut:
    apps = list(await session.scalars(select(Application).where(Application.user_id == user_id)))
    progressed_ids = set(
        await session.scalars(
            select(StageEvent.application_id)
            .join(Application)
            .where(Application.user_id == user_id, StageEvent.to_stage != Stage.APPLIED)
        )
    )

    total = len(apps)
    by_stage = {stage: 0 for stage in Stage}
    for app in apps:
        by_stage[app.stage] += 1

    rejected = by_stage[Stage.REJECTED]
    offers = by_stage[Stage.OFFER]
    responded = sum(1 for a in apps if a.id in progressed_ids or a.stage != Stage.APPLIED)

    this_week = _week_start(today)
    weeks = [this_week - timedelta(weeks=i) for i in range(WEEKS_OF_HISTORY - 1, -1, -1)]
    weekly = {w: 0 for w in weeks}
    for app in apps:
        week = _week_start(app.applied_on)
        if week in weekly:
            weekly[week] += 1

    upcoming = sorted(
        (a for a in apps if a.event_date and a.event_date >= today and a.stage != Stage.REJECTED),
        key=lambda a: a.event_date,
    )[:5]

    return StatsOut(
        total=total,
        active=total - rejected,
        rejected=rejected,
        offers=offers,
        interviewing=sum(by_stage[s] for s in INTERVIEW_STAGES),
        due_today=sum(
            1
            for a in apps
            if a.stage != Stage.REJECTED and a.next_reminder_on and a.next_reminder_on <= today
        ),
        response_rate=round(responded / total, 4) if total else 0.0,
        offer_rate=round(offers / total, 4) if total else 0.0,
        by_stage=[StageCount(stage=s, count=c) for s, c in by_stage.items() if c],
        weekly=[WeeklyCount(week_start=w, count=c) for w, c in weekly.items()],
        upcoming_events=[
            UpcomingEvent(
                application_id=str(a.id),
                company_name=a.company_name,
                role=a.role,
                stage=a.stage,
                custom_stage_label=a.custom_stage_label,
                event_date=a.event_date,  # type: ignore[arg-type]
            )
            for a in upcoming
        ],
    )
