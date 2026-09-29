import re
import urllib.parse
import httpx
from typing import Dict, Any, Optional, Tuple
from fastapi import HTTPException
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Supported Google Maps domains
VALID_DOMAINS = [
    "google.com/maps",
    "www.google.com/maps",
    "maps.google.com",
    "goo.gl/maps",
    "maps.app.goo.gl",
    "g.page"
]

async def resolve_redirects(url: str) -> str:
    """Follow HTTP redirects to get the final long URL."""
    try:
        async with httpx.AsyncClient() as client:
            # Only follow redirects, do not download body if possible
            response = await client.head(url, follow_redirects=True, timeout=10.0)
            if response.status_code == 405: # some shorteners block HEAD
                response = await client.get(url, follow_redirects=True, timeout=10.0)
            return str(response.url)
    except httpx.RequestError as exc:
        logger.error(f"Error following redirect for {url}: {exc}")
        return url

def extract_location_info_from_url(url: str) -> Tuple[Optional[float], Optional[float], Optional[str]]:
    """Extract latitude, longitude, or place name from a long Google Maps URL."""
    lat, lng, place_name = None, None, None

    # Try matching coordinates like !3d23.2599!4d77.4126
    coord_match = re.search(r"!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)", url)
    if coord_match:
        lat = float(coord_match.group(1))
        lng = float(coord_match.group(2))
    else:
        # Try matching coordinates like @23.2599,77.4126
        coord_match = re.search(r"@(-?\d+\.\d+),(-?\d+\.\d+)", url)
        if coord_match:
            lat = float(coord_match.group(1))
            lng = float(coord_match.group(2))
    
    # Try extracting place name
    place_match = re.search(r"/place/([^/]+)/", url)
    if place_match:
        place_name = urllib.parse.unquote_plus(place_match.group(1))

    return lat, lng, place_name

async def fetch_geocoding_data(lat: Optional[float], lng: Optional[float], place_name: Optional[str]) -> Dict[str, Any]:
    """Call Google Maps Geocoding API to resolve structured location."""
    api_key = getattr(settings, "LOCATION_PROVIDER_API_KEY", None)
    if not api_key:
        # Fallback to avoid breaking if key is not configured
        logger.warning("LOCATION_PROVIDER_API_KEY is not set. Cannot resolve exact address details.")
        return {}

    base_url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {"key": api_key}

    if lat is not None and lng is not None:
        params["latlng"] = f"{lat},{lng}"
    elif place_name:
        params["address"] = place_name
    else:
        return {}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(base_url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            if data.get("status") == "OK" and data.get("results"):
                return data["results"][0]
            else:
                logger.warning(f"Geocoding API returned status {data.get('status')} for params {params}")
    except httpx.RequestError as exc:
        logger.error(f"Geocoding API request failed: {exc}")
    
    return {}

def normalize_geocode_result(result: Dict[str, Any], fallback_lat: Optional[float], fallback_lng: Optional[float]) -> Dict[str, Any]:
    """Normalize Google Maps Geocoding API response to our schema."""
    normalized = {
        "address": result.get("formatted_address", ""),
        "city": "",
        "state": "",
        "country": "",
        "postal_code": "",
        "area": "",
        "locality": "",
        "latitude": fallback_lat,
        "longitude": fallback_lng
    }

    if "geometry" in result and "location" in result["geometry"]:
        normalized["latitude"] = result["geometry"]["location"].get("lat", fallback_lat)
        normalized["longitude"] = result["geometry"]["location"].get("lng", fallback_lng)

    for component in result.get("address_components", []):
        types = component.get("types", [])
        if "locality" in types:
            normalized["city"] = component["long_name"]
        elif "administrative_area_level_1" in types:
            normalized["state"] = component["long_name"]
        elif "country" in types:
            normalized["country"] = component["long_name"]
        elif "postal_code" in types:
            normalized["postal_code"] = component["long_name"]
        elif "sublocality_level_1" in types or "neighborhood" in types:
            normalized["area"] = component["long_name"]
        elif "sublocality_level_2" in types or "sublocality" in types:
            if not normalized.get("locality"):
                normalized["locality"] = component["long_name"]
    
    return normalized

async def resolve_google_maps_url(url: str) -> Dict[str, Any]:
    """Validate and resolve a Google Maps URL into structured location data."""
    # 1. Validation
    if not any(domain in url for domain in VALID_DOMAINS):
        raise HTTPException(status_code=400, detail="Invalid Google Maps URL. Ensure the link is from a supported Google Maps domain.")

    # 2. Resolve short links
    long_url = await resolve_redirects(url)

    # 3. Extract parameters
    lat, lng, place_name = extract_location_info_from_url(long_url)

    if lat is None and lng is None and not place_name:
        raise HTTPException(status_code=422, detail="Could not extract coordinates or place name from the provided URL.")

    # 4. Geocode
    geocode_result = await fetch_geocoding_data(lat, lng, place_name)
    
    if not geocode_result:
        # We might not have an API key or API failed, but we can still return what we extracted
        return {
            "address": place_name.replace("+", " ") if place_name else "",
            "area": place_name.replace("+", " ") if place_name else "",
            "locality": "",
            "city": "",
            "state": "",
            "country": "",
            "postal_code": "",
            "latitude": lat,
            "longitude": lng,
            "google_maps_url": url
        }

    # 5. Normalize and return
    location_data = normalize_geocode_result(geocode_result, lat, lng)
    location_data["google_maps_url"] = url
    
    if not location_data.get("area") and place_name:
        location_data["area"] = place_name.replace("+", " ")

    return location_data
