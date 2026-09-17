"""
Automated Test Suite: Deep Input Validation & Edge Case Audit
Tests direct API endpoints with boundary values, bad data types, malformed strings, and attack vectors.
"""
import pytest
from httpx import AsyncClient

BASE_PROP_PAYLOAD = {
    "title": "Validation Test Property Deep",
    "purpose": "rent",
    "category": "residential",
    "property_type": "Apartment",
    "bhk": 2,
    "area_sqft": 1200.0,
    "bathrooms": 2,
    "price": 25000.0,
    "contact_name": "Test Owner",
    "contact_phone": "9876543210",
    "contact_email": "owner@example.com",
    "description": "Validation test property description for deep audit.",
    "city": "Bhopal",
    "area": "Arera Colony",
}


@pytest.mark.asyncio
class TestRegistrationEdgeCases:
    """Registration API input validation and boundary tests."""

    async def test_register_missing_name_fails(self, client: AsyncClient):
        payload = {
            "email": "noname@example.com",
            "mobile": "9876543210",
            "password": "Password123!",
        }
        resp = await client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 422

    @pytest.mark.parametrize("bad_email", [
        "invalidemail",
        "user@",
        "@domain.com",
        "user.com",
        "user name@domain.com",
    ])
    async def test_register_malformed_email_rejected(self, client: AsyncClient, bad_email: str):
        payload = {
            "name": "Test User",
            "email": bad_email,
            "mobile": "9876543210",
            "password": "Password123!",
        }
        resp = await client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 422, f"Failed for email: {bad_email}"

    @pytest.mark.parametrize("bad_mobile", [
        "12345",          # Too short
        "98765432101",    # Too long (11 digits)
        "5876543210",     # Doesn't start with 6-9
        "abcdefghij",     # Non-numeric
        "9876543210; DROP TABLE users;", # Injection
    ])
    async def test_register_malformed_mobile_rejected(self, client: AsyncClient, bad_mobile: str):
        payload = {
            "name": "Test User",
            "email": "valid@example.com",
            "mobile": bad_mobile,
            "password": "Password123!",
        }
        resp = await client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 422, f"Failed for mobile: {bad_mobile}"

    async def test_register_short_password_rejected(self, client: AsyncClient):
        payload = {
            "name": "Test User",
            "email": "shortpass@example.com",
            "mobile": "9876543210",
            "password": "short", # < 8 chars
        }
        resp = await client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 422


@pytest.mark.asyncio
class TestLoginEdgeCases:
    """Login API input validation and authentication security tests."""

    async def test_login_empty_body_rejected(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/login", json={})
        assert resp.status_code == 422

    async def test_login_missing_password_rejected(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/login", json={"email": "buyer@test.com"})
        assert resp.status_code == 422

    async def test_login_non_existent_email_returns_401(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/login", json={
            "email": "nonexistent_user_999@test.com",
            "password": "password123"
        })
        assert resp.status_code == 401

    async def test_login_wrong_password_returns_401(self, client: AsyncClient, registered_user: dict):
        resp = await client.post("/api/v1/auth/login", json={
            "email": "buyer@test.com",
            "password": "wrongpassword123"
        })
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestPropertyValidationDeep:
    """Deep validation tests for property payload edge cases."""

    async def test_price_nan_string_rejected(self, client: AsyncClient, owner_auth_headers: dict):
        payload = {**BASE_PROP_PAYLOAD, "price": "NaN"}
        resp = await client.post("/api/v1/properties", json=payload, headers=owner_auth_headers)
        assert resp.status_code == 422

    async def test_price_infinity_string_rejected(self, client: AsyncClient, owner_auth_headers: dict):
        payload = {**BASE_PROP_PAYLOAD, "price": "Infinity"}
        resp = await client.post("/api/v1/properties", json=payload, headers=owner_auth_headers)
        assert resp.status_code == 422

    async def test_bhk_float_rejected(self, client: AsyncClient, owner_auth_headers: dict):
        payload = {**BASE_PROP_PAYLOAD, "bhk": "2.5"}
        resp = await client.post("/api/v1/properties", json=payload, headers=owner_auth_headers)
        assert resp.status_code == 422

    async def test_bhk_text_string_rejected(self, client: AsyncClient, owner_auth_headers: dict):
        payload = {**BASE_PROP_PAYLOAD, "bhk": "two"}
        resp = await client.post("/api/v1/properties", json=payload, headers=owner_auth_headers)
        assert resp.status_code == 422

    async def test_area_sqft_zero_rejected(self, client: AsyncClient, owner_auth_headers: dict):
        payload = {**BASE_PROP_PAYLOAD, "area_sqft": 0}
        resp = await client.post("/api/v1/properties", json=payload, headers=owner_auth_headers)
        assert resp.status_code == 422

    async def test_area_sqft_negative_rejected(self, client: AsyncClient, owner_auth_headers: dict):
        payload = {**BASE_PROP_PAYLOAD, "area_sqft": -500}
        resp = await client.post("/api/v1/properties", json=payload, headers=owner_auth_headers)
        assert resp.status_code == 422

    async def test_area_sqft_non_numeric_string_rejected(self, client: AsyncClient, owner_auth_headers: dict):
        payload = {**BASE_PROP_PAYLOAD, "area_sqft": "1200sqft"}
        resp = await client.post("/api/v1/properties", json=payload, headers=owner_auth_headers)
        assert resp.status_code == 422

    async def test_bathrooms_negative_rejected(self, client: AsyncClient, owner_auth_headers: dict):
        payload = {**BASE_PROP_PAYLOAD, "bathrooms": -1}
        resp = await client.post("/api/v1/properties", json=payload, headers=owner_auth_headers)
        assert resp.status_code == 422

    async def test_disallowed_property_type_rejected(self, client: AsyncClient, owner_auth_headers: dict):
        payload = {**BASE_PROP_PAYLOAD, "property_type": "Castle"}
        resp = await client.post("/api/v1/properties", json=payload, headers=owner_auth_headers)
        assert resp.status_code == 422

    async def test_invalid_contact_phone_rejected(self, client: AsyncClient, owner_auth_headers: dict):
        payload = {**BASE_PROP_PAYLOAD, "contact_phone": "12345"}
        resp = await client.post("/api/v1/properties", json=payload, headers=owner_auth_headers)
        assert resp.status_code == 422

    async def test_invalid_contact_email_rejected(self, client: AsyncClient, owner_auth_headers: dict):
        payload = {**BASE_PROP_PAYLOAD, "contact_email": "invalidemailformat"}
        resp = await client.post("/api/v1/properties", json=payload, headers=owner_auth_headers)
        assert resp.status_code == 422


@pytest.mark.asyncio
class TestSearchValidationDeep:
    """Deep validation tests for search endpoint parameters."""

    async def test_negative_max_price_rejected(self, client: AsyncClient):
        resp = await client.get("/api/v1/search?max_price=-100")
        assert resp.status_code == 422

    async def test_min_price_greater_than_max_price_rejected(self, client: AsyncClient):
        resp = await client.get("/api/v1/search?min_price=100000&max_price=50000")
        assert resp.status_code == 400
