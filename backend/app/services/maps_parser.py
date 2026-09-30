"""
GoogleMapsUrlParser Service
===========================
Parses Google Maps and Street View URLs to extract:
  - Place name
  - Latitude / Longitude (with source context)
  - Google Place ID
  - Street View panorama ID, heading, pitch, FOV

RULES:
  - NEVER invent, infer or guess data not present in the URL.
  - Every field has a 'source' and 'confidence' value.
  - Missing fields are returned as None, not as fabricated values.
  - Price and property type are ALWAYS null (not in URL; require external trusted source).
"""
import re
import ipaddress
import urllib.parse
from typing import Optional, Dict, Any
from datetime import datetime, timezone

# ─────────────────────────────────────────────
# SSRF Protection — allowed domains only
# ─────────────────────────────────────────────
ALLOWED_DOMAINS = {
    "google.com",
    "www.google.com",
    "maps.google.com",
    "goo.gl",
    "maps.app.goo.gl",
    "g.page",
}

MAX_URL_LENGTH = 4096


def _field(value, source: str, confidence: str) -> Dict[str, Any]:
    """Return a provenance-annotated field dict."""
    return {"value": value, "source": source, "confidence": confidence}


def _missing_field() -> Dict[str, Any]:
    return {"value": None, "source": None, "confidence": None}


class UrlValidationError(Exception):
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


def validate_maps_url(url: str) -> str:
    """
    Validate that the URL is:
      1. A string with reasonable length
      2. Uses http:// or https:// scheme only
      3. Points to an allowed Google Maps domain
      4. Does NOT point to private/local IP ranges (SSRF)
    Returns the cleaned URL or raises UrlValidationError.
    """
    if not url or not isinstance(url, str):
        raise UrlValidationError("INVALID_MAPS_URL", "Please provide a valid Google Maps URL.")

    url = url.strip()

    if len(url) > MAX_URL_LENGTH:
        raise UrlValidationError("INVALID_MAPS_URL", "URL is too long.")

    # Block dangerous schemes
    lower = url.lower()
    for bad in ("javascript:", "file://", "data:", "ftp://", "vbscript:"):
        if lower.startswith(bad):
            raise UrlValidationError("INVALID_MAPS_URL", "Unsupported URL scheme.")

    try:
        parsed = urllib.parse.urlparse(url)
    except Exception:
        raise UrlValidationError("INVALID_MAPS_URL", "Malformed URL.")

    if parsed.scheme not in ("http", "https"):
        raise UrlValidationError("INVALID_MAPS_URL", "Only http:// and https:// URLs are accepted.")

    hostname = parsed.hostname or ""

    # SSRF: block private / loopback IP addresses
    try:
        addr = ipaddress.ip_address(hostname)
        if addr.is_private or addr.is_loopback or addr.is_reserved or addr.is_link_local:
            raise UrlValidationError("INVALID_MAPS_URL", "URL points to a private or restricted address.")
    except ValueError:
        pass  # hostname is not an IP address — fine

    # Block localhost by name
    if hostname in ("localhost", "127.0.0.1", "::1"):
        raise UrlValidationError("INVALID_MAPS_URL", "URL points to a restricted address.")

    # Allowlist check — must be Google Maps domain
    domain_ok = any(
        hostname == d or hostname.endswith("." + d)
        for d in ALLOWED_DOMAINS
    )
    if not domain_ok:
        raise UrlValidationError(
            "UNSUPPORTED_MAPS_URL",
            "Please provide a valid Google Maps or Street View URL."
        )

    return url


class GoogleMapsUrlParser:
    """
    Parses a (long) Google Maps URL and returns structured extraction result.

    Fields extracted directly from URL (no external API needed):
      - placeName          → from /place/<name>/ segment
      - latitude/longitude → from !3d...!4d... or @lat,lng
      - placeId            → from !1s0x...:0x... pattern
      - streetView params  → from the camera segment (lat,lng,fov,heading)
      - panoramaId         → from !1s<base64-like> in street view data

    Fields ALWAYS null (require trusted external source not present in URL):
      - address
      - price
      - propertyType
      - postalCode
      - city, state, country
    """

    def parse(self, url: str) -> Dict[str, Any]:
        """
        Parse a validated Google Maps URL.
        Returns structured extraction result with provenance.
        """
        fields_found = []
        fields_missing = []
        warnings = []

        # ── Place Name ──────────────────────────────────────────────
        place_name = self._extract_place_name(url)
        if place_name:
            name_field = _field(place_name, "maps_url_place_segment", "high")
            fields_found.append("name")
        else:
            name_field = _missing_field()
            fields_missing.append("name")

        # ── Place Coordinates ────────────────────────────────────────
        place_lat, place_lng = self._extract_place_coordinates(url)
        if place_lat is not None and place_lng is not None:
            lat_field = _field(place_lat, "maps_place_coordinates", "high")
            lng_field = _field(place_lng, "maps_place_coordinates", "high")
            fields_found.extend(["latitude", "longitude"])
        else:
            # Fallback: @-style viewport coordinates
            view_lat, view_lng = self._extract_viewport_coordinates(url)
            if view_lat is not None:
                lat_field = _field(view_lat, "maps_viewport_coordinates", "medium")
                lng_field = _field(view_lng, "maps_viewport_coordinates", "medium")
                fields_found.extend(["latitude", "longitude"])
                warnings.append("Coordinates are from the map viewport, not a specific place pin.")
            else:
                lat_field = _missing_field()
                lng_field = _missing_field()
                fields_missing.extend(["latitude", "longitude"])

        # ── Place ID ─────────────────────────────────────────────────
        place_id = self._extract_place_id(url)
        if place_id:
            place_id_field = _field(place_id, "maps_url_data_segment", "high")
            fields_found.append("placeId")
        else:
            place_id_field = _missing_field()
            fields_missing.append("placeId")

        # ── Street View Detection ────────────────────────────────────
        sv = self._extract_street_view(url)
        sv_available = sv.get("available", False)

        # ── Explicitly unavailable from URL ─────────────────────────
        for f in ["address", "price", "propertyType", "postalCode", "city", "state", "country"]:
            fields_missing.append(f)

        # ── Determine status ─────────────────────────────────────────
        if fields_found:
            status = "partial" if fields_missing else "complete"
        else:
            status = "failed"

        return {
            "property": {
                "name": name_field,
                "address": _missing_field(),
                "city": _missing_field(),
                "state": _missing_field(),
                "country": _missing_field(),
                "postalCode": _missing_field(),
                "latitude": lat_field,
                "longitude": lng_field,
                "propertyType": _missing_field(),
                "price": _missing_field(),
                "currency": _missing_field(),
            },
            "classification": {
                "type": None,
                "confidence": None,
                "note": "Property type cannot be determined from a Google Maps URL alone."
            },
            "googleMaps": {
                "placeId": place_id_field,
                "sourceUrl": url,
            },
            "streetView": {
                "available": sv_available,
                "panoramaId": sv.get("panoramaId"),
                "latitude": sv.get("latitude"),
                "longitude": sv.get("longitude"),
                "heading": sv.get("heading"),
                "pitch": sv.get("pitch"),
                "fieldOfView": sv.get("fieldOfView"),
            },
            "extraction": {
                "status": status,
                "fieldsFound": fields_found,
                "fieldsMissing": fields_missing,
                "warnings": warnings,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        }

    # ─────────────────────────────────────────
    # Private Extraction Helpers
    # ─────────────────────────────────────────

    def _extract_place_name(self, url: str) -> Optional[str]:
        """Extract place name from /place/<name>/ segment."""
        match = re.search(r"/place/([^/@?&]+)", url)
        if match:
            raw = match.group(1)
            # Decode percent-encoding and replace + with space
            decoded = urllib.parse.unquote_plus(raw)
            # Strip trailing slash remnants
            decoded = decoded.strip("/").strip()
            if decoded and decoded not in ("", "@"):
                return decoded
        return None

    def _extract_place_coordinates(self, url: str) -> tuple:
        """
        Extract the precise place pin coordinates from the data segment.
        Pattern: !3d<lat>!4d<lng>
        These are the official place coordinates (most reliable).
        """
        match = re.search(r"!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)", url)
        if match:
            try:
                return float(match.group(1)), float(match.group(2))
            except ValueError:
                pass
        return None, None

    def _extract_viewport_coordinates(self, url: str) -> tuple:
        """
        Extract viewport / camera @lat,lng coordinates.
        Less precise than place coordinates.
        """
        match = re.search(r"@(-?\d+\.?\d+),(-?\d+\.?\d+)", url)
        if match:
            try:
                return float(match.group(1)), float(match.group(2))
            except ValueError:
                pass
        return None, None

    def _extract_place_id(self, url: str) -> Optional[str]:
        """
        Extract Google Maps Place ID.
        Pattern: !1s0x<hex>:0x<hex>
        """
        match = re.search(r"!1s(0x[0-9a-fA-F]+:0x[0-9a-fA-F]+)", url)
        if match:
            return match.group(1)
        return None

    def _extract_street_view(self, url: str) -> Dict[str, Any]:
        """
        Detect Street View segment and extract:
          - Street View camera coordinates (before the @)
          - Altitude/FOV/heading/pitch from camera spec like: 493a,75y,326.34h,90t
          - Panorama ID from !1s<base64id> in street view data
        """
        result: Dict[str, Any] = {"available": False}

        # Street View camera spec: @lat,lng,<alt>a,<fov>y,<heading>h,<pitch>t
        sv_match = re.search(
            r"@(-?\d+\.?\d+),(-?\d+\.?\d+),(\d+\.?\d*)a,(\d+\.?\d*)y,(\d+\.?\d*)h,(\d+\.?\d*)t",
            url
        )
        if sv_match:
            result["available"] = True
            result["latitude"] = float(sv_match.group(1))
            result["longitude"] = float(sv_match.group(2))
            result["fieldOfView"] = float(sv_match.group(4))
            result["heading"] = float(sv_match.group(5))
            # Google uses t for tilt (90 = level horizon = pitch 0)
            tilt = float(sv_match.group(6))
            result["pitch"] = round(90.0 - tilt, 4) if tilt else 0.0

        # Check for /maps/@...3m (street view indicator)
        if not result["available"] and re.search(r"!1e1!", url):
            result["available"] = True

        # Panorama ID: appears as !1s followed by a URL-safe base64-looking string
        pano_match = re.search(r"!1s([A-Za-z0-9_\-]{10,})", url)
        if pano_match:
            candidate = pano_match.group(1)
            # Exclude hex place IDs (those start with 0x pattern via !1s0x)
            if not candidate.startswith("0x"):
                result["panoramaId"] = candidate
                result["available"] = True

        return result


# Singleton instance
maps_parser = GoogleMapsUrlParser()
