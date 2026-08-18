"""Contact credits & unlock endpoint."""
from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_active_user, require_verified_mobile
from app.models.user import User
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.monetization import ContactCredit

router = APIRouter()


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


from app.models.property import Property
from app.models.monetization import ContactUnlock
import uuid

@router.post("/unlock/{property_id}")
async def unlock_contact(
    property_id: str,
    current_user: User = Depends(require_verified_mobile),
    db: AsyncSession = Depends(get_db),
):
    """Unlock owner contact for a property (costs 1 credit)."""
    try:
        pid = uuid.UUID(property_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid property ID.")

    prop_result = await db.execute(
        select(Property).where(Property.id == pid)
    )
    prop = prop_result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")

    # Check duplicate unlock
    dup_result = await db.execute(
        select(ContactUnlock).where(ContactUnlock.user_id == current_user.id, ContactUnlock.property_id == pid)
    )
    dup = dup_result.scalar_one_or_none()
    if dup:
        # Fetch owner details
        owner_result = await db.execute(select(User).where(User.id == prop.owner_id))
        owner = owner_result.scalar_one_or_none()
        return {
            "message": "Already unlocked.",
            "contact": {
                "name": owner.name if owner else "Unknown",
                "phone": owner.mobile if owner else "",
                "email": owner.email if owner else "",
            }
        }

    credits_result = await db.execute(select(ContactCredit).where(ContactCredit.user_id == current_user.id))
    credits = credits_result.scalar_one_or_none()
    if not credits or credits.available_credits < 1:
        raise HTTPException(
            status_code=402,
            detail="Insufficient contact credits. Please purchase a plan.",
        )

    # Deduct credit
    credits.used_credits += 1
    db.add(credits)

    # Save unlock entry
    unlock_entry = ContactUnlock(
        user_id=current_user.id,
        property_id=pid,
        owner_id=prop.owner_id,
        credit_used=1
    )
    db.add(unlock_entry)
    await db.commit()

    # Trigger unlock alert notification!
    from app.services.notification_service import send_contact_unlocked_notification
    if prop.owner_id:
        await send_contact_unlocked_notification(
            owner_id=prop.owner_id,
            property_title=prop.title,
            user_name=current_user.name,
            db=db
        )

    # Fetch owner details
    owner_result = await db.execute(select(User).where(User.id == prop.owner_id))
    owner = owner_result.scalar_one_or_none()

    return {
        "message": "Contact unlocked successfully.",
        "contact": {
            "name": owner.name if owner else "Unknown",
            "phone": owner.mobile if owner else "",
            "email": owner.email if owner else "",
        }
    }


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
