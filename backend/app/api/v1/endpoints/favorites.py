from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
import uuid
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.monetization import Favorite
from app.models.property import Property
from app.models.location import Location

router = APIRouter()


@router.post("", status_code=status.HTTP_201_CREATED)
async def add_favorite(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Save a property to favorites."""
    property_id_str = payload.get("property_id")
    if not property_id_str:
        raise HTTPException(status_code=400, detail="property_id is required.")

    try:
        pid = uuid.UUID(property_id_str)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid property ID format.")

    # Verify property exists
    prop_check = await db.execute(select(Property).where(Property.id == pid))
    if not prop_check.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Property not found.")

    # Duplicate check
    dup_check = await db.execute(
        select(Favorite).where(Favorite.user_id == current_user.id, Favorite.property_id == pid)
    )
    if dup_check.scalar_one_or_none():
        return {"message": "Already favorited.", "property_id": str(pid)}

    fav = Favorite(user_id=current_user.id, property_id=pid)
    db.add(fav)
    await db.commit()

    return {"message": "Property saved to favorites.", "property_id": str(pid)}


@router.get("")
async def list_favorites(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List user's saved favorites."""
    query = select(Property).join(
        Favorite, Favorite.property_id == Property.id
    ).join(
        Location, Property.location_id == Location.id, isouter=True
    ).where(Favorite.user_id == current_user.id)

    result = await db.execute(query)
    properties = result.scalars().all()

    results_data = []
    for prop in properties:
        results_data.append({
            "id": str(prop.id),
            "title": prop.title,
            "purpose": prop.purpose,
            "property_type": prop.property_type,
            "price": prop.price,
            "bhk": prop.bhk,
            "location": f"{prop.location.locality}, {prop.location.city}" if prop.location else "Unknown Location",
        })

    return results_data


@router.delete("/{property_id}")
async def remove_favorite(
    property_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Remove a property from favorites."""
    try:
        pid = uuid.UUID(property_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid property ID.")

    q = delete(Favorite).where(Favorite.user_id == current_user.id, Favorite.property_id == pid)
    result = await db.execute(q)
    await db.commit()

    return {"message": "Removed from favorites."}

