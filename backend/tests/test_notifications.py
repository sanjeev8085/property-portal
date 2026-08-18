import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.models.user import User, UserType
from app.models.property import Property, PropertyStatus
from app.models.monetization import Favorite
from app.models.notification import Notification, NotificationType
from app.services.notification_service import (
    send_otp_sms,
    send_sms_notification,
    send_whatsapp_notification,
    send_email_notification,
    get_html_email_template,
    send_property_posted_admin_notification,
    send_property_approved_notification,
    send_property_rejected_notification,
    send_contact_unlocked_notification,
    send_subscription_purchased_notification,
    send_subscription_expiry_reminder,
    send_saved_search_match_notification,
    send_price_changed_notification,
    send_property_sold_rented_notification,
)


@pytest.mark.asyncio
async def test_notification_centre_endpoints(client: AsyncClient, buyer_auth_headers: dict, db_session: AsyncSession):
    # 1. Fetch current user id
    res_me = await client.get("/api/v1/users/me", headers=buyer_auth_headers)
    assert res_me.status_code == 200
    user_id = uuid.UUID(res_me.json()["id"])

    # 2. Add dummy notifications to database manually
    n1 = Notification(
        user_id=user_id,
        type=NotificationType.ADMIN_ANNOUNCEMENT,
        title="Welcome to AuraHomes!",
        body="Enjoy searching for your dream properties.",
        is_read=False
    )
    n2 = Notification(
        user_id=user_id,
        type=NotificationType.PROPERTY_APPROVED,
        title="Property Published",
        body="Your property is live.",
        is_read=True
    )
    db_session.add_all([n1, n2])
    await db_session.commit()

    # 3. Test list notifications
    resp = await client.get("/api/v1/notifications", headers=buyer_auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 2

    # 4. Test list notifications with unread_only=true
    resp_unread = await client.get("/api/v1/notifications?unread_only=true", headers=buyer_auth_headers)
    assert resp_unread.status_code == 200
    data_unread = resp_unread.json()
    assert all(not n["is_read"] for n in data_unread)

    # 5. Test mark single as read
    n1_id = str(n1.id)
    resp_read = await client.patch(f"/api/v1/notifications/{n1_id}/read", headers=buyer_auth_headers)
    assert resp_read.status_code == 200
    assert resp_read.json()["message"] == "Marked as read."

    # 6. Test delete notification
    resp_del = await client.delete(f"/api/v1/notifications/{n1_id}", headers=buyer_auth_headers)
    assert resp_del.status_code == 200
    assert resp_del.json()["message"] == "Notification deleted."


@pytest.mark.asyncio
async def test_mark_all_read_endpoints(client: AsyncClient, buyer_auth_headers: dict, db_session: AsyncSession):
    res_me = await client.get("/api/v1/users/me", headers=buyer_auth_headers)
    user_id = uuid.UUID(res_me.json()["id"])

    # Clean existing
    from sqlalchemy import delete
    await db_session.execute(delete(Notification).where(Notification.user_id == user_id))
    await db_session.commit()

    n = Notification(
        user_id=user_id,
        type=NotificationType.ADMIN_ANNOUNCEMENT,
        title="Unread 1",
        body="Body 1",
        is_read=False
    )
    db_session.add(n)
    await db_session.commit()

    # Test POST /mark-all-read alias
    resp = await client.post("/api/v1/notifications/mark-all-read", headers=buyer_auth_headers)
    assert resp.status_code == 200
    assert resp.json()["message"] == "All notifications marked as read."


@pytest.mark.asyncio
async def test_notification_service_triggers(db_session: AsyncSession):
    # 1. Create a mock admin user and owner user
    admin_user = User(
        name="System Admin",
        email="sys_admin@test.com",
        mobile="9898989898",
        user_type=UserType.ADMIN
    )
    owner_user = User(
        name="Property Owner",
        email="owner_test@test.com",
        mobile="9898989897",
        user_type=UserType.OWNER
    )
    buyer_user = User(
        name="Buyer User",
        email="buyer_test@test.com",
        mobile="9898989896",
        user_type=UserType.BUYER
    )
    db_session.add_all([admin_user, owner_user, buyer_user])
    await db_session.commit()

    prop_id = uuid.uuid4()

    # 2. Test send_property_posted_admin_notification
    await send_property_posted_admin_notification("2 BHK flat in Arera Colony", db_session)
    res_admin = await db_session.execute(
        select(Notification).where(Notification.user_id == admin_user.id)
    )
    assert len(res_admin.scalars().all()) >= 1

    # 3. Test send_property_approved_notification
    await send_property_approved_notification(owner_user.id, prop_id, "2 BHK flat", db_session)
    res_appr = await db_session.execute(
        select(Notification).where(
            Notification.user_id == owner_user.id,
            Notification.type == NotificationType.PROPERTY_APPROVED
        )
    )
    assert len(res_appr.scalars().all()) >= 1

    # 4. Test send_property_rejected_notification
    await send_property_rejected_notification(owner_user.id, "2 BHK flat", "Blurry images", db_session)
    res_reject = await db_session.execute(
        select(Notification).where(
            Notification.user_id == owner_user.id,
            Notification.type == NotificationType.PROPERTY_REJECTED
        )
    )
    assert len(res_reject.scalars().all()) >= 1

    # 5. Test send_contact_unlocked_notification
    await send_contact_unlocked_notification(owner_user.id, "2 BHK flat", "Rahul Sharma", db_session)
    res_unlock = await db_session.execute(
        select(Notification).where(
            Notification.user_id == owner_user.id,
            Notification.type == NotificationType.CONTACT_UNLOCKED
        )
    )
    assert len(res_unlock.scalars().all()) >= 1

    # 6. Test send_subscription_purchased_notification
    await send_subscription_purchased_notification(owner_user.id, "Standard Plan", 15, db_session)
    res_sub = await db_session.execute(
        select(Notification).where(
            Notification.user_id == owner_user.id,
            Notification.type == NotificationType.SUBSCRIPTION_PURCHASED
        )
    )
    assert len(res_sub.scalars().all()) >= 1

    # 7. Test send_subscription_expiry_reminder
    await send_subscription_expiry_reminder(owner_user.id, 3, db_session)
    res_exp = await db_session.execute(
        select(Notification).where(
            Notification.user_id == owner_user.id,
            Notification.type == NotificationType.SUBSCRIPTION_EXPIRING
        )
    )
    assert len(res_exp.scalars().all()) >= 1

    # 8. Test send_saved_search_match_notification
    await send_saved_search_match_notification(
        user_id=buyer_user.id,
        search_name="Bhopal 2BHK Under 40L",
        property_id=prop_id,
        property_title="Modern 2BHK Apartment",
        price=3500000.0,
        db=db_session,
        notify_email=True,
        notify_whatsapp=True
    )
    res_ssm = await db_session.execute(
        select(Notification).where(
            Notification.user_id == buyer_user.id,
            Notification.type == NotificationType.SAVED_SEARCH_MATCH
        )
    )
    assert len(res_ssm.scalars().all()) >= 1

    # Add favorite for price changed and sold/rented tests
    fav = Favorite(user_id=buyer_user.id, property_id=prop_id)
    db_session.add(fav)
    await db_session.commit()

    # 9. Test send_price_changed_notification
    await send_price_changed_notification(prop_id, "Modern 2BHK Apartment", 3800000.0, 3500000.0, db_session)
    res_pc = await db_session.execute(
        select(Notification).where(
            Notification.user_id == buyer_user.id,
            Notification.type == NotificationType.PRICE_CHANGED
        )
    )
    assert len(res_pc.scalars().all()) >= 1

    # 10. Test send_property_sold_rented_notification
    await send_property_sold_rented_notification(prop_id, "Modern 2BHK Apartment", "sold", db_session)
    res_sr = await db_session.execute(
        select(Notification).where(
            Notification.user_id == buyer_user.id,
            Notification.type == NotificationType.PROPERTY_SOLD_RENTED
        )
    )
    assert len(res_sr.scalars().all()) >= 1


@pytest.mark.asyncio
async def test_email_and_sms_and_whatsapp_utilities():
    # Test HTML template generator
    html = get_html_email_template("Test Notification", "This is a test notification message", "/properties/123")
    assert "Test Notification" in html
    assert "View on AuraHomes" in html
    assert "/properties/123" in html

    # Test send email
    res_email = await send_email_notification("test@aurahomes.com", "Test Subject", html)
    assert res_email is True

    # Test send SMS OTP
    res_otp = await send_otp_sms("9876543210", "123456")
    assert res_otp is True

    # Test send SMS notification
    res_sms = await send_sms_notification("9876543210", "AuraHomes test alert")
    assert res_sms is True

    # Test send WhatsApp notification
    res_wa = await send_whatsapp_notification("9876543210", "AuraHomes WhatsApp alert")
    assert res_wa is True


@pytest.mark.asyncio
async def test_admin_broadcast_endpoint(client: AsyncClient, db_session: AsyncSession):
    # Register an admin
    resp_adm = await client.post("/api/v1/auth/register", json={
        "name": "Super Admin User",
        "email": "superadmin_broadcast@test.com",
        "mobile": "9911991188",
        "password": "superpass123",
        "user_type": "admin",
        "city": "Bhopal",
    })
    assert resp_adm.status_code == 201
    admin_token = resp_adm.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Broadcast announcement
    payload = {
        "title": "Scheduled Platform Maintenance",
        "body": "System will undergo maintenance tonight.",
        "target": "all"
    }
    resp_bc = await client.post("/api/v1/admin/notifications/broadcast", json=payload, headers=admin_headers)
    assert resp_bc.status_code == 200
    assert resp_bc.json()["sent_count"] >= 1
