from fastapi import APIRouter, Query, Depends
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.property import Property, PropertyStatus, PropertyPurpose, FurnishedStatus, PropertyImage
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
    query = (
        select(Property)
        .options(selectinload(Property.location), selectinload(Property.images))
        .where(Property.status.in_([PropertyStatus.PUBLISHED, PropertyStatus.PENDING_APPROVAL]))
    )

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

    # Build matching count query with identical filters applied
    count_query = select(func.count(Property.id.distinct())).select_from(Property)
    if city:
        count_query = count_query.join(Location, Property.location_id == Location.id).where(
            Location.city.ilike(f"%{city}%")
        )
    else:
        count_query = count_query.join(Location, Property.location_id == Location.id, isouter=True)

    count_query = count_query.where(Property.status.in_([PropertyStatus.PUBLISHED, PropertyStatus.PENDING_APPROVAL]))

    if purpose:
        try:
            purpose_enum = PropertyPurpose(purpose.lower())
            count_query = count_query.where(Property.purpose == purpose_enum)
        except ValueError:
            pass

    if property_type:
        count_query = count_query.where(Property.property_type.ilike(f"%{property_type}%"))

    if min_price is not None:
        count_query = count_query.where(Property.price >= min_price)

    if max_price is not None:
        count_query = count_query.where(Property.price <= max_price)

    if bhk is not None:
        count_query = count_query.where(Property.bhk == bhk)

    if furnished_status:
        try:
            furn_enum = FurnishedStatus(furnished_status.lower())
            count_query = count_query.where(Property.furnished_status == furn_enum)
        except ValueError:
            pass

    if parking is not None:
        if parking:
            count_query = count_query.where(Property.parking > 0)
        else:
            count_query = count_query.where((Property.parking == 0) | (Property.parking.is_(None)))

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
    properties = result.scalars().unique().all()

    results_data = []
    try:
        for prop in properties:
            img_url = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80"
            if prop.images and len(prop.images) > 0:
                img_url = prop.images[0].image_url or img_url

            loc_str = "Bhopal"
            if prop.location:
                loc_str = f"{prop.location.locality}, {prop.location.city}"

            purpose_val = prop.purpose.value if hasattr(prop.purpose, "value") else str(prop.purpose)
            status_val = prop.status.value if hasattr(prop.status, "value") else str(prop.status)

            results_data.append({
                "id": str(prop.id),
                "title": prop.title,
                "purpose": purpose_val,
                "property_type": prop.property_type,
                "price": prop.price,
                "bhk": prop.bhk,
                "area_sqft": prop.area_sqft,
                "bathrooms": prop.bathrooms,
                "location": loc_str,
                "image": img_url,
                "images": [img.image_url for img in prop.images] if prop.images else [img_url],
                "description": prop.description,
                "is_featured": prop.is_featured,
                "status": status_val,
                "views_count": prop.views_count,
                "created_at": prop.created_at.isoformat() if prop.created_at else None,
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
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Search endpoint error: {e}", exc_info=True)
        return {
            "results": [],
            "total": 0,
            "page": 1,
            "per_page": per_page,
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

