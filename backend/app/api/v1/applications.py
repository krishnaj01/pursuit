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
    StageEventUpdate,
    StageUpdate,
)
from app.services import reminders, timeline

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


def _get_event(app: Application, event_id: uuid.UUID) -> StageEvent:
    event = next((e for e in app.stage_events if e.id == event_id), None)
    if event is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Timeline entry not found")
    return event


def _unprocessable(exc: Exception) -> HTTPException:
    return HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc))


async def _save(db: DbSession, app: Application) -> Application:
    await db.commit()
    await db.refresh(app)
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
        raise _unprocessable(exc) from exc
    data = payload.model_dump(exclude={"reminder_days", "reminder_on"})
    app = Application(
        **data,
        user_id=user.id,
        stage=Stage.APPLIED,
        next_reminder_on=first_reminder,
        stage_events=[
            StageEvent(from_stage=None, to_stage=Stage.APPLIED, occurred_on=payload.applied_on)
        ],
    )
    db.add(app)
    return await _save(db, app)


@router.get("/{app_id}", response_model=ApplicationOut)
async def get_application(app_id: uuid.UUID, db: DbSession, user: CurrentUser):
    return await _get_owned(db, user, app_id)


@router.get("/{app_id}/history", response_model=list[StageEventOut])
async def get_history(app_id: uuid.UUID, db: DbSession, user: CurrentUser):
    return (await _get_owned(db, user, app_id)).stage_events


@router.patch("/{app_id}/history/{event_id}", response_model=ApplicationOut)
async def edit_history_entry(
    app_id: uuid.UUID,
    event_id: uuid.UUID,
    payload: StageEventUpdate,
    db: DbSession,
    user: CurrentUser,
):
    app = await _get_owned(db, user, app_id)
    try:
        timeline.edit_event(
            app, _get_event(app, event_id), payload, reminders.today_in(user.timezone)
        )
    except reminders.ReminderError as exc:
        raise _unprocessable(exc) from exc
    return await _save(db, app)


@router.delete("/{app_id}/history/{event_id}", response_model=ApplicationOut)
async def delete_history_entry(
    app_id: uuid.UUID, event_id: uuid.UUID, db: DbSession, user: CurrentUser
):
    app = await _get_owned(db, user, app_id)
    try:
        timeline.delete_event(app, _get_event(app, event_id), reminders.today_in(user.timezone))
    except reminders.ReminderError as exc:
        raise _unprocessable(exc) from exc
    return await _save(db, app)


@router.patch("/{app_id}", response_model=ApplicationOut)
async def update_application(
    app_id: uuid.UUID, payload: ApplicationUpdate, db: DbSession, user: CurrentUser
):
    app = await _get_owned(db, user, app_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is None and field not in {"logo_url", "company_domain", "notes"}:
            continue  # required columns can't be cleared
        setattr(app, field, value)
    if payload.applied_on and app.stage_events:
        app.stage_events[0].occurred_on = payload.applied_on  # keep the timeline in step
    return await _save(db, app)


@router.patch("/{app_id}/stage", response_model=ApplicationOut)
async def update_stage(app_id: uuid.UUID, payload: StageUpdate, db: DbSession, user: CurrentUser):
    app = await _get_owned(db, user, app_id)
    reminders.apply_stage_change(app, payload, reminders.today_in(user.timezone))
    return await _save(db, app)


@router.post("/{app_id}/reminder", response_model=ApplicationOut)
async def set_next_reminder(
    app_id: uuid.UUID, payload: ReminderUpdate, db: DbSession, user: CurrentUser
):
    app = await _get_owned(db, user, app_id)
    try:
        reminders.schedule_next_reminder(app, payload, reminders.today_in(user.timezone))
    except reminders.ReminderError as exc:
        raise _unprocessable(exc) from exc
    return await _save(db, app)


@router.delete("/{app_id}/reminder", response_model=ApplicationOut)
async def clear_reminder(app_id: uuid.UUID, db: DbSession, user: CurrentUser):
    app = await _get_owned(db, user, app_id)
    reminders.clear_reminder(app)
    return await _save(db, app)


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(app_id: uuid.UUID, db: DbSession, user: CurrentUser) -> None:
    app = await _get_owned(db, user, app_id)
    await db.delete(app)
    await db.commit()
