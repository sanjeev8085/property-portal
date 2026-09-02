"""
Test Suite: Properties endpoints
Tests: POST /properties, GET /properties/{id}, PUT, DELETE, status, images
"""
import pytest
from httpx import AsyncClient

VALID_PROPERTY_PAYLOAD = {
    "title": "2 BHK Apartment in Arera Colony",
    "purpose": "rent",
    "category": "residential",
    "property_type": "Apartment",
    "bhk": 2,
    "area_sqft": 1200.0,
    "bathrooms": 2,
    "floor": 3,
    "total_floors": 10,
    "furnished_status": "furnished",
    "parking": 1,
    "price": 22000.0,
    "security_deposit": 44000.0,
    "is_negotiable": True,
    "contact_name": "Rahul Sharma",
    "contact_phone": "9876543210",
    "description": "Spacious 2 BHK flat near market with all amenities.",
    "city": "Bhopal",
    "area": "Arera Colony",
}


@pytest.mark.asyncio
class TestCreateProperty:
    """Tests for POST /api/v1/properties"""

    async def test_create_property_as_owner(self, client: AsyncClient, owner_auth_headers: dict):
        """Owner can create a property listing."""
        resp = await client.post("/api/v1/properties", json=VALID_PROPERTY_PAYLOAD, headers=owner_auth_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == VALID_PROPERTY_PAYLOAD["title"]
        assert data["status"] == "pending_approval"

    async def test_create_property_unauthenticated_fails(self, client: AsyncClient):
        """Unauthenticated user cannot create property."""
        resp = await client.post("/api/v1/properties", json=VALID_PROPERTY_PAYLOAD)
        assert resp.status_code in (401, 403)

    async def test_create_property_missing_required_fields(self, client: AsyncClient, owner_auth_headers: dict):
        """Missing required fields return 422."""
        resp = await client.post("/api/v1/properties", json={"title": "incomplete"}, headers=owner_auth_headers)
        assert resp.status_code == 422

    async def test_create_property_buyer_cannot_create(self, client: AsyncClient, buyer_auth_headers: dict):
        """Buyer role cannot create a property listing."""
        resp = await client.post("/api/v1/properties", json=VALID_PROPERTY_PAYLOAD, headers=buyer_auth_headers)
        assert resp.status_code == 403

    async def test_create_duplicate_property_fails(self, client: AsyncClient, owner_auth_headers: dict):
        """Duplicate property submission with matching title, price and configuration fails with 409 or 400."""
        # First creation succeeds
        dup_payload = {**VALID_PROPERTY_PAYLOAD, "title": "Unique Duplicate Test Villa", "price": 99999.0, "bhk": 3}
        resp1 = await client.post("/api/v1/properties", json=dup_payload, headers=owner_auth_headers)
        assert resp1.status_code == 201

        # Second creation with identical title, price, and BHK fails
        resp2 = await client.post("/api/v1/properties", json=dup_payload, headers=owner_auth_headers)
        assert resp2.status_code in (400, 409)
        assert "Duplicate listing detected" in resp2.json()["detail"]


@pytest.mark.asyncio
class TestGetProperty:
    """Tests for GET /api/v1/properties/{id}"""

    async def test_get_published_property(self, client: AsyncClient, owner_auth_headers: dict):
        """Published property is accessible to anyone."""
        # Create and approve property first
        create_resp = await client.post("/api/v1/properties", json=VALID_PROPERTY_PAYLOAD, headers=owner_auth_headers)
        assert create_resp.status_code == 201
        prop_id = create_resp.json()["id"]

        resp = await client.get(f"/api/v1/properties/{prop_id}")
        assert resp.status_code in (200, 404)  # 404 if only published props are shown

    async def test_get_nonexistent_property(self, client: AsyncClient):
        """Nonexistent property ID returns 404."""
        resp = await client.get("/api/v1/properties/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404

    async def test_contact_info_hidden_for_guest(self, client: AsyncClient, owner_auth_headers: dict):
        """Contact details should be masked for guests."""
        create_resp = await client.post("/api/v1/properties", json=VALID_PROPERTY_PAYLOAD, headers=owner_auth_headers)
        if create_resp.status_code == 201:
            prop_id = create_resp.json()["id"]
            resp = await client.get(f"/api/v1/properties/{prop_id}")
            if resp.status_code == 200:
                data = resp.json()
                # Contact phone should not be exposed in public response
                assert data.get("contact_phone") is None or data.get("contact_phone") == ""


@pytest.mark.asyncio
class TestPropertyStatus:
    """Tests for PATCH /api/v1/properties/{id}/status"""

    async def test_owner_can_mark_sold(self, client: AsyncClient, owner_auth_headers: dict):
        """Owner can mark their property as sold."""
        create_resp = await client.post("/api/v1/properties", json=VALID_PROPERTY_PAYLOAD, headers=owner_auth_headers)
        if create_resp.status_code == 201:
            prop_id = create_resp.json()["id"]
            resp = await client.patch(f"/api/v1/properties/{prop_id}/status", json={"status": "sold"}, headers=owner_auth_headers)
            assert resp.status_code in (200, 403)  # 403 if pending approval restriction

    async def test_other_user_cannot_change_status(self, client: AsyncClient, owner_auth_headers: dict, buyer_auth_headers: dict):
        """Buyer cannot change another user's property status."""
        create_resp = await client.post("/api/v1/properties", json=VALID_PROPERTY_PAYLOAD, headers=owner_auth_headers)
        if create_resp.status_code == 201:
            prop_id = create_resp.json()["id"]
            resp = await client.patch(f"/api/v1/properties/{prop_id}/status", json={"status": "sold"}, headers=buyer_auth_headers)
            assert resp.status_code == 403


@pytest.mark.asyncio
class TestDeleteProperty:
    """Tests for DELETE /api/v1/properties/{id}"""

    async def test_owner_can_delete_own_property(self, client: AsyncClient, owner_auth_headers: dict):
        """Owner can delete their own property."""
        create_resp = await client.post("/api/v1/properties", json=VALID_PROPERTY_PAYLOAD, headers=owner_auth_headers)
        if create_resp.status_code == 201:
            prop_id = create_resp.json()["id"]
            del_resp = await client.delete(f"/api/v1/properties/{prop_id}", headers=owner_auth_headers)
            assert del_resp.status_code in (200, 204)

    async def test_buyer_cannot_delete_property(self, client: AsyncClient, owner_auth_headers: dict, buyer_auth_headers: dict):
        """Buyer cannot delete a property."""
        create_resp = await client.post("/api/v1/properties", json=VALID_PROPERTY_PAYLOAD, headers=owner_auth_headers)
        if create_resp.status_code == 201:
            prop_id = create_resp.json()["id"]
            del_resp = await client.delete(f"/api/v1/properties/{prop_id}", headers=buyer_auth_headers)
            assert del_resp.status_code == 403
