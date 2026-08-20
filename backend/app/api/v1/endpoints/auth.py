"""
Auth endpoints — register, login, Google OAuth, OTP, refresh, logout
"""
import random
import string
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.config import settings
from app.models.user import User, UserType, UserStatus
from app.models.monetization import ContactCredit
from app.schemas.auth import (
    RegisterRequest, LoginRequest, OTPSendRequest, OTPVerifyRequest,
    TokenResponse, RefreshRequest, GoogleAuthRequest
)
from app.services.otp_service import store_otp, verify_otp_code
from app.services.notification_service import send_otp_sms

router = APIRouter()


def _generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


# Optional rate limiter — disabled when fastapi-limiter not installed
def _optional_rate_limiter(times: int, seconds: int):
    """Returns a rate limiter dependency, or a no-op if not available."""
    try:
        from fastapi_limiter.depends import RateLimiter
        return Depends(RateLimiter(times=times, seconds=seconds))
    except ImportError:
        async def _noop():
            return None
        return Depends(_noop)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user with email/password."""
    # Check duplicate email
    if payload.email:
        result = await db.execute(select(User).where(User.email == payload.email))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already registered.")

    # Check duplicate mobile
    if payload.mobile:
        result = await db.execute(select(User).where(User.mobile == payload.mobile))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Mobile already registered.")

    user = User(
        name=payload.name,
        email=payload.email,
        mobile=payload.mobile,
        password_hash=hash_password(payload.password) if payload.password else None,
        city=payload.city,
        user_type=payload.user_type or UserType.BUYER,
        status=UserStatus.ACTIVE,
    )
    db.add(user)
    await db.flush()  # Get user.id

    # Initialize contact credits
    credits = ContactCredit(user_id=user.id, total_credits=0, used_credits=0)
    db.add(credits)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token({"sub": str(user.id), "role": user.user_type})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_type=user.user_type,
        user_id=str(user.id),
        name=user.name,
        email=user.email,
        mobile=user.mobile,
        city=user.city,
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login with email + password."""
    result = await db.execute(select(User).where(User.email.ilike(payload.email.strip())))
    user: Optional[User] = result.scalar_one_or_none()

    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if user.status == UserStatus.BLOCKED:
        raise HTTPException(status_code=403, detail="Account is blocked.")

    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()

    access_token = create_access_token({"sub": str(user.id), "role": user.user_type})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_type=user.user_type,
        user_id=str(user.id),
        name=user.name,
        email=user.email,
        mobile=user.mobile,
        city=user.city,
    )


@router.post("/send-otp")
async def send_otp(payload: OTPSendRequest, db: AsyncSession = Depends(get_db)):
    """Send OTP to a mobile number."""
    otp = _generate_otp(settings.OTP_LENGTH)
    await store_otp(payload.mobile, otp, expiry_minutes=settings.OTP_EXPIRY_MINUTES)
    await send_otp_sms(payload.mobile, otp)
    return {"message": "OTP sent successfully.", "expires_in_minutes": settings.OTP_EXPIRY_MINUTES}


@router.post("/verify-otp")
async def verify_otp(payload: OTPVerifyRequest, db: AsyncSession = Depends(get_db)):
    """Verify OTP and mark mobile as verified."""
    is_valid = await verify_otp_code(payload.mobile, payload.otp)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")

    result = await db.execute(select(User).where(User.mobile == payload.mobile))
    user: Optional[User] = result.scalar_one_or_none()
    if user:
        user.is_mobile_verified = True
        await db.commit()

    return {"message": "Mobile verified successfully."}


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Refresh JWT access token using a valid refresh token."""
    try:
        token_data = decode_token(payload.refresh_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token.")

    if token_data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Not a refresh token.")

    user_id = token_data.get("sub")
    import uuid
    try:
        user_uuid = uuid.UUID(user_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid user ID in token.")

    result = await db.execute(select(User).where(User.id == user_uuid))
    user: Optional[User] = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")

    access_token = create_access_token({"sub": str(user.id), "role": user.user_type})
    new_refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access_token, refresh_token=new_refresh_token, user_type=user.user_type)


@router.post("/logout")
async def logout():
    """Logout — client should discard tokens."""
    return {"message": "Logged out successfully."}


@router.post("/google", response_model=TokenResponse)
async def google_login(payload: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    """Simulate Google OAuth registration/login."""
    if not payload.id_token or len(payload.id_token) < 5:
        raise HTTPException(status_code=400, detail="Invalid Google ID token.")

    # Simulated token extraction
    email = "google_buyer@test.com"
    name = "Google User"

    # Check if user exists
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        # Register new Google buyer user
        user = User(
            name=name,
            email=email,
            user_type=UserType.BUYER,
            status=UserStatus.ACTIVE,
            is_email_verified=True,
            is_mobile_verified=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        # Allocate initial free credits
        credit = ContactCredit(user_id=user.id, total_credits=5, used_credits=0)
        db.add(credit)
        await db.commit()

    access_token = create_access_token({"sub": str(user.id), "role": user.user_type})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_type=user.user_type
    )


from pydantic import BaseModel

class ResetPasswordPayload(BaseModel):
    mobile_or_email: str
    new_password: str

@router.post("/reset-password")
async def reset_password(payload: ResetPasswordPayload, db: AsyncSession = Depends(get_db)):
    """Reset user password using email or mobile number."""
    target = payload.mobile_or_email.strip()
    result = await db.execute(select(User).where((User.email.ilike(target)) | (User.mobile == target)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="No registered account found with this email or mobile.")

    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")

    user.password_hash = hash_password(payload.new_password)
    db.add(user)
    await db.commit()
    return {"message": "Password has been successfully updated. You can now log in."}

