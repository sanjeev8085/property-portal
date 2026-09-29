from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from app.api.deps import get_optional_user
from app.models.user import User
from app.services.location_service import resolve_google_maps_url

router = APIRouter()

class ResolveLocationRequest(BaseModel):
    google_maps_url: str

class ResolveLocationResponse(BaseModel):
    success: bool
    location: dict

@router.post("/resolve", response_model=ResolveLocationResponse, status_code=status.HTTP_200_OK)
async def resolve_location(
    payload: ResolveLocationRequest,
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Resolve a Google Maps URL into structured location data."""
    if not payload.google_maps_url:
        raise HTTPException(status_code=400, detail="google_maps_url is required.")
        
    try:
        location_data = await resolve_google_maps_url(payload.google_maps_url)
        return ResolveLocationResponse(success=True, location=location_data)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to resolve location: {str(e)}"
        )
