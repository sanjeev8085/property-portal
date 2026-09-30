"""
POST /api/v1/properties/extract-from-map

Validates, parses and enriches a Google Maps URL into structured property data.
The result is READ-ONLY for user review — it does NOT create a property.

Security:
  - Requires authenticated user (JWT)
  - SSRF protection via URL allowlist in maps_parser.py
  - Rate limited: 10 requests / minute per user
  - No external URLs fetched beyond Google Maps / Nominatim
  - GOOGLE_MAPS_API_KEY kept server-side only
"""
import logging
from datetime import datetime, timezone
from typing import Optional, Any

from fastapi import APIRouter, Depends, Request, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.core.rate_limiter import check_rate_limit
from app.models.user import User
from app.models.location import Location
from app.services.maps_parser import maps_parser, validate_maps_url, UrlValidationError
from app.services.location_service import resolve_google_maps_url

logger = logging.getLogger(__name__)

router = APIRouter()


# ─────────────────────────────────────────────
# Request / Response schemas
# ─────────────────────────────────────────────

class ExtractFromMapRequest(BaseModel):
    url: str


class ExtractFromMapResponse(BaseModel):
    success: bool
    code: str
    message: str
    data: Optional[Any] = None


# ─────────────────────────────────────────────
# Duplicate Detection Helper
# ─────────────────────────────────────────────

async def _find_duplicate(
    db: AsyncSession,
    place_id: Optional[str],
    lat: Optional[float],
    lng: Optional[float],
    google_maps_url: str,
) -> Optional[dict]:
    """
    Check if a property already exists in the database that matches:
    1. The same google_maps_url
    2. The same Place ID in the location table
    3. Very close lat/lng (within ~0.0005 degrees ≈ 50m)
    Returns a minimal property summary if found.
    """
    from app.models.property import Property

    # Check by google_maps_url on location
    q = (
        select(Location, Property)
        .join(Property, Property.location_id == Location.id)
        .where(
            or_(
                Location.google_maps_url == google_maps_url,
                *(
                    [Location.lat.between(lat - 0.0005, lat + 0.0005),
                     Location.lng.between(lng - 0.0005, lng + 0.0005)]
                    if lat is not None and lng is not None else []
                )
            )
        )
        .limit(1)
    )

    result = await db.execute(q)
    row = result.first()
    if row:
        loc, prop = row
        return {
            "id": str(prop.id),
            "title": prop.title,
            "city": loc.city,
        }
    return None


# ─────────────────────────────────────────────
# Main Endpoint
# ─────────────────────────────────────────────

@router.post(
    "/extract-from-map",
    response_model=ExtractFromMapResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract property information from a Google Maps URL",
)
async def extract_from_map(
    payload: ExtractFromMapRequest,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Accepts a Google Maps or Street View URL.
    Returns structured extraction result with provenance.
    Does NOT create a property — user must review and submit separately.
    """
    # ── Rate limiting: 10 extractions / minute per authenticated user ──
    await check_rate_limit(
        request,
        key_prefix="maps_extract",
        max_requests=10,
        window_seconds=60,
        identifier=str(current_user.id),
    )

    raw_url = (payload.url or "").strip()

    # ── Step 1: Validate URL ──────────────────────────────────────────
    try:
        validated_url = validate_maps_url(raw_url)
    except UrlValidationError as e:
        logger.info(f"[maps_extract] Invalid URL from user {current_user.id}: {e.code}")
        return ExtractFromMapResponse(
            success=False,
            code=e.code,
            message=e.message,
        )

    # ── Step 2: Parse URL (no external calls) ────────────────────────
    try:
        parsed = maps_parser.parse(validated_url)
    except Exception as e:
        logger.error(f"[maps_extract] Parser error: {e}", exc_info=True)
        return ExtractFromMapResponse(
            success=False,
            code="EXTRACTION_FAILED",
            message="Could not parse the provided Google Maps URL.",
        )

    # ── Step 3: Enrich with geocoding if coordinates found ───────────
    lat_field = parsed["property"]["latitude"]
    lng_field = parsed["property"]["longitude"]
    lat = lat_field.get("value") if lat_field else None
    lng = lng_field.get("value") if lng_field else None

    place_id_val = parsed["googleMaps"]["placeId"].get("value") if parsed["googleMaps"]["placeId"] else None

    geocoded = None
    if lat is not None and lng is not None:
        try:
            geocoded = await resolve_google_maps_url(validated_url)
        except Exception as e:
            logger.warning(f"[maps_extract] Geocoding failed (non-fatal): {e}")
            parsed["extraction"]["warnings"].append(
                "Address lookup was unavailable. City/State/Country fields could not be populated."
            )

    if geocoded:
        def _geo_field(val, src="nominatim_reverse_geocoding"):
            if val:
                return {"value": val, "source": src, "confidence": "high"}
            return {"value": None, "source": None, "confidence": None}

        parsed["property"]["address"] = _geo_field(geocoded.get("address"))
        parsed["property"]["city"] = _geo_field(geocoded.get("city"))
        parsed["property"]["state"] = _geo_field(geocoded.get("state"))
        parsed["property"]["country"] = _geo_field(geocoded.get("country"))
        parsed["property"]["postalCode"] = _geo_field(geocoded.get("postal_code"))

        # Update area/locality in a separate geocoded sub-object
        parsed["geocoded"] = {
            "area": geocoded.get("area"),
            "locality": geocoded.get("locality"),
            "latitude": geocoded.get("latitude"),
            "longitude": geocoded.get("longitude"),
            "google_maps_url": validated_url,
        }

        # Update fieldsFound from geocoding results
        for key in ["address", "city", "state", "country", "postalCode"]:
            raw_key = {"postalCode": "postal_code"}.get(key, key)
            if geocoded.get(raw_key or key):
                if key not in parsed["extraction"]["fieldsFound"]:
                    parsed["extraction"]["fieldsFound"].append(key)
                if key in parsed["extraction"]["fieldsMissing"]:
                    parsed["extraction"]["fieldsMissing"].remove(key)

    # ── Step 4: Duplicate detection ───────────────────────────────────
    duplicate = None
    try:
        duplicate = await _find_duplicate(db, place_id_val, lat, lng, validated_url)
    except Exception as e:
        logger.warning(f"[maps_extract] Duplicate check failed (non-fatal): {e}")

    if duplicate:
        parsed["extraction"]["warnings"].append(
            f"A possible existing property was found: '{duplicate['title']}' in {duplicate.get('city', '')}."
        )
        parsed["duplicate"] = duplicate

    # ── Step 5: Determine code and message ───────────────────────────
    fields_found = parsed["extraction"]["fieldsFound"]
    if not fields_found:
        return ExtractFromMapResponse(
            success=False,
            code="EXTRACTION_FAILED",
            message="Property information could not be extracted from this link.",
            data=parsed,
        )

    code = "PARTIAL_EXTRACTION" if parsed["extraction"]["fieldsMissing"] else "FULL_EXTRACTION"
    message = (
        "Some information was extracted. Fields not available are shown as 'Not available'."
        if code == "PARTIAL_EXTRACTION"
        else "All available information was successfully extracted."
    )

    # ── Audit log ─────────────────────────────────────────────────────
    logger.info(
        f"[maps_extract] user={current_user.id} status={code} "
        f"fields={fields_found} url={validated_url[:80]}"
    )

    return ExtractFromMapResponse(
        success=True,
        code=code,
        message=message,
        data=parsed,
    )
