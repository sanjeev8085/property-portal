"""
Automated Test Suite: API Input Validation Audit
Tests direct API requests with invalid payloads to confirm 422/400 errors.
"""
import pytest
from httpx import AsyncClient

BASE_PAYLOAD = {
    "title": "Validation Test Property",
    "purpose": "rent",
    "category": "residential",
    "property_type": "Apartment",
    "bhk": 2,
    "area_sqft": 1200.0,
    "bathrooms": 2,
    "price": 25000.0,
    "contact_name": "Test User",
    "contact_phone": "9876543210",
    "description": "Validation test property description.",
    "city": "Bhopal",
    "area": "Arera Colony",
}


@pytest.mark.asyncio
class TestPropertyValidation:
    """Tests for property creation payload validation."""

    async def test_invalid_price_with_letters_rejected(self, client: AsyncClient, owner_auth_headers: dict):
        """Price with letters (e.g. 200000abc or ₹200000dgregr) must be rejected with 422."""
        invalid_payload = {**BASE_PAYLOAD, "price": "200000abc"}
        resp = await client.post("/api/v1/properties", json=invalid_payload, headers=owner_auth_headers)
        assert resp.status_code == 422

    async def test_invalid_price_currency_with_letters_rejected(self, client: AsyncClient, owner_auth_headers: dict):
        """Price with currency and letters (e.g. ₹200000dgregr) must be rejected with 422."""
        invalid_payload = {**BASE_PAYLOAD, "price": "₹200000dgregr"}
        resp = await client.post("/api/v1/properties", json=invalid_payload, headers=owner_auth_headers)
        assert resp.status_code == 422

    async def test_negative_price_rejected(self, client: AsyncClient, owner_auth_headers: dict):
        """Negative price (e.g. -25000) must be rejected with 422."""
        invalid_payload = {**BASE_PAYLOAD, "price": -25000.0}
        resp = await client.post("/api/v1/properties", json=invalid_payload, headers=owner_auth_headers)
        assert resp.status_code == 422

    async def test_zero_price_rejected(self, client: AsyncClient, owner_auth_headers: dict):
        """Zero price (0) must be rejected with 422."""
        invalid_payload = {**BASE_PAYLOAD, "price": 0}
        resp = await client.post("/api/v1/properties", json=invalid_payload, headers=owner_auth_headers)
        assert resp.status_code == 422

    async def test_invalid_area_with_letters_rejected(self, client: AsyncClient, owner_auth_headers: dict):
        """Area with letters (e.g. 1200xyz) must be rejected with 422."""
        invalid_payload = {**BASE_PAYLOAD, "area_sqft": "1200xyz"}
        resp = await client.post("/api/v1/properties", json=invalid_payload, headers=owner_auth_headers)
        assert resp.status_code == 422

    async def test_negative_bhk_rejected(self, client: AsyncClient, owner_auth_headers: dict):
        """Negative BHK (e.g. -2) must be rejected with 422."""
        invalid_payload = {**BASE_PAYLOAD, "bhk": -2}
        resp = await client.post("/api/v1/properties", json=invalid_payload, headers=owner_auth_headers)
        assert resp.status_code == 422

    async def test_invalid_property_type_rejected(self, client: AsyncClient, owner_auth_headers: dict):
        """Arbitrary property type string (e.g. InvalidCategory) must be rejected with 422."""
        invalid_payload = {**BASE_PAYLOAD, "property_type": "InvalidCategory"}
        resp = await client.post("/api/v1/properties", json=invalid_payload, headers=owner_auth_headers)
        assert resp.status_code == 422

    async def test_invalid_contact_phone_rejected(self, client: AsyncClient, owner_auth_headers: dict):
        """Invalid contact phone (e.g. abc1234567) must be rejected with 422."""
        invalid_payload = {**BASE_PAYLOAD, "contact_phone": "abc1234567"}
        resp = await client.post("/api/v1/properties", json=invalid_payload, headers=owner_auth_headers)
        assert resp.status_code == 422

    async def test_invalid_contact_email_rejected(self, client: AsyncClient, owner_auth_headers: dict):
        """Invalid contact email (e.g. user@) must be rejected with 422."""
        invalid_payload = {**BASE_PAYLOAD, "contact_email": "user@"}
        resp = await client.post("/api/v1/properties", json=invalid_payload, headers=owner_auth_headers)
        assert resp.status_code == 422


@pytest.mark.asyncio
class TestSearchValidation:
    """Tests for search endpoint query parameter validation."""

    async def test_negative_min_price_rejected(self, client: AsyncClient):
        """Negative min_price query parameter must be rejected with 422."""
        resp = await client.get("/api/v1/search?min_price=-500")
        assert resp.status_code == 422

    async def test_min_price_greater_than_max_price_rejected(self, client: AsyncClient):
        """min_price > max_price must be rejected with 400."""
        resp = await client.get("/api/v1/search?min_price=500000&max_price=100000")
        assert resp.status_code == 400
