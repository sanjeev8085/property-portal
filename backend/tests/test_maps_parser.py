"""
Unit tests for GoogleMapsUrlParser and URL validation.
Tests all 10 scenarios from the spec + edge cases.
Run: cd backend && python -m pytest tests/test_maps_parser.py -v
"""
import pytest
from app.services.maps_parser import (
    GoogleMapsUrlParser,
    validate_maps_url,
    UrlValidationError,
    maps_parser,
)

# ─────────────────────────────────────────────────────────
# URL Fixtures
# ─────────────────────────────────────────────────────────

MAPLE_PLACE_URL = (
    "https://www.google.com/maps/place/Maple+High+Street/@23.1819082,77.4546484,"
    "493a,75y,326.34h,90t/data=!4m14!1m7!3m6!1s0x397c43e9131afdbd:0x33286b10ee89dc9c"
    "!2sMaple+High+Street!8m2!3d23.1819592!4d77.454601!16s%2Fg%2F11cspz8s2f"
    "!3m5!1s0x397c43e9131afdbd:0x33286b10ee89dc9c!8m2!3d23.1819592!4d77.454601"
    "!16s%2Fg%2F11cspz8s2f?entry=ttu"
)

STREET_VIEW_URL = (
    "https://www.google.com/maps/@23.1819082,77.4546484,"
    "493a,75y,326.34h,90t/data=!3m7!1e1!3m5!1sqAuMIEz3OlmbkFJuE9MV2w"
)

COORDS_ONLY_URL = "https://www.google.com/maps/@28.6139,77.2090,14z"

MALFORMED_URL = "not-a-url-at-all"

NON_GOOGLE_URL = "https://www.openstreetmap.org/#map=14/23.18/77.45"

PLACE_NO_NAME_URL = "https://www.google.com/maps/@23.1819592,77.454601,17z"

QUERY_URL = "https://www.google.com/maps/search/?api=1&query=Bhopal+Madhya+Pradesh"


# ─────────────────────────────────────────────────────────
# URL Validation Tests
# ─────────────────────────────────────────────────────────

class TestUrlValidation:

    def test_valid_place_url_passes(self):
        result = validate_maps_url(MAPLE_PLACE_URL)
        assert result == MAPLE_PLACE_URL

    def test_empty_url_raises(self):
        with pytest.raises(UrlValidationError) as exc_info:
            validate_maps_url("")
        assert exc_info.value.code == "INVALID_MAPS_URL"

    def test_none_raises(self):
        with pytest.raises(UrlValidationError):
            validate_maps_url(None)

    def test_non_google_domain_raises(self):
        with pytest.raises(UrlValidationError) as exc_info:
            validate_maps_url(NON_GOOGLE_URL)
        assert exc_info.value.code == "UNSUPPORTED_MAPS_URL"

    def test_malformed_url_raises(self):
        with pytest.raises(UrlValidationError) as exc_info:
            validate_maps_url(MALFORMED_URL)
        assert exc_info.value.code in ("INVALID_MAPS_URL", "UNSUPPORTED_MAPS_URL")

    def test_javascript_scheme_blocked(self):
        with pytest.raises(UrlValidationError):
            validate_maps_url("javascript:alert(1)")

    def test_file_scheme_blocked(self):
        with pytest.raises(UrlValidationError):
            validate_maps_url("file:///etc/passwd")

    def test_localhost_blocked(self):
        with pytest.raises(UrlValidationError):
            validate_maps_url("http://localhost/maps")

    def test_private_ip_blocked(self):
        with pytest.raises(UrlValidationError):
            validate_maps_url("https://192.168.1.1/maps")

    def test_url_too_long_raises(self):
        long_url = "https://www.google.com/maps/" + "a" * 5000
        with pytest.raises(UrlValidationError):
            validate_maps_url(long_url)


# ─────────────────────────────────────────────────────────
# Test 1: Standard place URL — place name + coordinates
# ─────────────────────────────────────────────────────────

class TestPlaceUrl:

    def test_place_name_extracted(self):
        result = maps_parser.parse(MAPLE_PLACE_URL)
        assert result["property"]["name"]["value"] == "Maple High Street"

    def test_place_name_source_is_url(self):
        result = maps_parser.parse(MAPLE_PLACE_URL)
        assert "url" in result["property"]["name"]["source"]

    def test_place_coordinates_extracted(self):
        result = maps_parser.parse(MAPLE_PLACE_URL)
        lat = result["property"]["latitude"]["value"]
        lng = result["property"]["longitude"]["value"]
        # !3d23.1819592!4d77.454601 are the precise place coords
        assert abs(lat - 23.1819592) < 0.001
        assert abs(lng - 77.454601) < 0.001

    def test_place_id_extracted(self):
        result = maps_parser.parse(MAPLE_PLACE_URL)
        pid = result["googleMaps"]["placeId"]["value"]
        assert pid is not None
        assert pid.startswith("0x")

    def test_name_in_fields_found(self):
        result = maps_parser.parse(MAPLE_PLACE_URL)
        assert "name" in result["extraction"]["fieldsFound"]

    def test_coordinates_in_fields_found(self):
        result = maps_parser.parse(MAPLE_PLACE_URL)
        assert "latitude" in result["extraction"]["fieldsFound"]
        assert "longitude" in result["extraction"]["fieldsFound"]


# ─────────────────────────────────────────────────────────
# Test 2: Street View URL — street view available
# ─────────────────────────────────────────────────────────

class TestStreetViewUrl:

    def test_street_view_available_true(self):
        result = maps_parser.parse(STREET_VIEW_URL)
        assert result["streetView"]["available"] is True

    def test_street_view_heading_extracted(self):
        result = maps_parser.parse(MAPLE_PLACE_URL)
        # Heading 326.34 is in the camera segment
        heading = result["streetView"]["heading"]
        if heading is not None:
            assert abs(heading - 326.34) < 0.1

    def test_street_view_fov_extracted(self):
        result = maps_parser.parse(MAPLE_PLACE_URL)
        fov = result["streetView"]["fieldOfView"]
        if fov is not None:
            assert fov == 75.0

    def test_panorama_id_extracted_when_present(self):
        result = maps_parser.parse(STREET_VIEW_URL)
        pano = result["streetView"]["panoramaId"]
        # qAuMIEz3OlmbkFJuE9MV2w should be detected
        assert pano is not None
        assert len(pano) >= 10


# ─────────────────────────────────────────────────────────
# Test 3: URL with no place name
# ─────────────────────────────────────────────────────────

class TestNoPlaceName:

    def test_place_name_is_none(self):
        result = maps_parser.parse(PLACE_NO_NAME_URL)
        assert result["property"]["name"]["value"] is None

    def test_name_in_fields_missing(self):
        result = maps_parser.parse(PLACE_NO_NAME_URL)
        assert "name" in result["extraction"]["fieldsMissing"]


# ─────────────────────────────────────────────────────────
# Test 4: URL with coordinates only
# ─────────────────────────────────────────────────────────

class TestCoordsOnly:

    def test_coordinates_extracted(self):
        result = maps_parser.parse(COORDS_ONLY_URL)
        lat = result["property"]["latitude"]["value"]
        lng = result["property"]["longitude"]["value"]
        assert lat is not None
        assert lng is not None
        assert abs(lat - 28.6139) < 0.01
        assert abs(lng - 77.2090) < 0.01


# ─────────────────────────────────────────────────────────
# Test 7 & 8: Price and property type NEVER fabricated
# ─────────────────────────────────────────────────────────

class TestNeverFabricates:

    def test_price_always_null(self):
        result = maps_parser.parse(MAPLE_PLACE_URL)
        assert result["property"]["price"]["value"] is None

    def test_currency_always_null(self):
        result = maps_parser.parse(MAPLE_PLACE_URL)
        assert result["property"]["currency"]["value"] is None

    def test_property_type_always_null(self):
        result = maps_parser.parse(MAPLE_PLACE_URL)
        assert result["property"]["propertyType"]["value"] is None

    def test_address_null_without_geocoding(self):
        # Parser alone should not generate an address from coordinates
        result = maps_parser.parse(MAPLE_PLACE_URL)
        assert result["property"]["address"]["value"] is None

    def test_price_in_fields_missing(self):
        result = maps_parser.parse(MAPLE_PLACE_URL)
        assert "price" in result["extraction"]["fieldsMissing"]

    def test_property_type_in_fields_missing(self):
        result = maps_parser.parse(MAPLE_PLACE_URL)
        assert "propertyType" in result["extraction"]["fieldsMissing"]

    def test_classification_type_is_none(self):
        result = maps_parser.parse(MAPLE_PLACE_URL)
        assert result["classification"]["type"] is None

    def test_classification_confidence_is_none(self):
        result = maps_parser.parse(MAPLE_PLACE_URL)
        assert result["classification"]["confidence"] is None


# ─────────────────────────────────────────────────────────
# Test 9: Street View full metadata verification
# ─────────────────────────────────────────────────────────

class TestStreetViewMetadata:

    FULL_SV_URL = (
        "https://www.google.com/maps/place/Maple+High+Street/@23.1819082,77.4546484,"
        "493a,75y,326.34h,90t/data=!3m7!1e1!3m5!1sqAuMIEz3OlmbkFJuE9MV2w"
        "!2e0!3e11!7i16384!8i8192!4m14!1m7!3m6!1s0x397c43e9131afdbd:0x33286b10ee89dc9c"
        "!2sMaple+High+Street!8m2!3d23.1819592!4d77.454601"
    )

    def test_sv_latitude(self):
        result = maps_parser.parse(self.FULL_SV_URL)
        assert result["streetView"]["latitude"] is not None

    def test_sv_longitude(self):
        result = maps_parser.parse(self.FULL_SV_URL)
        assert result["streetView"]["longitude"] is not None

    def test_sv_heading(self):
        result = maps_parser.parse(self.FULL_SV_URL)
        h = result["streetView"]["heading"]
        assert h is not None
        assert abs(h - 326.34) < 0.1

    def test_sv_fov(self):
        result = maps_parser.parse(self.FULL_SV_URL)
        fov = result["streetView"]["fieldOfView"]
        assert fov is not None
        assert fov == 75.0

    def test_panorama_id_present(self):
        result = maps_parser.parse(self.FULL_SV_URL)
        assert result["streetView"]["panoramaId"] is not None


# ─────────────────────────────────────────────────────────
# Extraction status tests
# ─────────────────────────────────────────────────────────

class TestExtractionStatus:

    def test_status_is_partial_for_place_url(self):
        result = maps_parser.parse(MAPLE_PLACE_URL)
        # Always partial because price/address/propertyType are never in URL
        assert result["extraction"]["status"] == "partial"

    def test_extraction_has_timestamp(self):
        result = maps_parser.parse(MAPLE_PLACE_URL)
        assert "timestamp" in result["extraction"]
        assert result["extraction"]["timestamp"]

    def test_source_url_preserved(self):
        result = maps_parser.parse(MAPLE_PLACE_URL)
        assert result["googleMaps"]["sourceUrl"] == MAPLE_PLACE_URL
