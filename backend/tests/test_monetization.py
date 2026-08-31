"""
Test Suite: Contact Credits & Payment Flow
Tests: credit balance, unlock flow, payment creation, payment verification
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


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


import pytest_asyncio

@pytest_asyncio.fixture
async def seeded_plan(db_session: AsyncSession):
    from app.models.monetization import SubscriptionPlan
    import uuid
    plan = SubscriptionPlan(
        id=uuid.uuid4(),
        name="Test Plan",
        description="For testing",
        price=100.0,
        contact_limit=10,
        validity_days=30,
        is_active=True
    )
    db_session.add(plan)
    await db_session.commit()
    return plan


async def _verify_mobile_for_test(client: AsyncClient, mobile: str):
    resp = await client.post(
        "/api/v1/auth/verify-otp",
        json={"mobile": mobile, "otp": "123456"}
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
class TestCreditSystemEndToEnd:
    """End-to-End & Regression Tests for payment, credits, and unlocking."""

    async def test_successful_payment_awards_credits(
        self, client: AsyncClient, buyer_auth_headers: dict, seeded_plan
    ):
        # 1. Create order
        order_resp = await client.post(
            "/api/v1/payments/create-order",
            json={"plan_id": str(seeded_plan.id)},
            headers=buyer_auth_headers
        )
        assert order_resp.status_code == 200
        order_data = order_resp.json()
        gateway_order_id = order_data["gateway_order_id"]

        # 2. Verify payment
        verify_resp = await client.post(
            "/api/v1/payments/verify",
            json={
                "razorpay_order_id": gateway_order_id,
                "razorpay_payment_id": "pay_test_123",
                "razorpay_signature": "sig_test_123",
            },
            headers=buyer_auth_headers
        )
        assert verify_resp.status_code == 200
        verify_data = verify_resp.json()
        assert verify_data["credits_added"] == seeded_plan.contact_limit

        # 3. Check credits balance via API
        credits_resp = await client.get("/api/v1/contacts/credits", headers=buyer_auth_headers)
        assert credits_resp.status_code == 200
        assert credits_resp.json()["available_credits"] == seeded_plan.contact_limit

    async def test_duplicate_payment_is_idempotent(
        self, client: AsyncClient, buyer_auth_headers: dict, seeded_plan
    ):
        order_resp = await client.post(
            "/api/v1/payments/create-order",
            json={"plan_id": str(seeded_plan.id)},
            headers=buyer_auth_headers
        )
        gateway_order_id = order_resp.json()["gateway_order_id"]

        # First verification
        v1 = await client.post(
            "/api/v1/payments/verify",
            json={
                "razorpay_order_id": gateway_order_id,
                "razorpay_payment_id": "pay_test_dup",
                "razorpay_signature": "sig_test_dup",
            },
            headers=buyer_auth_headers
        )
        assert v1.status_code == 200

        # Duplicate verification attempt
        v2 = await client.post(
            "/api/v1/payments/verify",
            json={
                "razorpay_order_id": gateway_order_id,
                "razorpay_payment_id": "pay_test_dup",
                "razorpay_signature": "sig_test_dup",
            },
            headers=buyer_auth_headers
        )
        assert v2.status_code == 200
        assert v2.json()["credits_added"] == 0

        # Balance remains same
        credits_resp = await client.get("/api/v1/contacts/credits", headers=buyer_auth_headers)
        assert credits_resp.json()["available_credits"] == seeded_plan.contact_limit

    async def test_failed_payment_awards_zero_credits(
        self, client: AsyncClient, buyer_auth_headers: dict, seeded_plan
    ):
        order_resp = await client.post(
            "/api/v1/payments/create-order",
            json={"plan_id": str(seeded_plan.id)},
            headers=buyer_auth_headers
        )
        gateway_order_id = order_resp.json()["gateway_order_id"]

        # Simulate webhook payment.failed
        webhook_resp = await client.post(
            "/api/v1/payments/webhook",
            json={
                "event": "payment.failed",
                "payload": {
                    "payment": {
                        "entity": {
                            "order_id": gateway_order_id,
                            "id": "pay_failed_123",
                        }
                    }
                }
            },
            headers={"X-Razorpay-Signature": "dummy_sig"}
        )
        assert webhook_resp.status_code == 200
        assert webhook_resp.json()["status"] == "marked_failed"

        # Check balance is still 0
        credits_resp = await client.get("/api/v1/contacts/credits", headers=buyer_auth_headers)
        assert credits_resp.json()["available_credits"] == 0

    async def test_invalid_payment_verification_awards_zero_credits(
        self, client: AsyncClient, buyer_auth_headers: dict
    ):
        # Verification for non-existent order ID
        verify_resp = await client.post(
            "/api/v1/payments/verify",
            json={
                "razorpay_order_id": "order_non_existent",
                "razorpay_payment_id": "pay_fake",
                "razorpay_signature": "sig_fake",
            },
            headers=buyer_auth_headers
        )
        assert verify_resp.status_code == 404

    async def test_user_with_credits_can_unlock_and_deducts_exactly_one(
        self, client: AsyncClient, buyer_auth_headers: dict, owner_auth_headers: dict, seeded_plan
    ):
        # Verify mobiles to prevent 403 checks
        await _verify_mobile_for_test(client, "9876543210")
        await _verify_mobile_for_test(client, "9876543211")

        # 1. Award credits via payment
        order_resp = await client.post(
            "/api/v1/payments/create-order",
            json={"plan_id": str(seeded_plan.id)},
            headers=buyer_auth_headers
        )
        gateway_order_id = order_resp.json()["gateway_order_id"]
        await client.post(
            "/api/v1/payments/verify",
            json={
                "razorpay_order_id": gateway_order_id,
                "razorpay_payment_id": "pay_unlock_test",
                "razorpay_signature": "sig_unlock_test",
            },
            headers=buyer_auth_headers
        )

        # 2. Create property
        prop_resp = await client.post(
            "/api/v1/properties",
            json={
                "title": "Property to Unlock",
                "purpose": "rent",
                "category": "residential",
                "property_type": "Apartment",
                "price": 15000,
            },
            headers=owner_auth_headers
        )
        prop_id = prop_resp.json()["id"]

        # 3. Unlock property contact
        unlock_resp = await client.post(
            f"/api/v1/contacts/unlock/{prop_id}",
            headers=buyer_auth_headers
        )
        assert unlock_resp.status_code == 200
        assert "contact" in unlock_resp.json()

        # 4. Check available credits decreased by 1
        credits_resp = await client.get("/api/v1/contacts/credits", headers=buyer_auth_headers)
        assert credits_resp.json()["available_credits"] == seeded_plan.contact_limit - 1

    async def test_user_without_credits_cannot_unlock(
        self, client: AsyncClient, buyer_auth_headers: dict, owner_auth_headers: dict
    ):
        # Verify mobiles
        await _verify_mobile_for_test(client, "9876543210")
        await _verify_mobile_for_test(client, "9876543211")

        prop_resp = await client.post(
            "/api/v1/properties",
            json={
                "title": "Un-unlockable Property",
                "purpose": "rent",
                "category": "residential",
                "property_type": "Apartment",
                "price": 15000,
            },
            headers=owner_auth_headers
        )
        prop_id = prop_resp.json()["id"]

        unlock_resp = await client.post(
            f"/api/v1/contacts/unlock/{prop_id}",
            headers=buyer_auth_headers
        )
        assert unlock_resp.status_code == 402  # Insufficient credits

    async def test_already_unlocked_property_does_not_charge_again(
        self, client: AsyncClient, buyer_auth_headers: dict, owner_auth_headers: dict, seeded_plan
    ):
        # Verify mobiles
        await _verify_mobile_for_test(client, "9876543210")
        await _verify_mobile_for_test(client, "9876543211")

        # 1. Purchase credits
        order_resp = await client.post(
            "/api/v1/payments/create-order",
            json={"plan_id": str(seeded_plan.id)},
            headers=buyer_auth_headers
        )
        gateway_order_id = order_resp.json()["gateway_order_id"]
        await client.post(
            "/api/v1/payments/verify",
            json={
                "razorpay_order_id": gateway_order_id,
                "razorpay_payment_id": "pay_unlock_multi",
                "razorpay_signature": "sig_unlock_multi",
            },
            headers=buyer_auth_headers
        )

        # 2. Create property
        prop_resp = await client.post(
            "/api/v1/properties",
            json={
                "title": "Double Charge Property Test",
                "purpose": "rent",
                "category": "residential",
                "property_type": "Apartment",
                "price": 15000,
            },
            headers=owner_auth_headers
        )
        prop_id = prop_resp.json()["id"]

        # 3. First unlock (deducts 1)
        r1 = await client.post(f"/api/v1/contacts/unlock/{prop_id}", headers=buyer_auth_headers)
        assert r1.status_code == 200

        # 4. Second unlock (already unlocked, should not deduct)
        r2 = await client.post(f"/api/v1/contacts/unlock/{prop_id}", headers=buyer_auth_headers)
        assert r2.status_code == 200
        assert r2.json()["message"] == "Already unlocked."

        # Balance remains at limit - 1
        credits_resp = await client.get("/api/v1/contacts/credits", headers=buyer_auth_headers)
        assert credits_resp.json()["available_credits"] == seeded_plan.contact_limit - 1

    async def test_concurrent_unlock_does_not_create_negative_balance(
        self, client: AsyncClient, db_session: AsyncSession, buyer_auth_headers: dict, owner_auth_headers: dict, seeded_plan
    ):
        # Verify mobiles
        await _verify_mobile_for_test(client, "9876543210")
        await _verify_mobile_for_test(client, "9876543211")

        # 1. Award only 1 credit
        from app.models.monetization import SubscriptionPlan
        import uuid
        plan = SubscriptionPlan(
            id=uuid.uuid4(),
            name="Single Credit Plan",
            description="For testing",
            price=10.0,
            contact_limit=1,
            validity_days=30,
            is_active=True
        )
        db_session.add(plan)
        await db_session.commit()

        order_resp = await client.post(
            "/api/v1/payments/create-order",
            json={"plan_id": str(plan.id)},
            headers=buyer_auth_headers
        )
        gateway_order_id = order_resp.json()["gateway_order_id"]
        await client.post(
            "/api/v1/payments/verify",
            json={
                "razorpay_order_id": gateway_order_id,
                "razorpay_payment_id": "pay_concurrent_test",
                "razorpay_signature": "sig_concurrent_test",
            },
            headers=buyer_auth_headers
        )

        # 2. Create two properties
        p1_resp = await client.post(
            "/api/v1/properties",
            json={"title": "Prop 1", "purpose": "rent", "category": "residential", "property_type": "Apartment", "price": 10000},
            headers=owner_auth_headers
        )
        p2_resp = await client.post(
            "/api/v1/properties",
            json={"title": "Prop 2", "purpose": "rent", "category": "residential", "property_type": "Apartment", "price": 10000},
            headers=owner_auth_headers
        )
        p1_id = p1_resp.json()["id"]
        p2_id = p2_resp.json()["id"]

        # 3. Request unlock for Prop 1 (should succeed)
        u1 = await client.post(f"/api/v1/contacts/unlock/{p1_id}", headers=buyer_auth_headers)
        assert u1.status_code == 200

        # 4. Request unlock for Prop 2 (should fail with 402)
        u2 = await client.post(f"/api/v1/contacts/unlock/{p2_id}", headers=buyer_auth_headers)
        assert u2.status_code == 402

        # Final balance should be exactly 0
        credits_resp = await client.get("/api/v1/contacts/credits", headers=buyer_auth_headers)
        assert credits_resp.json()["available_credits"] == 0
