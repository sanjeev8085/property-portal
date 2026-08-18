"""
Database seed script — populates development data.
Run: python scripts/seed.py
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.core.config import settings
from app.core.database import Base
from app.core.security import hash_password
from app.models.user import User, UserType, UserStatus
from app.models.monetization import SubscriptionPlan, ContactCredit
from app.models.location import Location


async def seed():
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        # ── Subscription Plans ────────────────────────────────────────────
        plans = [
            SubscriptionPlan(name="Basic", price=99, contact_limit=5, validity_days=30, is_active=True, sort_order=1),
            SubscriptionPlan(name="Standard", price=199, contact_limit=15, validity_days=30, is_active=True, sort_order=2, is_featured=True),
            SubscriptionPlan(name="Premium", price=399, contact_limit=50, validity_days=60, is_active=True, sort_order=3),
        ]
        session.add_all(plans)

        # ── Sample Locations ──────────────────────────────────────────────
        locations = [
            Location(city="Bhopal", area="Arera Colony", locality="E-5", lat=23.2332, lng=77.4344),
            Location(city="Bhopal", area="Kolar Road", locality="Sector A", lat=23.1873, lng=77.4712),
            Location(city="Bhopal", area="MP Nagar", locality="Zone 1", lat=23.2315, lng=77.4186),
            Location(city="Indore", area="Vijay Nagar", locality="AB Road", lat=22.7533, lng=75.8937),
        ]
        session.add_all(locations)

        # ── Sample Users ──────────────────────────────────────────────────
        admin = User(
            name="Admin User",
            email="admin@propertyportal.com",
            password_hash=hash_password("admin@123"),
            user_type=UserType.AGENT,
            status=UserStatus.ACTIVE,
            is_mobile_verified=True,
            is_email_verified=True,
            city="Bhopal",
        )
        owner = User(
            name="Rahul Sharma",
            email="rahul@test.com",
            mobile="9876543210",
            password_hash=hash_password("owner@123"),
            user_type=UserType.OWNER,
            status=UserStatus.ACTIVE,
            is_mobile_verified=True,
            city="Bhopal",
        )
        buyer = User(
            name="Priya Singh",
            email="priya@test.com",
            mobile="9876543220",
            password_hash=hash_password("buyer@123"),
            user_type=UserType.BUYER,
            status=UserStatus.ACTIVE,
            is_mobile_verified=True,
            city="Bhopal",
        )
        session.add_all([admin, owner, buyer])
        await session.flush()

        # ── Credits for buyer ─────────────────────────────────────────────
        buyer_credits = ContactCredit(user_id=buyer.id, total_credits=5, used_credits=0)
        session.add(buyer_credits)

        await session.commit()
        print("[SUCCESS] Seed data inserted successfully!")
        print(f"   Admin: admin@propertyportal.com / admin@123")
        print(f"   Owner: rahul@test.com / owner@123")
        print(f"   Buyer: priya@test.com / buyer@123")


if __name__ == "__main__":
    asyncio.run(seed())
