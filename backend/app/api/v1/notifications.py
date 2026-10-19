import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select, update

from app.core.deps import CurrentUser, DbSession
from app.models import Notification
from app.schemas.notification import NotificationList, NotificationOut
from app.services.notifications import generate_for_user

router = APIRouter(prefix="/notifications", tags=["notifications"])

HISTORY_LIMIT = 30


@router.get("", response_model=NotificationList)
async def list_notifications(db: DbSession, user: CurrentUser):
    # Lazily make sure today's digest exists, even if the scheduler hasn't run yet.
    await generate_for_user(db, user)
    items = await db.scalars(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.for_date.desc())
        .limit(HISTORY_LIMIT)
    )
    unread = await db.scalar(
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == user.id, Notification.read_at.is_(None))
    )
    return NotificationList(items=list(items), unread_count=unread or 0)


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_read(db: DbSession, user: CurrentUser) -> None:
    await db.execute(
        update(Notification)
        .where(Notification.user_id == user.id, Notification.read_at.is_(None))
        .values(read_at=datetime.now(UTC))
    )
    await db.commit()


@router.post("/{notification_id}/read", response_model=NotificationOut)
async def mark_read(notification_id: uuid.UUID, db: DbSession, user: CurrentUser):
    notification = await db.get(Notification, notification_id)
    if notification is None or notification.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Notification not found")
    if notification.read_at is None:
        notification.read_at = datetime.now(UTC)
        await db.commit()
    return notification
