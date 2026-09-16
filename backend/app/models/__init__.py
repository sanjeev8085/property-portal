"""Models package — imports all models so Alembic can discover them."""
from app.models.user import User, Agent
from app.models.location import Location
from app.models.property import (
    Property, PropertyImage, PropertyAmenity,
    PropertyView, PropertyVerification, PropertyReport,
    DeactivatedProperty,
    PropertyStatus, PropertyPurpose, FurnishedStatus,
    PropertyCategory, ReportReason, ReportStatus
)
from app.models.monetization import (
    SubscriptionPlan, Subscription, ContactCredit,
    ContactUnlock, Payment, Favorite, SavedSearch,
    PaymentStatus, PaymentGateway, SubscriptionStatus
)
from app.models.notification import Notification, NotificationType, BroadcastNotification
from app.models.category import Category
from app.models.audit import AuditLog

__all__ = [
    "User", "Agent",
    "Location", "Category",
    "Property", "PropertyImage", "PropertyAmenity",
    "PropertyView", "PropertyVerification", "PropertyReport",
    "DeactivatedProperty",
    "PropertyStatus", "PropertyPurpose", "FurnishedStatus",
    "PropertyCategory", "ReportReason", "ReportStatus",
    "SubscriptionPlan", "Subscription", "ContactCredit",
    "ContactUnlock", "Payment", "Favorite", "SavedSearch",
    "PaymentStatus", "PaymentGateway", "SubscriptionStatus",
    "Notification", "NotificationType", "BroadcastNotification", "AuditLog",
]
