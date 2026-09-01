"""
AuraHomes - Create Admin User Script
=====================================
Creates an admin user directly in the PostgreSQL database.

Usage:
  cd backend
  python scripts/create_admin.py
"""

import asyncio
import sys
import os
import getpass
import uuid
from datetime import datetime, timezone
from pathlib import Path

# Load .env from project root
ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = ROOT / ".env"

def load_env(env_path):
    if not env_path.exists():
        return
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = val

load_env(ENV_FILE)

DATABASE_URL = os.environ.get("DATABASE_URL", "")

if not DATABASE_URL or "your-project-id" in DATABASE_URL or "your-password" in DATABASE_URL:
    print()
    print("=" * 60)
    print("  WARNING: DATABASE_URL not configured in .env")
    print("=" * 60)
    print()
    print("Format: postgresql+asyncpg://user:password@host:port/dbname")
    print()
    DATABASE_URL = input("  DATABASE_URL: ").strip()
    if not DATABASE_URL:
        print("[X] No DATABASE_URL provided. Exiting.")
        sys.exit(1)

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

print()
print("=" * 60)
print("  AuraHomes - Create Admin User")
print("=" * 60)
print()

name = input("  Admin Name       : ").strip()
if not name:
    print("[X] Name is required.")
    sys.exit(1)

email = input("  Admin Email      : ").strip().lower()
if not email or "@" not in email:
    print("[X] Valid email is required.")
    sys.exit(1)

mobile = input("  Mobile (optional): ").strip() or None

while True:
    password = getpass.getpass("  Password         : ")
    confirm  = getpass.getpass("  Confirm Password : ")
    if password != confirm:
        print("  [!] Passwords do not match. Try again.")
    elif len(password) < 8:
        print("  [!] Password must be at least 8 characters.")
    else:
        break

print()
print(f"  Creating admin: {name} <{email}>...")

try:
    import bcrypt
except ImportError:
    print("[X] bcrypt not installed. Run: pip install bcrypt")
    sys.exit(1)

def hash_password(pwd):
    return bcrypt.hashpw(pwd.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

password_hash = hash_password(password)

try:
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import text
except ImportError:
    print("[X] sqlalchemy not installed. Run: pip install sqlalchemy asyncpg")
    sys.exit(1)

async def create_admin():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        result = await session.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": email}
        )
        existing = result.fetchone()

        if existing:
            print(f"\n  [!] User '{email}' already exists.")
            update = input("      Upgrade to admin and reset password? (y/N): ").strip().lower()
            if update == "y":
                await session.execute(
                    text("""
                        UPDATE users
                        SET user_type = 'admin', status = 'active',
                            password_hash = :ph, is_email_verified = true,
                            updated_at = NOW()
                        WHERE email = :email
                    """),
                    {"ph": password_hash, "email": email}
                )
                await session.commit()
                print("\n  [OK] User upgraded to Admin!")
            else:
                print("  [!] No changes made.")
            return

        user_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        await session.execute(
            text("""
                INSERT INTO users (
                    id, name, email, mobile, password_hash,
                    user_type, status, is_email_verified, is_mobile_verified,
                    created_at, updated_at
                ) VALUES (
                    :id, :name, :email, :mobile, :ph,
                    'admin', 'active', true, :mv,
                    :ca, :ua
                )
            """),
            {
                "id": user_id, "name": name, "email": email, "mobile": mobile,
                "ph": password_hash, "mv": mobile is not None,
                "ca": now, "ua": now,
            }
        )
        await session.commit()

        print()
        print("  [OK] Admin user created successfully!")
        print()
        print(f"  ID     : {user_id}")
        print(f"  Name   : {name}")
        print(f"  Email  : {email}")
        print(f"  Mobile : {mobile or '(not set)'}")
        print(f"  Role   : admin")
        print(f"  Status : active")
        print()
        print("  Login at: https://property-portal-rncp.vercel.app/admin/login")
        print()

    await engine.dispose()

asyncio.run(create_admin())
