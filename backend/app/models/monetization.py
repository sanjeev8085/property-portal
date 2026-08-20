"""
Monetization ORM Models — SubscriptionPlan, Subscription,
ContactCredit, ContactUnlock, Payment, Favorite, SavedSearch
"""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float, ForeignKey,
    Integer, String, Text, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


# ─── Subscription ─────────────────────────────────────────────────────────────

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    contact_limit = Column(Integer, nullable=False)  # Number of contact credits included
    validity_days = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)  # Highlight this plan on UI
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    subscriptions = relationship("Subscription", back_populates="plan")
    payments = relationship("Payment", back_populates="plan")


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("subscription_plans.id"), nullable=False)
    starts_at = Column(DateTime(timezone=True), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    status = Column(Enum(SubscriptionStatus), nullable=False, default=SubscriptionStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User")
    plan = relationship("SubscriptionPlan", back_populates="subscriptions")


# ─── Contact Credits ──────────────────────────────────────────────────────────

class ContactCredit(Base):
    __tablename__ = "contact_credits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    total_credits = Column(Integer, default=0, nullable=False)
    used_credits = Column(Integer, default=0, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="contact_credits")

    @property
    def available_credits(self) -> int:
        return self.total_credits - self.used_credits


from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float, ForeignKey,
    Integer, String, Text, JSON, UniqueConstraint
)

class ContactUnlock(Base):
    __tablename__ = "contact_unlocks"
    __table_args__ = (
        UniqueConstraint("user_id", "property_id", name="uq_contact_unlock_user_property"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    credit_used = Column(Integer, default=1)
    unlocked_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="contact_unlocks", foreign_keys=[user_id])
    property = relationship("Property", back_populates="contact_unlocks")
    owner = relationship("User", foreign_keys=[owner_id])


# ─── Payments ─────────────────────────────────────────────────────────────────

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCESSFUL = "successful"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class PaymentGateway(str, enum.Enum):
    RAZORPAY = "razorpay"
    MANUAL = "manual"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("subscription_plans.id"), nullable=True)
    transaction_id = Column(String(200), unique=True, nullable=True)
    gateway_order_id = Column(String(200), nullable=True)  # Razorpay order_id
    gateway_payment_id = Column(String(200), nullable=True)  # Razorpay payment_id
    gateway_signature = Column(String(500), nullable=True)  # Razorpay signature
    amount = Column(Float, nullable=False)
    tax = Column(Float, default=0)
    currency = Column(String(10), default="INR")
    gateway = Column(Enum(PaymentGateway), nullable=False, default=PaymentGateway.RAZORPAY)
    status = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="payments")
    plan = relationship("SubscriptionPlan", back_populates="payments")


# ─── Favorites ────────────────────────────────────────────────────────────────

class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="favorites")
    property = relationship("Property", back_populates="favorites")


# ─── Saved Searches ───────────────────────────────────────────────────────────

class SavedSearch(Base):
    __tablename__ = "saved_searches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=True)
    filters = Column(JSON, nullable=False, default=dict)  # Stored as JSON (JSONB on Postgres)
    notify_email = Column(Boolean, default=True)
    notify_whatsapp = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="saved_searches")
