import pytest
from httpx import AsyncClient
import io

VALID_PAYLOAD = {
    "title": "Advanced 3 BHK Villa in Vijay Nagar",
    "purpose": "sell",
    "category": "residential",
    "property_type": "Villa",
    "bhk": 3,
    "area_sqft": 2400.0,
    "bathrooms": 3,
    "price": 8500000.0,
    "description": "Premium villa listing for advanced coverage.",
}

@pytest.mark.asyncio
async def test_advanced_security_and_metadata(client: AsyncClient, owner_auth_headers: dict):
    # 1. Create listing
    resp = await client.post("/api/v1/properties", json=VALID_PAYLOAD, headers=owner_auth_headers)
    assert resp.status_code == 201
    prop_id = resp.json()["id"]

    # 2. Prevent duplicate listing creation
    resp_dup = await client.post("/api/v1/properties", json=VALID_PAYLOAD, headers=owner_auth_headers)
    assert resp_dup.status_code == 400
    assert "duplicate" in resp_dup.json()["detail"].lower()

    # 3. Track page views
    resp_view = await client.post(f"/api/v1/properties/{prop_id}/view")
    assert resp_view.status_code == 201

    # 4. Upload listing image — use a minimal JPEG with valid magic bytes (SOI marker)
    # b"\xff\xd8\xff\xe0" = JPEG SOI + APP0 marker (standard JFIF header start)
    minimal_jpeg = b"\xff\xd8\xff\xe0" + b"\x00" * 100
    file_data = {"file": ("test.jpg", io.BytesIO(minimal_jpeg), "image/jpeg")}
    resp_img = await client.post(
        f"/api/v1/properties/{prop_id}/images",
        files=file_data,
        headers={"Authorization": owner_auth_headers["Authorization"]}
    )
    assert resp_img.status_code == 201
    img_id = resp_img.json()["image_id"]

    # 5. Reorder listing images
    resp_reorder = await client.patch(
        f"/api/v1/properties/{prop_id}/images/reorder",
        json={"image_ids": [img_id]},
        headers=owner_auth_headers
    )
    assert resp_reorder.status_code == 200

    # 6. Delete listing image
    resp_del_img = await client.delete(
        f"/api/v1/properties/{prop_id}/images/{img_id}",
        headers=owner_auth_headers
    )
    assert resp_del_img.status_code == 200

    # 7. Access public profile
    resp_me = await client.get("/api/v1/users/me", headers=owner_auth_headers)
    assert resp_me.status_code == 200
    my_id = resp_me.json()["id"]

    resp_profile = await client.get(f"/api/v1/users/{my_id}")
    assert resp_profile.status_code == 200
    assert resp_profile.json()["name"] == resp_me.json()["name"]


@pytest.mark.asyncio
async def test_saved_searches_and_alerts(client: AsyncClient, buyer_auth_headers: dict, owner_auth_headers: dict):
    # 1. Create a saved search
    search_payload = {
        "name": "Bhopal 3 BHK Alert",
        "filters": {
            "bhk": 3,
            "property_type": "Villa",
            "price_max": 9000000.0,
        },
        "notify_email": True,
    }
    resp = await client.post("/api/v1/saved-searches", json=search_payload, headers=buyer_auth_headers)
    assert resp.status_code == 201
    search_id = resp.json()["id"]

    # 2. List saved searches
    resp_list = await client.get("/api/v1/saved-searches", headers=buyer_auth_headers)
    assert resp_list.status_code == 200
    assert len(resp_list.json()) >= 1

    # 3. Register admin to approve properties
    resp_adm = await client.post("/api/v1/auth/register", json={
        "name": "Test Admin",
        "email": "admin_test@test.com",
        "mobile": "9999999999",
        "password": "testpass123",
        "user_type": "admin",
        "city": "Bhopal",
    })
    assert resp_adm.status_code == 201
    admin_token = resp_adm.json()["access_token"]
    admin_auth = {"Authorization": f"Bearer {admin_token}"}

    # 4. Create property matching search filters
    resp_prop = await client.post("/api/v1/properties", json=VALID_PAYLOAD, headers=owner_auth_headers)
    assert resp_prop.status_code == 201
    prop_id = resp_prop.json()["id"]

    # 5. Approve property as Admin -> Should trigger the matching alerts notification!
    resp_appr = await client.post(f"/api/v1/admin/properties/{prop_id}/approve", headers=admin_auth)
    assert resp_appr.status_code == 200

    # 6. Verify buyer receives match alert notification
    resp_notif = await client.get("/api/v1/notifications", headers=buyer_auth_headers)
    assert resp_notif.status_code == 200
    notifs = resp_notif.json()
    assert len(notifs) >= 1

    # 7. Delete saved search
    resp_del = await client.delete(f"/api/v1/saved-searches/{search_id}", headers=buyer_auth_headers)
    assert resp_del.status_code == 200


@pytest.mark.asyncio
async def test_admin_management_endpoints(client: AsyncClient, owner_auth_headers: dict):
    # 1. Register admin
    resp_adm = await client.post("/api/v1/auth/register", json={
        "name": "Admin Manager",
        "email": "admin_manager@test.com",
        "mobile": "9888888888",
        "password": "testpass123",
        "user_type": "admin",
        "city": "Bhopal",
    })
    assert resp_adm.status_code == 201
    admin_token = resp_adm.json()["access_token"]
    admin_auth = {"Authorization": f"Bearer {admin_token}"}

    # Get a user's ID
    resp_me = await client.get("/api/v1/users/me", headers=owner_auth_headers)
    user_id = resp_me.json()["id"]

    # 2. Get users list (admin)
    resp_users = await client.get("/api/v1/admin/users", headers=admin_auth)
    assert resp_users.status_code == 200
    assert len(resp_users.json()) >= 1

    # 3. Create property *before* user gets suspended
    resp_prop = await client.post("/api/v1/properties", json=VALID_PAYLOAD, headers=owner_auth_headers)
    assert resp_prop.status_code == 201
    prop_id = resp_prop.json()["id"]

    # 4. Update user status to suspended
    resp_status = await client.patch(
        f"/api/v1/admin/users/{user_id}/status",
        json={"status": "suspended"},
        headers=admin_auth
    )
    assert resp_status.status_code == 200
    assert resp_status.json()["status"] == "suspended"

    # Verify suspended user cannot create listing (status 403)
    resp_prop_fail = await client.post("/api/v1/properties", json=VALID_PAYLOAD, headers=owner_auth_headers)
    assert resp_prop_fail.status_code == 403

    # 5. List properties as admin
    resp_props = await client.get("/api/v1/admin/properties", headers=admin_auth)
    assert resp_props.status_code == 200

    # 6. Toggle featured status
    resp_feat = await client.patch(f"/api/v1/admin/properties/{prop_id}/feature", headers=admin_auth)
    assert resp_feat.status_code == 200
    assert resp_feat.json()["is_featured"] is True

    # 7. List reports
    resp_reports = await client.get("/api/v1/admin/reports", headers=admin_auth)
    assert resp_reports.status_code == 200

    # 8. List payments
    resp_payments = await client.get("/api/v1/admin/payments", headers=admin_auth)
    assert resp_payments.status_code == 200

    # 9. Get analytics
    resp_analytics = await client.get("/api/v1/admin/analytics", headers=admin_auth)
    assert resp_analytics.status_code == 200
    assert "revenue" in resp_analytics.json()


@pytest.mark.asyncio
async def test_scheduler_and_notifications(client: AsyncClient, db_session, buyer_auth_headers: dict):
    from datetime import datetime, timezone, timedelta
    from app.models.monetization import Subscription, SubscriptionStatus, SubscriptionPlan
    from app.core.scheduler import check_subscription_expiries

    # Get current user details from /me
    resp_me = await client.get("/api/v1/users/me", headers=buyer_auth_headers)
    user_id = resp_me.json()["id"]

    # 1. Create a subscription plan
    import uuid
    plan = SubscriptionPlan(
        id=uuid.uuid4(),
        name="Test Premium Plan",
        price=199.0,
        contact_limit=10,
        validity_days=30,
        is_active=True
    )
    db_session.add(plan)
    await db_session.commit()

    # 2. Create subscription expiring in 2 days
    sub = Subscription(
        user_id=uuid.UUID(user_id),
        plan_id=plan.id,
        starts_at=datetime.now(timezone.utc) - timedelta(days=10),
        expires_at=datetime.now(timezone.utc) + timedelta(days=2),
        status=SubscriptionStatus.ACTIVE
    )
    db_session.add(sub)
    await db_session.commit()

    # 3. Trigger check expiries scheduler helper
    await check_subscription_expiries(db_session)

    # 4. Verify notification is logged inside DB for buyer
    resp_notif = await client.get("/api/v1/notifications", headers=buyer_auth_headers)
    assert resp_notif.status_code == 200
    notifs = resp_notif.json()
    assert any("expire" in n["body"] for n in notifs)

    # 5. Verify direct notifications helpers (email & SMS)
    from app.services.notification_service import send_email_notification, send_otp_sms
    assert await send_email_notification("test@user.com", "Alert Subject", "HTML Alert Body") is True
    assert await send_otp_sms("9999999999", "1234") is True
