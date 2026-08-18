import asyncio
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.monetization import Subscription, SubscriptionStatus
from app.services.notification_service import send_subscription_expiry_reminder

logger = logging.getLogger(__name__)


async def check_subscription_expiries(db):
    """Query subscriptions expiring in the next 3 days and log alerts."""
    now = datetime.now(timezone.utc)
    warning_threshold = now + timedelta(days=3)

    result = await db.execute(
        select(Subscription).where(
            Subscription.status == SubscriptionStatus.ACTIVE,
            Subscription.expires_at <= warning_threshold,
            Subscription.expires_at >= now
        )
    )
    subscriptions = result.scalars().all()

    for sub in subscriptions:
        days_left = max(0, (sub.expires_at - now).days)
        # Notify user via service
        await send_subscription_expiry_reminder(
            user_id=sub.user_id,
            days_left=days_left,
            db=db
        )
        logger.info(f"Notified user {sub.user_id} of subscription expiry in {days_left} days.")


async def start_expiry_scheduler(interval_seconds: int = 86400):
    """Background task loop checking for upcoming expiries."""
    logger.info("Subscription expiry check background task started.")
    while True:
        try:
            async with AsyncSessionLocal() as db:
                await check_subscription_expiries(db)
        except Exception as e:
            logger.error(f"Error checking subscription expiries in scheduler: {e}")
        await asyncio.sleep(interval_seconds)
