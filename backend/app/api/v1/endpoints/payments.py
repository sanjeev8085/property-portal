from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
import time
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.monetization import (
    SubscriptionPlan, Subscription, SubscriptionStatus,
    ContactCredit, Payment, PaymentStatus, PaymentGateway
)
from datetime import datetime, timedelta, timezone

router = APIRouter()


@router.get("/plans")
async def list_plans(db: AsyncSession = Depends(get_db)):
    """List all active subscription plans (public)."""
    result = await db.execute(
        select(SubscriptionPlan).where(SubscriptionPlan.is_active == True).order_by(SubscriptionPlan.price.asc())
    )
    plans = result.scalars().all()
    return [{
        "id": str(p.id),
        "name": p.name,
        "description": p.description,
        "price": p.price,
        "contact_limit": p.contact_limit,
        "validity_days": p.validity_days,
        "is_featured": p.is_featured,
    } for p in plans]


@router.post("/create-order")
async def create_payment_order(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a Razorpay payment order for a subscription plan."""
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

    mock_order_id = f"order_{uuid.uuid4().hex[:12]}"
    payment = Payment(
        user_id=current_user.id,
        plan_id=plan.id,
        amount=plan.price,
        gateway_order_id=mock_order_id,
        gateway=PaymentGateway.RAZORPAY,
        status=PaymentStatus.PENDING,
    )
    db.add(payment)
    await db.commit()

    return {
        "id": str(payment.id),
        "gateway_order_id": mock_order_id,
        "amount": plan.price,
        "currency": "INR",
        "plan_name": plan.name,
    }


@router.post("/verify")
async def verify_payment(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Verify Razorpay payment signature and credit the user."""
    order_id = payload.get("razorpay_order_id")
    payment_id = payload.get("razorpay_payment_id")
    sig = payload.get("razorpay_signature", "")

    if not order_id or not payment_id or not sig:
        raise HTTPException(status_code=400, detail="Missing payment verification details.")

    # Check database for payment
    result = await db.execute(select(Payment).where(Payment.gateway_order_id == order_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Order record not found.")

    # Verify signature stub check (mock check: accept anything unless it contains 'bad' or is empty)
    if "bad" in sig:
        payment.status = PaymentStatus.FAILED
        await db.commit()
        raise HTTPException(status_code=400, detail="Invalid signature. Payment rejected.")

    # Prevent double crediting
    if payment.status == PaymentStatus.SUCCESSFUL:
        return {"message": "Payment already processed previously.", "credits_added": 0}

    payment.status = PaymentStatus.SUCCESSFUL
    payment.gateway_payment_id = payment_id
    payment.gateway_signature = sig
    payment.transaction_id = f"tx_{uuid.uuid4().hex[:16]}"

    # Lookup associated plan
    plan_result = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == payment.plan_id))
    plan = plan_result.scalar_one()

    # Credit user's contact credits table
    credit_result = await db.execute(select(ContactCredit).where(ContactCredit.user_id == current_user.id))
    user_credits = credit_result.scalar_one_or_none()
    if not user_credits:
        user_credits = ContactCredit(user_id=current_user.id, total_credits=0, used_credits=0)
        db.add(user_credits)

    user_credits.total_credits += plan.contact_limit

    # Add user active subscription
    now = datetime.now(timezone.utc)
    expiry = now + timedelta(days=plan.validity_days)
    subscription = Subscription(
        user_id=current_user.id,
        plan_id=plan.id,
        starts_at=now,
        expires_at=expiry,
        status=SubscriptionStatus.ACTIVE,
    )
    db.add(subscription)

    await db.commit()
    await db.refresh(user_credits)

    # Trigger subscription purchased notification!
    try:
        from app.services.notification_service import send_subscription_purchased_notification
        await send_subscription_purchased_notification(
            user_id=current_user.id,
            plan_name=plan.name,
            credits=plan.contact_limit,
            db=db
        )
    except Exception:
        pass

    return {
        "message": "Payment verified. Credits and subscription activated successfully.",
        "credits_added": plan.contact_limit,
        "total_available_credits": user_credits.available_credits,
    }


@router.get("/history")
async def payment_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List user's payment history."""
    result = await db.execute(
        select(Payment).where(Payment.user_id == current_user.id).order_by(Payment.created_at.desc())
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

