import uuid
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import case, nulls_last, select
from sqlalchemy.orm import selectinload

from app.core.deps import CurrentUser, DbSession
from app.models import Application, Stage, StageEvent
from app.schemas.application import (
    ApplicationCreate,
    ApplicationFilter,
    ApplicationOut,
    ApplicationUpdate,
    ReminderUpdate,
    StageEventOut,
    StageUpdate,
)
from app.services import reminders

router = APIRouter(prefix="/applications", tags=["applications"])


async def _get_owned(db: DbSession, user: CurrentUser, app_id: uuid.UUID) -> Application:
    app = await db.scalar(
        select(Application)
        .options(selectinload(Application.stage_events))
        .where(Application.id == app_id, Application.user_id == user.id)
    )
    if app is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Application not found")
    return app


@router.get("", response_model=list[ApplicationOut])
async def list_applications(
    db: DbSession,
    user: CurrentUser,
    filter: Annotated[ApplicationFilter, Query()] = ApplicationFilter.ALL,  # noqa: A002
):
    today = reminders.today_in(user.timezone)
    query = select(Application).where(Application.user_id == user.id)
    active = Application.stage != Stage.REJECTED

    match filter:
        case ApplicationFilter.DUE:
            query = query.where(active, Application.next_reminder_on <= today)
        case ApplicationFilter.UPCOMING:
            query = query.where(active, Application.next_reminder_on > today)
        case ApplicationFilter.CLOSED:
            query = query.where(Application.stage == Stage.REJECTED)

    # Soonest (and overdue) reminders first; closed applications sink to the bottom.
    query = query.order_by(
        case((Application.stage == Stage.REJECTED, 1), else_=0),
        nulls_last(Application.next_reminder_on.asc()),
        Application.applied_on.desc(),
    )
    return list(await db.scalars(query))


@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
async def create_application(payload: ApplicationCreate, db: DbSession, user: CurrentUser):
    today = reminders.today_in(user.timezone)
    try:
        first_reminder = reminders.initial_reminder(
            today, payload.reminder_days, payload.reminder_on
        )
    except reminders.ReminderError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)) from exc
    data = payload.model_dump(exclude={"reminder_days", "reminder_on"})
    app = Application(
        **data,
        user_id=user.id,
        stage=Stage.APPLIED,
        next_reminder_on=first_reminder,
        stage_events=[StageEvent(from_stage=None, to_stage=Stage.APPLIED)],
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return app


@router.get("/{app_id}", response_model=ApplicationOut)
async def get_application(app_id: uuid.UUID, db: DbSession, user: CurrentUser):
    return await _get_owned(db, user, app_id)


@router.get("/{app_id}/history", response_model=list[StageEventOut])
async def get_history(app_id: uuid.UUID, db: DbSession, user: CurrentUser):
    return (await _get_owned(db, user, app_id)).stage_events


@router.patch("/{app_id}", response_model=ApplicationOut)
async def update_application(
    app_id: uuid.UUID, payload: ApplicationUpdate, db: DbSession, user: CurrentUser
):
    app = await _get_owned(db, user, app_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is None and field not in {"logo_url", "company_domain", "notes"}:
            continue  # required columns can't be cleared
        setattr(app, field, value)
    await db.commit()
    await db.refresh(app)
    return app


@router.patch("/{app_id}/stage", response_model=ApplicationOut)
async def update_stage(app_id: uuid.UUID, payload: StageUpdate, db: DbSession, user: CurrentUser):
    app = await _get_owned(db, user, app_id)
    reminders.apply_stage_change(app, payload, reminders.today_in(user.timezone))
    await db.commit()
    await db.refresh(app)
    return app


@router.post("/{app_id}/reminder", response_model=ApplicationOut)
async def set_next_reminder(
    app_id: uuid.UUID, payload: ReminderUpdate, db: DbSession, user: CurrentUser
):
    app = await _get_owned(db, user, app_id)
    try:
        reminders.schedule_next_reminder(app, payload, reminders.today_in(user.timezone))
    except reminders.ReminderError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)) from exc
    await db.commit()
    await db.refresh(app)
    return app


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(app_id: uuid.UUID, db: DbSession, user: CurrentUser) -> None:
    app = await _get_owned(db, user, app_id)
    await db.delete(app)
    await db.commit()
