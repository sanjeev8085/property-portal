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
from app.models.notification import Notification, NotificationType
from app.models.audit import AuditLog

__all__ = [
    "User", "Agent",
    "Location",
    "Property", "PropertyImage", "PropertyAmenity",
    "PropertyView", "PropertyVerification", "PropertyReport",
    "DeactivatedProperty",
    "PropertyStatus", "PropertyPurpose", "FurnishedStatus",
    "PropertyCategory", "ReportReason", "ReportStatus",
    "SubscriptionPlan", "Subscription", "ContactCredit",
    "ContactUnlock", "Payment", "Favorite", "SavedSearch",
    "PaymentStatus", "PaymentGateway", "SubscriptionStatus",
    "Notification", "NotificationType", "AuditLog",
]
