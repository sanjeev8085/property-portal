"""
Payments — Razorpay integration with real order creation, HMAC verification,
server-to-server webhook processing, and idempotent credit delivery.
"""
import logging
import uuid
import hmac as _hmac
import hashlib

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone

from app.core.database import get_db
from app.core.config import settings
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.monetization import (
    SubscriptionPlan, Subscription, SubscriptionStatus,
    ContactCredit, Payment, PaymentStatus, PaymentGateway
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Internal helpers ─────────────────────────────────────────────────────────

def _get_razorpay_client():
    """Return authenticated Razorpay client, or None in demo mode."""
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        return None
    try:
        import razorpay
        return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    except ImportError:
        logger.warning("[Razorpay] razorpay package not installed — running in demo mode.")
        return None


def _verify_razorpay_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """Verify Razorpay HMAC SHA256 client payment signature."""
    if not settings.RAZORPAY_KEY_SECRET:
        return True  # Demo mode — skip
    msg = f"{order_id}|{payment_id}".encode("utf-8")
    expected = _hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode("utf-8"), msg, hashlib.sha256
    ).hexdigest()
    return _hmac.compare_digest(expected, signature)


def _verify_webhook_signature(body: bytes, signature: str) -> bool:
    """Verify Razorpay webhook HMAC SHA256 signature (uses RAZORPAY_WEBHOOK_SECRET)."""
    webhook_secret = getattr(settings, "RAZORPAY_WEBHOOK_SECRET", "") or settings.RAZORPAY_KEY_SECRET
    if not webhook_secret:
        return True  # Demo mode
    expected = _hmac.new(
        webhook_secret.encode("utf-8"), body, hashlib.sha256
    ).hexdigest()
    return _hmac.compare_digest(expected, signature)


# ─── Public: List subscription plans from DB ──────────────────────────────────
@router.get("/plans")
async def list_plans(db: AsyncSession = Depends(get_db)):
    """Return all active subscription plans ordered by sort_order."""
    result = await db.execute(
        select(SubscriptionPlan)
        .where(SubscriptionPlan.is_active == True)
        .order_by(SubscriptionPlan.sort_order)
    )
    plans = result.scalars().all()
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "price": p.price,
            "contact_limit": p.contact_limit,
            "validity_days": p.validity_days,
            "description": p.description,
            "is_featured": p.is_featured,
            "sort_order": p.sort_order,
        }
        for p in plans
    ]


async def _credit_user_for_payment(payment: Payment, db: AsyncSession) -> dict:
    """
    Deliver contact credits and subscription after a verified payment.
    Caller is responsible for the idempotency guard (check payment.status first).
    """
    plan_result = await db.execute(
        select(SubscriptionPlan).where(SubscriptionPlan.id == payment.plan_id)
    )
    plan = plan_result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=500, detail="Subscription plan not found for this payment.")

    credit_result = await db.execute(
        select(ContactCredit).where(ContactCredit.user_id == payment.user_id)
    )
    user_credits = credit_result.scalar_one_or_none()
    if not user_credits:
        user_credits = ContactCredit(user_id=payment.user_id, total_credits=0, used_credits=0)
        db.add(user_credits)

    user_credits.total_credits += plan.contact_limit

    now = datetime.now(timezone.utc)
    subscription = Subscription(
        user_id=payment.user_id,
        plan_id=plan.id,
        starts_at=now,
        expires_at=now + timedelta(days=plan.validity_days),
        status=SubscriptionStatus.ACTIVE,
    )
    db.add(subscription)
    await db.commit()
    await db.refresh(user_credits)

    try:
        from app.services.notification_service import send_subscription_purchased_notification
        await send_subscription_purchased_notification(
            user_id=payment.user_id, plan_name=plan.name, credits=plan.contact_limit, db=db,
        )
    except Exception:
        pass

    return {
        "credits_added": plan.contact_limit,
        "total_available_credits": user_credits.available_credits,
    }


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("/plans")
async def list_plans(db: AsyncSession = Depends(get_db)):
    """List all active subscription plans (public)."""
    result = await db.execute(
        select(SubscriptionPlan)
        .where(SubscriptionPlan.is_active == True)
        .order_by(SubscriptionPlan.price.asc())
    )
    plans = result.scalars().all()
    return [
        {
            "id": str(p.id), "name": p.name, "description": p.description,
            "price": p.price, "contact_limit": p.contact_limit,
            "validity_days": p.validity_days, "is_featured": p.is_featured,
        }
        for p in plans
    ]


@router.post("/create-order")
async def create_payment_order(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Create a Razorpay payment order for a subscription plan.
    Uses real Razorpay SDK when RAZORPAY_KEY_ID/KEY_SECRET are set; demo mode otherwise.
    """
    plan_id_str = payload.get("plan_id")
    if not plan_id_str:
        raise HTTPException(status_code=422, detail="plan_id is required.")
    try:
        plan_uuid = uuid.UUID(plan_id_str)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid plan ID format.")

    result = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == plan_uuid))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Subscription plan not found.")

    rzp = _get_razorpay_client()

    if rzp:
        # Real Razorpay order
        try:
            rzp_order = rzp.order.create({
                "amount": int(plan.price * 100),  # Razorpay uses paise (smallest INR unit)
                "currency": "INR",
                "receipt": f"rcpt_{uuid.uuid4().hex[:12]}",
                "notes": {
                    "plan_id": str(plan.id),
                    "plan_name": plan.name,
                    "user_id": str(current_user.id),
                },
            })
            gateway_order_id = rzp_order["id"]
            logger.info(f"[Razorpay] Created order {gateway_order_id} for user {current_user.id}")
        except Exception as exc:
            logger.error(f"[Razorpay] Order creation failed: {exc}")
            raise HTTPException(status_code=502, detail="Payment gateway error. Please try again.")
    else:
        # Demo / development fallback
        gateway_order_id = f"order_demo_{uuid.uuid4().hex[:12]}"
        logger.warning("[Razorpay] Demo mode — set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env for live payments.")

    payment = Payment(
        user_id=current_user.id, plan_id=plan.id, amount=plan.price,
        gateway_order_id=gateway_order_id, gateway=PaymentGateway.RAZORPAY,
        status=PaymentStatus.PENDING,
    )
    db.add(payment)
    await db.commit()

    return {
        "id": str(payment.id),
        "gateway_order_id": gateway_order_id,
        "key_id": settings.RAZORPAY_KEY_ID or "rzp_demo",
        "amount": plan.price,
        "amount_paise": int(plan.price * 100),
        "currency": "INR",
        "plan_name": plan.name,
        "demo_mode": rzp is None,
    }


@router.post("/verify")
async def verify_payment(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Client-side payment verification after Razorpay checkout completes.
    Validates HMAC SHA256 signature, then credits the user.
    The server-to-server /webhook endpoint is the authoritative credit path.
    """
    order_id = payload.get("razorpay_order_id")
    payment_id = payload.get("razorpay_payment_id")
    sig = payload.get("razorpay_signature", "")

    if not order_id or not payment_id or not sig:
        raise HTTPException(status_code=400, detail="Missing payment verification details.")

    result = await db.execute(select(Payment).where(Payment.gateway_order_id == order_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Order record not found.")

    # Idempotency: may already be credited by the webhook
    if payment.status == PaymentStatus.SUCCESSFUL:
        return {"message": "Payment already processed successfully.", "credits_added": 0}

    if not _verify_razorpay_signature(order_id, payment_id, sig):
        payment.status = PaymentStatus.FAILED
        await db.commit()
        raise HTTPException(status_code=400, detail="Payment signature verification failed. Payment rejected.")

    payment.status = PaymentStatus.SUCCESSFUL
    payment.gateway_payment_id = payment_id
    payment.gateway_signature = sig
    payment.transaction_id = f"tx_{uuid.uuid4().hex[:16]}"
    db.add(payment)
    await db.commit()

    credit_summary = await _credit_user_for_payment(payment, db)
    return {"message": "Payment verified. Credits and subscription activated.", **credit_summary}


@router.post("/webhook")
async def razorpay_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Razorpay server-to-server webhook — AUTHORITATIVE payment confirmation.

    This fires even if the user closes their browser before /verify is called.
    Configure in Razorpay Dashboard → Settings → Webhooks:
      URL:    https://your-domain/api/v1/payments/webhook
      Events: payment.captured, payment.failed
      Secret: set as RAZORPAY_WEBHOOK_SECRET in .env
    """
    import json

    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    if not signature:
        raise HTTPException(status_code=400, detail="Missing X-Razorpay-Signature header.")

    if not _verify_webhook_signature(body, signature):
        logger.warning("[Webhook] Invalid signature — rejected from %s", request.client.host if request.client else "unknown")
        raise HTTPException(status_code=400, detail="Invalid webhook signature.")

    try:
        event = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload.")

    event_name = event.get("event", "")
    payment_entity = event.get("payload", {}).get("payment", {}).get("entity", {})
    rzp_order_id = payment_entity.get("order_id")
    rzp_payment_id = payment_entity.get("id")

    logger.info(f"[Webhook] Event: {event_name} | order: {rzp_order_id} | payment: {rzp_payment_id}")

    if not rzp_order_id:
        return {"status": "acknowledged"}  # Non-order events (refunds, disputes)

    result = await db.execute(select(Payment).where(Payment.gateway_order_id == rzp_order_id))
    payment = result.scalar_one_or_none()

    if not payment:
        logger.warning(f"[Webhook] No local record for Razorpay order {rzp_order_id}")
        return {"status": "order_not_found"}

    if event_name == "payment.captured":
        if payment.status == PaymentStatus.SUCCESSFUL:
            logger.info(f"[Webhook] Duplicate event for already-processed order {rzp_order_id} — skipped.")
            return {"status": "already_processed"}

        payment.status = PaymentStatus.SUCCESSFUL
        payment.gateway_payment_id = rzp_payment_id
        payment.transaction_id = f"tx_{uuid.uuid4().hex[:16]}"
        db.add(payment)
        await db.commit()

        credit_summary = await _credit_user_for_payment(payment, db)
        logger.info(
            f"[Webhook] Credits delivered — order {rzp_order_id} "
            f"| user {payment.user_id} | +{credit_summary['credits_added']} credits"
        )
        return {"status": "credited", **credit_summary}

    elif event_name == "payment.failed":
        if payment.status == PaymentStatus.PENDING:
            payment.status = PaymentStatus.FAILED
            db.add(payment)
            await db.commit()
            logger.info(f"[Webhook] Payment failed for order {rzp_order_id}")
        return {"status": "marked_failed"}

    return {"status": "acknowledged", "event": event_name}


@router.get("/history")
async def payment_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List current user's payment history."""
    result = await db.execute(
        select(Payment)
        .where(Payment.user_id == current_user.id)
        .order_by(Payment.created_at.desc())
    )
    payments = result.scalars().all()
    return [{
        "id": str(p.id),
        "amount": p.amount,
        "status": p.status,
        "transaction_id": p.transaction_id,
        "gateway_order_id": p.gateway_order_id,
        "created_at": p.created_at,
    } for p in payments]
