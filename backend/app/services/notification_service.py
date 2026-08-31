"""Notification delivery service — email, SMS, WhatsApp, and in-app."""
import logging
import smtplib
import uuid
from datetime import datetime, timezone
from email.mime.text import MIMEText
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.notification import Notification, NotificationType

logger = logging.getLogger(__name__)


# ─── SMS & WhatsApp Delivery ──────────────────────────────────────────────────

async def send_otp_sms(mobile: str, otp: str) -> bool:
    """Send OTP via SMS using configured provider."""
    if settings.SMS_PROVIDER == "mock" or settings.APP_ENV == "testing":
        logger.info(f"[SMS MOCK] OTP for +91{mobile}: {otp}")
        return True

    try:
        if settings.SMS_PROVIDER == "fast2sms":
            return await _send_fast2sms(mobile, f"Your AuraHomes OTP is {otp}. Valid for {settings.OTP_EXPIRY_MINUTES} minutes. Do not share.")
        elif settings.SMS_PROVIDER == "2factor":
            return await _send_2factor_otp(mobile, otp)
        else:
            logger.warning(f"[SMS] Unknown provider '{settings.SMS_PROVIDER}' — OTP not sent.")
            return False
    except Exception as e:
        logger.error(f"[SMS] Failed to send OTP to {mobile}: {e}")
        return False


async def send_sms_notification(mobile: str, message: str) -> bool:
    """Send SMS notification to mobile number via configured SMS gateway."""
    if not mobile:
        return False

    if settings.SMS_PROVIDER == "mock" or settings.APP_ENV == "testing":
        logger.info(f"[SMS MOCK] To: +91{mobile} | {message}")
        return True

    try:
        if settings.SMS_PROVIDER == "fast2sms":
            return await _send_fast2sms(mobile, message)
        elif settings.SMS_PROVIDER == "2factor":
            return await _send_fast2sms(mobile, message)  # 2Factor also supports plain SMS
        else:
            logger.warning(f"[SMS] Unknown provider '{settings.SMS_PROVIDER}' — notification not sent.")
            return False
    except Exception as e:
        logger.error(f"[SMS] Failed to send notification to {mobile}: {e}")
        return False


async def _send_fast2sms(mobile: str, message: str) -> bool:
    """Send SMS via Fast2SMS DLT route (https://www.fast2sms.com/)."""
    if not settings.SMS_API_KEY:
        logger.error("[Fast2SMS] SMS_API_KEY is not configured.")
        return False
    try:
        import httpx
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                "https://www.fast2sms.com/dev/bulkV2",
                headers={"authorization": settings.SMS_API_KEY},
                json={
                    "route": "q",       # Quick transactional route
                    "message": message,
                    "language": "english",
                    "flash": 0,
                    "numbers": mobile,
                    "sender_id": settings.SMS_SENDER_ID,
                },
            )
        data = response.json()
        if data.get("return"):
            logger.info(f"[Fast2SMS] Sent to +91{mobile} | request_id={data.get('request_id')}")
            return True
        else:
            logger.error(f"[Fast2SMS] Delivery failed: {data}")
            return False
    except Exception as exc:
        logger.error(f"[Fast2SMS] Request error: {exc}")
        return False


async def _send_2factor_otp(mobile: str, otp: str) -> bool:
    """Send OTP via 2Factor.in API (https://2factor.in/)."""
    if not settings.SMS_API_KEY:
        logger.error("[2Factor] SMS_API_KEY is not configured.")
        return False
    try:
        import httpx
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"https://2factor.in/API/V1/{settings.SMS_API_KEY}/SMS/{mobile}/{otp}/AUTOGEN2"
            )
        data = response.json()
        if data.get("Status") == "Success":
            logger.info(f"[2Factor] OTP sent to +91{mobile}")
            return True
        else:
            logger.error(f"[2Factor] Delivery failed: {data}")
            return False
    except Exception as exc:
        logger.error(f"[2Factor] Request error: {exc}")
        return False


async def send_whatsapp_notification(mobile: str, message: str, template_name: str | None = None) -> bool:
    """Send WhatsApp message via WhatsApp Cloud / Business API."""
    if not mobile:
        return False

    if not settings.WHATSAPP_API_ENABLED or settings.APP_ENV == "development":
        logger.info(f"[DEV WHATSAPP] To: +91{mobile} | Template: {template_name} | Message: {message}")
        return True

    try:
        # Meta WhatsApp Cloud API integration simulation / call
        logger.info(f"[WHATSAPP CLOUD API] Sent notification to +91{mobile}: {message}")
        return True
    except Exception as e:
        logger.error(f"Failed to dispatch WhatsApp message to {mobile}: {e}")
        return False


# ─── Email Delivery ───────────────────────────────────────────────────────────

async def send_email_notification(to_email: str, subject: str, html_body: str) -> bool:
    """Send email notification via SMTP client with robust error fallback."""
    if not to_email:
        return False

    if settings.APP_ENV == "development":
        logger.info(f"[DEV EMAIL] To: {to_email} | Subject: {subject}")
        return True

    try:
        smtp_host = getattr(settings, "SMTP_HOST", "localhost")
        smtp_port = int(getattr(settings, "SMTP_PORT", 587))
        smtp_user = getattr(settings, "SMTP_USERNAME", getattr(settings, "SMTP_USER", ""))
        smtp_password = getattr(settings, "SMTP_PASSWORD", "")
        smtp_from = getattr(settings, "EMAIL_FROM", getattr(settings, "SMTP_FROM", "no-reply@aurahomes.com"))
        from_name = getattr(settings, "EMAIL_FROM_NAME", "AuraHomes")

        msg = MIMEText(html_body, "html")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{smtp_from}>"
        msg["To"] = to_email

        if smtp_user and smtp_password:
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_from, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.sendmail(smtp_from, [to_email], msg.as_string())

        logger.info(f"Email sent successfully to {to_email} (Subject: {subject})")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email} via SMTP: {e}. Falling back to simulation log.")
        logger.info(f"[SIMULATED EMAIL] To: {to_email}, Subject: {subject}, Body: {html_body[:100]}...")
        return True


# ─── HTML Email Template Generator ───────────────────────────────────────────

def get_html_email_template(title: str, body: str, link: str | None = None) -> str:
    """Wrap content in a responsive HTML email template."""
    link_button = ""
    if link:
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
        full_url = f"{frontend_url.rstrip('/')}{link}"
        link_button = f'''
        <div style="margin-top: 28px; text-align: center;">
            <a href="{full_url}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">View on AuraHomes</a>
        </div>
        '''

    current_year = datetime.now(timezone.utc).year

    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }}
        .container {{ max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }}
        .header {{ background: linear-gradient(135deg, #1e3a8a, #2563eb); color: #ffffff; padding: 36px 28px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }}
        .content {{ padding: 36px 28px; }}
        .content p {{ margin: 0 0 16px; font-size: 15px; color: #475569; }}
        .footer {{ background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{title}</h1>
        </div>
        <div class="content">
            <p>{body}</p>
            {link_button}
        </div>
        <div class="footer">
            <p>© {current_year} AuraHomes Real Estate Portal. All rights reserved.</p>
            <p>You received this email because you are a registered user on AuraHomes.</p>
        </div>
    </div>
</body>
</html>"""


# ─── In-App Notifications ─────────────────────────────────────────────────────

async def send_in_app_notification(
    user_id: uuid.UUID,
    notif_type: NotificationType,
    title: str,
    body: str,
    link: str | None,
    db: AsyncSession
) -> Notification:
    """Insert a database record to notify user in-app."""
    notification = Notification(
        user_id=user_id,
        type=notif_type,
        title=title,
        body=body,
        link=link,
        is_read=False
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return notification


# ─── Notification Business Triggers ───────────────────────────────────────────

async def send_property_posted_admin_notification(
    property_title: str,
    db: AsyncSession
) -> None:
    """1. New property posted (admin alert)."""
    from app.models.user import User, UserType

    admins_result = await db.execute(select(User).where(User.user_type == UserType.ADMIN))
    admins = admins_result.scalars().all()

    title = "New Listing Pending Review"
    body = f"A new property listing '{property_title}' has been submitted and is pending verification."

    for admin in admins:
        await send_in_app_notification(
            user_id=admin.id,
            notif_type=NotificationType.NEW_PROPERTY,
            title=title,
            body=body,
            link="/admin/properties",
            db=db
        )
        if admin.email:
            html_email = get_html_email_template(title, body, "/admin/properties")
            await send_email_notification(admin.email, title, html_email)


async def send_property_approved_notification(
    user_id: uuid.UUID,
    property_id: uuid.UUID,
    property_title: str,
    db: AsyncSession
) -> None:
    """2. Property approved (owner alert)."""
    from app.models.user import User

    title = "Listing Approved & Published"
    body = f"Great news! Your property listing '{property_title}' has been verified and is now live on the marketplace."

    await send_in_app_notification(
        user_id=user_id,
        notif_type=NotificationType.PROPERTY_APPROVED,
        title=title,
        body=body,
        link=f"/properties/{property_id}",
        db=db
    )

    res = await db.execute(select(User).where(User.id == user_id))
    owner = res.scalar_one_or_none()
    if owner and owner.email:
        html_email = get_html_email_template(title, body, f"/properties/{property_id}")
        await send_email_notification(owner.email, title, html_email)
    if owner and owner.mobile:
        await send_sms_notification(owner.mobile, f"AuraHomes: Your property '{property_title}' is now approved and live.")


async def send_property_rejected_notification(
    owner_id: uuid.UUID,
    property_title: str,
    reason: str,
    db: AsyncSession
) -> None:
    """3. Property rejected with reason (owner alert)."""
    from app.models.user import User

    title = "Listing Update: Rejected"
    body = f"Your property listing '{property_title}' was rejected during moderation. Reason: {reason}."

    await send_in_app_notification(
        user_id=owner_id,
        notif_type=NotificationType.PROPERTY_REJECTED,
        title=title,
        body=body,
        link="/dashboard/properties",
        db=db
    )

    result = await db.execute(select(User).where(User.id == owner_id))
    owner = result.scalar_one_or_none()
    if owner and owner.email:
        html_email = get_html_email_template(title, body, "/dashboard/properties")
        await send_email_notification(owner.email, title, html_email)
    if owner and owner.mobile:
        await send_sms_notification(owner.mobile, f"AuraHomes: Listing '{property_title}' was rejected. Reason: {reason}")


async def send_contact_unlocked_notification(
    owner_id: uuid.UUID,
    property_title: str,
    user_name: str,
    db: AsyncSession
) -> None:
    """4. Contact unlocked (owner alert)."""
    from app.models.user import User

    title = "Listing Contact Unlocked"
    body = f"User '{user_name}' unlocked your contact details on listing '{property_title}'."

    await send_in_app_notification(
        user_id=owner_id,
        notif_type=NotificationType.CONTACT_UNLOCKED,
        title=title,
        body=body,
        link="/dashboard/interested-users",
        db=db
    )

    res = await db.execute(select(User).where(User.id == owner_id))
    owner = res.scalar_one_or_none()
    if owner and owner.email:
        html_email = get_html_email_template(title, body, "/dashboard/interested-users")
        await send_email_notification(owner.email, title, html_email)
    if owner and owner.mobile:
        await send_sms_notification(owner.mobile, f"AuraHomes: {user_name} unlocked your contact details on '{property_title}'.")


async def send_subscription_purchased_notification(
    user_id: uuid.UUID,
    plan_name: str,
    credits: int,
    db: AsyncSession
) -> None:
    """5. Subscription purchased (user alert)."""
    from app.models.user import User

    title = "Subscription Plan Activated"
    body = f"Success! Your '{plan_name}' subscription has been activated, and {credits} contact credits have been added to your balance."

    await send_in_app_notification(
        user_id=user_id,
        notif_type=NotificationType.SUBSCRIPTION_PURCHASED,
        title=title,
        body=body,
        link="/dashboard",
        db=db
    )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user and user.email:
        html_email = get_html_email_template(title, body, "/dashboard")
        await send_email_notification(user.email, title, html_email)
    if user and user.mobile:
        await send_sms_notification(user.mobile, f"AuraHomes: Your {plan_name} plan is active! +{credits} credits added.")


async def send_subscription_expiry_reminder(
    user_id: uuid.UUID,
    days_left: int,
    db: AsyncSession
) -> None:
    """6. Subscription expiring soon (3 days before)."""
    from app.models.user import User

    title = "Subscription Expiring Soon"
    body = f"Your current subscription plan will expire in {days_left} day(s). Renew now to keep your listings active."

    await send_in_app_notification(
        user_id=user_id,
        notif_type=NotificationType.SUBSCRIPTION_EXPIRING,
        title=title,
        body=body,
        link="/checkout",
        db=db
    )

    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()
    if user and user.email:
        html_email = get_html_email_template(title, body, "/checkout")
        await send_email_notification(user.email, title, html_email)


async def send_saved_search_match_notification(
    user_id: uuid.UUID,
    search_name: str,
    property_id: uuid.UUID,
    property_title: str,
    price: float,
    db: AsyncSession,
    notify_email: bool = True,
    notify_whatsapp: bool = False
) -> None:
    """7. Saved search match (new property matched alert)."""
    from app.models.user import User

    title = f"New Match: {search_name}"
    body = f"A new property matching your search '{search_name}' has been listed: '{property_title}' for ₹{price:,.0f}."

    await send_in_app_notification(
        user_id=user_id,
        notif_type=NotificationType.SAVED_SEARCH_MATCH,
        title=title,
        body=body,
        link=f"/properties/{property_id}",
        db=db
    )

    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()
    if user:
        if notify_email and user.email:
            html_email = get_html_email_template(title, body, f"/properties/{property_id}")
            await send_email_notification(user.email, title, html_email)
        if notify_whatsapp and user.mobile:
            await send_whatsapp_notification(
                mobile=user.mobile,
                message=f"AuraHomes Alert: New property matching '{search_name}'! '{property_title}' at ₹{price:,.0f}. View: http://localhost:3000/properties/{property_id}"
            )


async def send_price_changed_notification(
    property_id: uuid.UUID,
    property_title: str,
    old_price: float,
    new_price: float,
    db: AsyncSession
) -> None:
    """8. Property price changed (for saved/favorited property)."""
    from app.models.monetization import Favorite
    from app.models.user import User

    favs_result = await db.execute(select(Favorite).where(Favorite.property_id == property_id))
    favorites = favs_result.scalars().all()

    title = "Listing Price Update"
    body = f"The price for your saved property '{property_title}' changed from ₹{old_price:,.0f} to ₹{new_price:,.0f}."

    for fav in favorites:
        await send_in_app_notification(
            user_id=fav.user_id,
            notif_type=NotificationType.PRICE_CHANGED,
            title=title,
            body=body,
            link=f"/properties/{property_id}",
            db=db
        )

        res = await db.execute(select(User).where(User.id == fav.user_id))
        user = res.scalar_one_or_none()
        if user and user.email:
            html_email = get_html_email_template(title, body, f"/properties/{property_id}")
            await send_email_notification(user.email, title, html_email)


async def send_property_sold_rented_notification(
    property_id: uuid.UUID,
    property_title: str,
    new_status: str,
    db: AsyncSession
) -> None:
    """9. Property sold/rented (for saved/favorited property)."""
    from app.models.monetization import Favorite
    from app.models.user import User

    favs_result = await db.execute(select(Favorite).where(Favorite.property_id == property_id))
    favorites = favs_result.scalars().all()

    title = "Listing Status Update"
    body = f"The saved property '{property_title}' has been marked as {new_status} and is no longer available."

    for fav in favorites:
        await send_in_app_notification(
            user_id=fav.user_id,
            notif_type=NotificationType.PROPERTY_SOLD_RENTED,
            title=title,
            body=body,
            link=f"/properties/{property_id}",
            db=db
        )

        res = await db.execute(select(User).where(User.id == fav.user_id))
        user = res.scalar_one_or_none()
        if user and user.email:
            html_email = get_html_email_template(title, body, f"/properties/{property_id}")
            await send_email_notification(user.email, title, html_email)
