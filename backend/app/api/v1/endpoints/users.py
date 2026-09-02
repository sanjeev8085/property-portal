from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User, UserType
from app.schemas.user import UserUpdate, PasswordChange
from app.core.security import verify_password, hash_password

router = APIRouter()


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_active_user)):
    """Return current authenticated user's profile."""
    return {
        "id": str(current_user.id),
        "name": current_user.name,
        "email": current_user.email,
        "mobile": current_user.mobile,
        "city": current_user.city,
        "user_type": current_user.user_type,
        "is_mobile_verified": current_user.is_mobile_verified,
        "is_email_verified": current_user.is_email_verified,
        "created_at": current_user.created_at,
    }


@router.put("/me")
async def update_me(
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update current user's profile with duplicate validation."""
    from sqlalchemy import select

    if payload.name is not None:
        current_user.name = payload.name.strip()
    if payload.email is not None and payload.email.strip() != (current_user.email or ""):
        dup = await db.execute(select(User).where(User.email == payload.email.strip(), User.id != current_user.id))
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered to another account.")
        current_user.email = payload.email.strip()
    if payload.mobile is not None and payload.mobile.strip() != (current_user.mobile or ""):
        dup = await db.execute(select(User).where(User.mobile == payload.mobile.strip(), User.id != current_user.id))
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mobile already registered to another account.")
        current_user.mobile = payload.mobile.strip()
    if payload.user_type is not None and payload.user_type in ("owner", "agent", "buyer"):
        if current_user.user_type != UserType.ADMIN and (current_user.email or "").lower() != "admin@aurahomes.in":
            current_user.user_type = payload.user_type
    
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return {"message": "Profile updated successfully.", "name": current_user.name}


@router.put("/me/change-password")
async def change_password(
    payload: PasswordChange,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Change user's password."""
    if not current_user.password_hash or not verify_password(payload.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password."
        )
    current_user.password_hash = hash_password(payload.new_password)
    db.add(current_user)
    await db.commit()
    return {"message": "Password changed successfully."}


import uuid
from sqlalchemy import select
from app.models.property import Property, PropertyStatus

@router.get("/{user_id}")
async def get_public_profile(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get public profile of a user (agent/owner) and their published listings."""
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid user ID format.")

    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Get active published properties owned by the user
    prop_query = select(Property).where(Property.owner_id == uid, Property.status == PropertyStatus.PUBLISHED)
    prop_result = await db.execute(prop_query)
    properties = prop_result.scalars().all()

    return {
        "id": str(user.id),
        "name": user.name,
        "city": user.city,
        "user_type": user.user_type,
        "created_at": user.created_at,
        "listings": [{
            "id": str(p.id),
            "title": p.title,
            "purpose": p.purpose,
            "property_type": p.property_type,
            "price": p.price,
            "bhk": p.bhk,
        } for p in properties]
    }


