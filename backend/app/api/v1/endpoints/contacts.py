"""Contact credits & atomic lead unlock endpoints."""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError

from app.api.deps import get_current_active_user, require_verified_mobile, get_optional_user
from app.models.user import User
from app.models.property import Property
from app.models.monetization import ContactCredit, ContactUnlock
from app.core.database import get_db

router = APIRouter()


class UnlockContactPayload(BaseModel):
    property_id: str


@router.get("/credits")
async def get_credits(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the user's current contact credit balance."""
    result = await db.execute(select(ContactCredit).where(ContactCredit.user_id == current_user.id))
    credits = result.scalar_one_or_none()
    if not credits:
        return {"total_credits": 0, "used_credits": 0, "available_credits": 0}
    return {
        "total_credits": credits.total_credits,
        "used_credits": credits.used_credits,
        "available_credits": credits.available_credits,
    }


async def _execute_atomic_unlock(property_id_str: str, current_user: User, db: AsyncSession):
    try:
        pid = uuid.UUID(property_id_str)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid property ID format.")

    prop_result = await db.execute(select(Property).where(Property.id == pid))
    prop = prop_result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found.")

    # Check if already unlocked
    dup_result = await db.execute(
        select(ContactUnlock).where(ContactUnlock.user_id == current_user.id, ContactUnlock.property_id == pid)
    )
    dup = dup_result.scalar_one_or_none()
    if dup:
        owner_result = await db.execute(select(User).where(User.id == prop.owner_id))
        owner = owner_result.scalar_one_or_none()
        phone = prop.contact_phone or (owner.mobile if owner else "")
        return {
            "message": "Already unlocked.",
            "contact_phone": phone,
            "contact_whatsapp": prop.contact_whatsapp or phone,
            "contact": {
                "name": prop.contact_name or (owner.name if owner else "Verified Owner"),
                "phone": phone,
                "email": prop.contact_email or (owner.email if owner else ""),
            }
        }

    # Atomic Credit Check & Deduction (Concurrency Safe)
    # Deducts 1 credit only if total_credits > used_credits
    deduct_stmt = (
        update(ContactCredit)
        .where(
            ContactCredit.user_id == current_user.id,
            ContactCredit.total_credits > ContactCredit.used_credits
        )
        .values(used_credits=ContactCredit.used_credits + 1)
    )
    res = await db.execute(deduct_stmt)
    if res.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Insufficient contact credits. Please purchase a contact pack.",
        )

    # Insert Unlocked Contact Record with Unique Constraint
    unlock_entry = ContactUnlock(
        user_id=current_user.id,
        property_id=pid,
        owner_id=prop.owner_id,
        credit_used=1
    )
    db.add(unlock_entry)

    try:
        await db.commit()
    except IntegrityError:
        # Concurrent request already inserted unlock row
        await db.rollback()

    # Trigger notification to owner
    if prop.owner_id:
        try:
            from app.services.notification_service import send_contact_unlocked_notification
            await send_contact_unlocked_notification(
                owner_id=prop.owner_id,
                property_title=prop.title,
                user_name=current_user.name,
                db=db
            )
        except Exception:
            pass

    owner_result = await db.execute(select(User).where(User.id == prop.owner_id))
    owner = owner_result.scalar_one_or_none()
    phone = prop.contact_phone or (owner.mobile if owner else "")

    return {
        "message": "Contact unlocked successfully.",
        "contact_phone": phone,
        "contact_whatsapp": prop.contact_whatsapp or phone,
        "contact": {
            "name": prop.contact_name or (owner.name if owner else "Verified Owner"),
            "phone": phone,
            "email": prop.contact_email or (owner.email if owner else ""),
        }
    }


@router.post("/unlock/{property_id}")
async def unlock_contact_by_path(
    property_id: str,
    current_user: User = Depends(require_verified_mobile),
    db: AsyncSession = Depends(get_db),
):
    """Unlock owner contact by URL parameter."""
    return await _execute_atomic_unlock(property_id, current_user, db)


@router.post("/unlock")
async def unlock_contact_by_body(
    payload: UnlockContactPayload,
    current_user: User = Depends(require_verified_mobile),
    db: AsyncSession = Depends(get_db),
):
    """Unlock owner contact by JSON payload."""
    return await _execute_atomic_unlock(payload.property_id, current_user, db)


@router.get("/unlocked")
async def list_unlocked_contacts(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """List all previously unlocked owner contacts."""
    result = await db.execute(
        select(ContactUnlock).where(ContactUnlock.user_id == current_user.id).order_by(ContactUnlock.unlocked_at.desc())
    )
    unlocks = result.scalars().all()

    response_list = []
    for u in unlocks:
        prop_res = await db.execute(select(Property).where(Property.id == u.property_id))
        prop = prop_res.scalar_one_or_none()
        owner_res = await db.execute(select(User).where(User.id == u.owner_id))
        owner = owner_res.scalar_one_or_none()

        response_list.append({
            "property_id": str(u.property_id),
            "property_title": prop.title if prop else "Unknown Property",
            "unlocked_at": u.unlocked_at,
            "contact": {
                "name": owner.name if owner else "Unknown",
                "phone": owner.mobile if owner else "",
                "email": owner.email if owner else "",
            }
        })
    return response_list
