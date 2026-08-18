"""Notification ORM Model."""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class NotificationType(str, enum.Enum):
    NEW_PROPERTY = "new_property"
    PROPERTY_APPROVED = "property_approved"
    PROPERTY_REJECTED = "property_rejected"
    CONTACT_UNLOCKED = "contact_unlocked"
    SUBSCRIPTION_PURCHASED = "subscription_purchased"
    SUBSCRIPTION_EXPIRING = "subscription_expiring"
    SAVED_SEARCH_MATCH = "saved_search_match"
    PRICE_CHANGED = "price_changed"
    PROPERTY_SOLD_RENTED = "property_sold_rented"
    ADMIN_ANNOUNCEMENT = "admin_announcement"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(300), nullable=False)
    body = Column(Text, nullable=False)
    link = Column(String(500), nullable=True)  # Deeplink (e.g., /properties/123)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User", back_populates="notifications")
