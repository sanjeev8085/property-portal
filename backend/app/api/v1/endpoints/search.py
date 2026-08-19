from fastapi import APIRouter, Query, Depends
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.property import Property, PropertyStatus, PropertyPurpose, FurnishedStatus
from app.models.location import Location

router = APIRouter()


@router.get("")
async def search_properties(
    purpose: Optional[str] = Query(None, description="rent or sell"),
    city: Optional[str] = Query(None),
    property_type: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    bhk: Optional[int] = Query(None),
    furnished_status: Optional[str] = Query(None),
    parking: Optional[bool] = Query(None),
    sort_by: Optional[str] = Query("newest", description="newest|price_asc|price_desc|most_viewed"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Search and filter properties."""
    # Query properties that are active/published and not deactivated
    query = select(Property).where(Property.status.in_([PropertyStatus.PUBLISHED, PropertyStatus.PENDING_APPROVAL]))

    # Join with locations if filtering by city
    if city:
        query = query.join(Location, Property.location_id == Location.id).where(
            Location.city.ilike(f"%{city}%")
        )
    else:
        query = query.join(Location, Property.location_id == Location.id, isouter=True)

    if purpose:
        try:
            purpose_enum = PropertyPurpose(purpose.lower())
            query = query.where(Property.purpose == purpose_enum)
        except ValueError:
            pass

    if property_type:
        query = query.where(Property.property_type.ilike(f"%{property_type}%"))

    if min_price is not None:
        query = query.where(Property.price >= min_price)

    if max_price is not None:
        query = query.where(Property.price <= max_price)

    if bhk is not None:
        query = query.where(Property.bhk == bhk)

    if furnished_status:
        try:
            furn_enum = FurnishedStatus(furnished_status.lower())
            query = query.where(Property.furnished_status == furn_enum)
        except ValueError:
            pass

    if parking is not None:
        if parking:
            query = query.where(Property.parking > 0)
        else:
            query = query.where((Property.parking == 0) | (Property.parking.is_(None)))

    # Count total matching results
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply sorting
    if sort_by == "price_asc":
        query = query.order_by(Property.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Property.price.desc())
    elif sort_by == "most_viewed":
        query = query.order_by(Property.views_count.desc())
    else:
        query = query.order_by(Property.created_at.desc())

    # Paginate
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    result = await db.execute(query)
    properties = result.scalars().all()

    results_data = []
    for prop in properties:
        # Load cover photo
        img_res = await db.execute(select(PropertyImage.image_url).where(PropertyImage.property_id == prop.id).order_by(PropertyImage.sort_order).limit(1))
        img_url = img_res.scalar_one_or_none() or "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80"

        loc_str = f"{prop.location.locality}, {prop.location.city}" if prop.location else (prop.locality or prop.city or "Bhopal")

        results_data.append({
            "id": str(prop.id),
            "title": prop.title,
            "purpose": prop.purpose,
            "property_type": prop.property_type,
            "price": prop.price,
            "bhk": prop.bhk,
            "area_sqft": prop.area_sqft,
            "bathrooms": prop.bathrooms,
            "location": loc_str,
            "image": img_url,
            "description": prop.description,
            "is_featured": prop.is_featured,
            "views_count": prop.views_count,
            "created_at": prop.created_at,
        })

    return {
        "results": results_data,
        "total": total,
        "page": page,
        "per_page": per_page,
        "filters_applied": {
            "purpose": purpose, "city": city, "bhk": bhk, "sort_by": sort_by,
        },
    }


@router.get("/locations/autocomplete")
async def autocomplete_location(
    q: str = Query(..., min_length=2),
    db: AsyncSession = Depends(get_db)
):
    """Autocomplete city/area/locality suggestions."""
    result = await db.execute(
        select(Location).where(
            (Location.city.ilike(f"%{q}%")) |
            (Location.area.ilike(f"%{q}%")) |
            (Location.locality.ilike(f"%{q}%"))
        ).limit(10)
    )
    locations = result.scalars().all()
    suggestions = []
    for loc in locations:
        label = f"{loc.locality}, {loc.area}, {loc.city}"
        suggestions.append({
            "id": str(loc.id),
            "city": loc.city,
            "area": loc.area,
            "locality": loc.locality,
            "label": label
        })
    return {"suggestions": suggestions}

