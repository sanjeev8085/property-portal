"""
Property ORM Models — Property, PropertyImage, PropertyAmenity,
PropertyView, PropertyVerification, PropertyReport
"""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float, ForeignKey,
    Integer, String, Text, ARRAY
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


class PropertyStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    PUBLISHED = "published"
    REJECTED = "rejected"
    RENTED = "rented"
    SOLD = "sold"
    EXPIRED = "expired"
    INACTIVE = "inactive"


class PropertyPurpose(str, enum.Enum):
    SELL = "sell"
    RENT = "rent"


class FurnishedStatus(str, enum.Enum):
    FURNISHED = "furnished"
    SEMI_FURNISHED = "semi_furnished"
    UNFURNISHED = "unfurnished"


class PropertyCategory(str, enum.Enum):
    RESIDENTIAL = "residential"
    COMMERCIAL = "commercial"
    PG = "pg"
    PLOT = "plot"
    OTHER = "other"


class Property(Base):
    __tablename__ = "properties"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=True)

    # Core fields
    title = Column(String(300), nullable=False)
    slug = Column(String(400), nullable=True, index=True)
    description = Column(Text, nullable=True)
    purpose = Column(Enum(PropertyPurpose), nullable=False)
    category = Column(Enum(PropertyCategory), nullable=False, default=PropertyCategory.RESIDENTIAL)
    property_type = Column(String(100), nullable=False)  # Apartment, Villa, Plot, etc.

    # Property specs
    bhk = Column(Integer, nullable=True)
    area_sqft = Column(Float, nullable=True)
    bathrooms = Column(Integer, nullable=True)
    balcony = Column(Integer, nullable=True)
    floor = Column(Integer, nullable=True)
    total_floors = Column(Integer, nullable=True)
    furnished_status = Column(Enum(FurnishedStatus), nullable=True)
    pg_for = Column(String(50), nullable=True)
    room_type = Column(String(100), nullable=True)
    food_status = Column(String(100), nullable=True)
    parking = Column(Integer, nullable=True)
    property_age = Column(Integer, nullable=True)  # Years
    preferred_tenant = Column(String(100), nullable=True)
    availability_date = Column(DateTime(timezone=True), nullable=True)

    # Pricing
    price = Column(Float, nullable=False)
    maintenance = Column(Float, nullable=True)
    security_deposit = Column(Float, nullable=True)
    is_negotiable = Column(Boolean, default=False)

    # Contact (stored encrypted/masked in API responses)
    contact_name = Column(String(150), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    contact_whatsapp = Column(String(20), nullable=True)
    contact_email = Column(String(255), nullable=True)

    # Status
    status = Column(Enum(PropertyStatus), nullable=False, default=PropertyStatus.DRAFT, index=True)
    rejection_reason = Column(Text, nullable=True)

    # Featured
    is_featured = Column(Boolean, default=False, index=True)
    featured_until = Column(DateTime(timezone=True), nullable=True)

    # Verification
    is_verified = Column(Boolean, default=False)

    # Duplicate detection hash
    fingerprint_hash = Column(String(64), nullable=True, index=True)

    # Stats (denormalized for performance)
    views_count = Column(Integer, default=0)
    contacts_count = Column(Integer, default=0)
    favorites_count = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    published_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    owner = relationship("User", back_populates="properties")
    location = relationship("Location", back_populates="properties")
    images = relationship("PropertyImage", back_populates="property", cascade="all, delete-orphan", order_by="PropertyImage.sort_order")
    amenities = relationship("PropertyAmenity", back_populates="property", cascade="all, delete-orphan")
    views = relationship("PropertyView", back_populates="property", cascade="all, delete-orphan")
    verifications = relationship("PropertyVerification", back_populates="property", cascade="all, delete-orphan")
    reports = relationship("PropertyReport", back_populates="property", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="property", cascade="all, delete-orphan")
    contact_unlocks = relationship("ContactUnlock", back_populates="property")

    def __repr__(self):
        return f"<Property id={self.id} title={self.title!r}>"


class PropertyImage(Base):
    __tablename__ = "property_images"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(String(1000), nullable=False)           # Original / Cloudinary secure_url
    thumbnail_url = Column(String(1000), nullable=True)        # ~300px optimized
    card_url = Column(String(1000), nullable=True)             # ~600px optimized
    detail_url = Column(String(1000), nullable=True)           # ~1200px optimized
    cloudinary_public_id = Column(String(500), nullable=True, index=True)  # For deletion
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    file_size = Column(Integer, nullable=True)                 # Original bytes
    is_cover = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    property = relationship("Property", back_populates="images")


class PropertyAmenity(Base):
    __tablename__ = "property_amenities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    amenity = Column(String(100), nullable=False)  # lift, gym, pool, cctv, parking, etc.

    property = relationship("Property", back_populates="amenities")


class PropertyView(Base):
    __tablename__ = "property_views"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(500), nullable=True)
    viewed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    property = relationship("Property", back_populates="views")


class PropertyVerification(Base):
    __tablename__ = "property_verifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    verified_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # Admin user
    verification_type = Column(String(100), nullable=False)  # mobile, document, agent, admin
    verified_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    notes = Column(Text, nullable=True)

    property = relationship("Property", back_populates="verifications")


class ReportReason(str, enum.Enum):
    FAKE = "fake_property"
    WRONG_INFO = "wrong_information"
    ALREADY_SOLD = "already_sold_rented"
    FRAUD = "fraud"
    INCORRECT_PRICE = "incorrect_price"
    DUPLICATE = "duplicate_listing"
    INAPPROPRIATE = "inappropriate_content"
    OTHER = "other"


class ReportStatus(str, enum.Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class PropertyReport(Base):
    __tablename__ = "property_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    reporter_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reason = Column(Enum(ReportReason), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(ReportStatus), nullable=False, default=ReportStatus.PENDING)
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    property = relationship("Property", back_populates="reports")
    reporter = relationship("User", back_populates="property_reports")


class DeactivatedProperty(Base):
    __tablename__ = "deactivated_properties"

    id = Column(String(500), primary_key=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

