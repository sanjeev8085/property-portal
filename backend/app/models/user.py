"""
Users ORM Model — covers User, UserType, UserStatus
"""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, ForeignKey, Integer,
    String, Text, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class UserType(str, enum.Enum):
    OWNER = "owner"
    AGENT = "agent"
    BUYER = "buyer"
    ADMIN = "admin"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    BLOCKED = "blocked"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, nullable=True, index=True)
    mobile = Column(String(20), unique=True, nullable=True, index=True)
    password_hash = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    user_type = Column(Enum(UserType), nullable=False, default=UserType.BUYER)
    status = Column(Enum(UserStatus), nullable=False, default=UserStatus.ACTIVE)
    is_mobile_verified = Column(Boolean, default=False)
    is_email_verified = Column(Boolean, default=False)
    google_id = Column(String(255), unique=True, nullable=True)
    profile_image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    properties = relationship("Property", back_populates="owner", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    contact_unlocks = relationship("ContactUnlock", back_populates="user", foreign_keys="ContactUnlock.user_id")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="user", cascade="all, delete-orphan")
    agent_profile = relationship("Agent", back_populates="user", uselist=False, cascade="all, delete-orphan")
    contact_credits = relationship("ContactCredit", back_populates="user", uselist=False, cascade="all, delete-orphan")
    saved_searches = relationship("SavedSearch", back_populates="user", cascade="all, delete-orphan")
    property_reports = relationship("PropertyReport", back_populates="reporter", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User id={self.id} email={self.email}>"


class Agent(Base):
    __tablename__ = "agents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    agency_name = Column(String(200), nullable=True)
    bio = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    rera_number = Column(String(100), nullable=True)
    experience_years = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="agent_profile")
