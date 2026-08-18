from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
import uuid
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.monetization import SavedSearch

router = APIRouter()


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_saved_search(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Save search criteria for alerts."""
    filters = payload.get("filters")
    if not filters or not isinstance(filters, dict):
        raise HTTPException(status_code=400, detail="filters must be a non-empty dictionary.")

    saved_search = SavedSearch(
        user_id=current_user.id,
        name=payload.get("name", "My Saved Search"),
        filters=filters,
        notify_email=payload.get("notify_email", True),
        notify_whatsapp=payload.get("notify_whatsapp", False),
        is_active=True
    )
    db.add(saved_search)
    await db.commit()
    await db.refresh(saved_search)

    return {
        "id": str(saved_search.id),
        "name": saved_search.name,
        "filters": saved_search.filters,
        "notify_email": saved_search.notify_email,
        "notify_whatsapp": saved_search.notify_whatsapp,
    }


@router.get("")
async def list_saved_searches(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List current user's saved searches."""
    result = await db.execute(
        select(SavedSearch).where(SavedSearch.user_id == current_user.id, SavedSearch.is_active == True)
    )
    searches = result.scalars().all()
    return [{
        "id": str(s.id),
        "name": s.name,
        "filters": s.filters,
        "notify_email": s.notify_email,
        "notify_whatsapp": s.notify_whatsapp,
        "created_at": s.created_at,
    } for s in searches]


@router.delete("/{search_id}")
async def delete_saved_search(
    search_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a saved search alert."""
    try:
        sid = uuid.UUID(search_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid search ID format.")

    result = await db.execute(
        select(SavedSearch).where(SavedSearch.id == sid, SavedSearch.user_id == current_user.id)
    )
    search = result.scalar_one_or_none()
    if not search:
        raise HTTPException(status_code=404, detail="Saved search not found.")

    await db.delete(search)
    await db.commit()
    return {"message": "Saved search deleted successfully."}
