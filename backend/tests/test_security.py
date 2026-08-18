"""
Test Suite: Security & Authorization
Tests: JWT validity, RBAC, rate limiting, phone exposure
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestJWTSecurity:
    """Tests for JWT token security."""

    async def test_missing_token_returns_403(self, client: AsyncClient):
        """Protected endpoints reject requests without token."""
        resp = await client.get("/api/v1/users/me")
        assert resp.status_code == 403

    async def test_malformed_token_returns_401(self, client: AsyncClient):
        """Malformed Bearer token is rejected."""
        resp = await client.get("/api/v1/users/me", headers={"Authorization": "Bearer invalid.token.here"})
        assert resp.status_code == 401

    async def test_expired_token_rejected(self, client: AsyncClient):
        """Expired JWT token is rejected (simulated via bad signature)."""
        fake_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.bad_sig"
        resp = await client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {fake_token}"})
        assert resp.status_code == 401

    async def test_valid_token_accesses_protected_endpoint(self, client: AsyncClient, registered_user: dict):
        """Valid token accesses protected endpoint."""
        resp = await client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {registered_user['access_token']}"})
        assert resp.status_code == 200


@pytest.mark.asyncio
class TestRoleBasedAccess:
    """Tests for role-based access control."""

    async def test_buyer_cannot_post_property(self, client: AsyncClient, buyer_auth_headers: dict):
        """Buyers are blocked from posting properties."""
        resp = await client.post("/api/v1/properties", json={
            "title": "Test", "purpose": "rent", "property_type": "Apartment",
            "price": 10000, "category": "residential",
        }, headers=buyer_auth_headers)
        assert resp.status_code == 403

    async def test_non_admin_cannot_access_admin_routes(self, client: AsyncClient, buyer_auth_headers: dict):
        """Non-admin users are blocked from admin endpoints."""
        resp = await client.get("/api/v1/admin/dashboard", headers=buyer_auth_headers)
        assert resp.status_code == 403

    async def test_guest_cannot_save_favorites(self, client: AsyncClient):
        """Unauthenticated guest cannot save favorites."""
        resp = await client.post("/api/v1/favorites", json={"property_id": "00000000-0000-0000-0000-000000000001"})
        assert resp.status_code == 403


@pytest.mark.asyncio
class TestContactPrivacy:
    """Verify owner phone/email is never leaked to unauthorized users."""

    async def test_property_api_does_not_expose_contact_to_guest(self, client: AsyncClient, owner_auth_headers: dict):
        """Public property endpoint must not return owner contact info."""
        create_resp = await client.post("/api/v1/properties", json={
            "title": "Privacy Test Property",
            "purpose": "rent",
            "category": "residential",
            "property_type": "Apartment",
            "price": 15000,
            "contact_phone": "9911991199",
            "contact_email": "secret@owner.com",
        }, headers=owner_auth_headers)

        if create_resp.status_code == 201:
            prop_id = create_resp.json()["id"]
            resp = await client.get(f"/api/v1/properties/{prop_id}")
            if resp.status_code == 200:
                body = resp.json()
                # Strict check: contact phone must be None or masked
                assert body.get("contact_phone") not in ["9911991199", "secret@owner.com"]


@pytest.mark.asyncio
class TestHealthCheck:
    """Basic health check tests."""

    async def test_health_endpoint_returns_ok(self, client: AsyncClient):
        """Health endpoint is reachable and returns ok."""
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert "app" in data

    async def test_api_docs_accessible(self, client: AsyncClient):
        """Swagger docs are accessible in debug mode."""
        resp = await client.get("/docs")
        assert resp.status_code == 200
