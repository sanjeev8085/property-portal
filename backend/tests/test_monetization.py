"""
Test Suite: Contact Credits & Payment Flow
Tests: credit balance, unlock flow, payment creation, payment verification
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestContactCredits:
    """Tests for the contact credit system."""

    async def test_initial_credit_balance_is_zero(self, client: AsyncClient, buyer_auth_headers: dict):
        """Newly registered user has 0 contact credits."""
        resp = await client.get("/api/v1/contacts/credits", headers=buyer_auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["available_credits"] == 0

    async def test_unlock_without_credits_fails(self, client: AsyncClient, buyer_auth_headers: dict, owner_auth_headers: dict):
        """Attempting to unlock contact without credits returns 402."""
        # Create a property first
        prop_resp = await client.post("/api/v1/properties", json={
            "title": "Credit Test Property",
            "purpose": "rent",
            "category": "residential",
            "property_type": "Apartment",
            "price": 10000,
        }, headers=owner_auth_headers)

        if prop_resp.status_code == 201:
            prop_id = prop_resp.json()["id"]
            unlock_resp = await client.post(f"/api/v1/contacts/unlock/{prop_id}", headers=buyer_auth_headers)
            assert unlock_resp.status_code in (402, 403, 400)  # Payment required

    async def test_unlock_requires_authentication(self, client: AsyncClient):
        """Unauthenticated request to unlock contact is rejected."""
        resp = await client.post("/api/v1/contacts/unlock/00000000-0000-0000-0000-000000000001")
        assert resp.status_code == 403


@pytest.mark.asyncio
class TestPayments:
    """Tests for the Razorpay payment flow."""

    async def test_list_subscription_plans(self, client: AsyncClient):
        """Subscription plans are publicly accessible."""
        resp = await client.get("/api/v1/payments/plans")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_create_order_requires_auth(self, client: AsyncClient):
        """Creating a payment order requires authentication."""
        resp = await client.post("/api/v1/payments/create-order", json={"plan_id": "some-uuid"})
        assert resp.status_code == 403

    async def test_create_order_invalid_plan(self, client: AsyncClient, buyer_auth_headers: dict):
        """Invalid plan ID returns 404."""
        resp = await client.post("/api/v1/payments/create-order", json={
            "plan_id": "00000000-0000-0000-0000-000000000000"
        }, headers=buyer_auth_headers)
        assert resp.status_code == 404

    async def test_verify_payment_bad_signature(self, client: AsyncClient, buyer_auth_headers: dict):
        """Invalid Razorpay signature returns 400."""
        resp = await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": "order_fake123",
            "razorpay_payment_id": "pay_fake456",
            "razorpay_signature": "bad_signature",
        }, headers=buyer_auth_headers)
        assert resp.status_code in (400, 404)

    async def test_payment_history_returns_list(self, client: AsyncClient, buyer_auth_headers: dict):
        """Payment history endpoint returns a list."""
        resp = await client.get("/api/v1/payments/history", headers=buyer_auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


@pytest.mark.asyncio
class TestFavorites:
    """Tests for the favorites/save system."""

    async def test_save_property_as_favorite(self, client: AsyncClient, buyer_auth_headers: dict, owner_auth_headers: dict):
        """Logged-in user can save a property to favorites."""
        # Create property
        prop_resp = await client.post("/api/v1/properties", json={
            "title": "Fav Test Property",
            "purpose": "rent",
            "category": "residential",
            "property_type": "Apartment",
            "price": 12000,
        }, headers=owner_auth_headers)

        if prop_resp.status_code == 201:
            prop_id = prop_resp.json()["id"]
            fav_resp = await client.post("/api/v1/favorites", json={"property_id": prop_id}, headers=buyer_auth_headers)
            assert fav_resp.status_code in (200, 201)

    async def test_list_favorites(self, client: AsyncClient, buyer_auth_headers: dict):
        """User can list their saved favorites."""
        resp = await client.get("/api/v1/favorites", headers=buyer_auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_favorite_requires_auth(self, client: AsyncClient):
        """Unauthenticated favorite save is rejected."""
        resp = await client.post("/api/v1/favorites", json={"property_id": "some-id"})
        assert resp.status_code == 403
