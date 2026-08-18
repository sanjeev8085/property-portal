from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
import uuid
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.notification import Notification

router = APIRouter()


@router.get("")
async def list_notifications(
    unread_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all notifications for the current user."""
    query = select(Notification).where(
        Notification.user_id == current_user.id
    )
    if unread_only:
        query = query.where(Notification.is_read == False)
        
    query = query.order_by(Notification.created_at.desc())

    result = await db.execute(query)
    notifications = result.scalars().all()

    return [{
        "id": str(n.id),
        "type": n.type,
        "title": n.title,
        "body": n.body,
        "link": n.link,
        "is_read": n.is_read,
        "created_at": n.created_at,
    } for n in notifications]


@router.patch("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark a notification as read."""
    try:
        nid = uuid.UUID(notification_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid notification ID.")

    result = await db.execute(
        select(Notification).where(Notification.id == nid, Notification.user_id == current_user.id)
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found.")

    notification.is_read = True
    await db.commit()
    return {"message": "Marked as read."}


@router.patch("/read-all")
@router.post("/mark-all-read")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark all notifications as read (supports both PATCH /read-all and POST /mark-all-read)."""
    q = update(Notification).where(
        Notification.user_id == current_user.id
    ).values(is_read=True)
    await db.execute(q)
    await db.commit()
    return {"message": "All notifications marked as read."}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a notification."""
    try:
        nid = uuid.UUID(notification_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid notification ID.")

    q = delete(Notification).where(Notification.id == nid, Notification.user_id == current_user.id)
    result = await db.execute(q)
    await db.commit()
    return {"message": "Notification deleted."}

