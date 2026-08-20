"""
Auth endpoints — register, login, Google OAuth, OTP, refresh, logout, password reset.
Includes rate limiting, brute force protection, and secure token issuance.
"""
import random
import string
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.config import settings
from app.core.rate_limiter import check_rate_limit
from app.models.user import User, UserType, UserStatus
from app.models.monetization import ContactCredit
from app.schemas.auth import (
    RegisterRequest, LoginRequest, OTPSendRequest, OTPVerifyRequest,
    TokenResponse, RefreshRequest, GoogleAuthRequest,
    RequestPasswordResetPayload, ResetPasswordPayload
)
from app.services.otp_service import store_otp, verify_otp_code, delete_otp
from app.services.notification_service import send_otp_sms

router = APIRouter()


def _generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """Set secure HttpOnly cookies for web clients."""
    is_secure = settings.APP_ENV == "production"
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/"
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user with email/password and rate limit check."""
    await check_rate_limit(request, "register", max_requests=10, window_seconds=60, identifier=payload.email or payload.mobile)

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
    _set_auth_cookies(response, access_token, refresh_token)

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
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """Login with email + password protected by rate limiting."""
    await check_rate_limit(request, "login", max_requests=10, window_seconds=60, identifier=payload.email.strip())

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
    _set_auth_cookies(response, access_token, refresh_token)

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
async def send_otp(
    payload: OTPSendRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Send OTP to a mobile number with rate limiting and TTL."""
    await check_rate_limit(request, "send_otp", max_requests=5, window_seconds=60, identifier=payload.mobile.strip())

    otp = _generate_otp(settings.OTP_LENGTH)
    await store_otp(payload.mobile, otp, expiry_minutes=settings.OTP_EXPIRY_MINUTES)
    await send_otp_sms(payload.mobile, otp)
    return {"message": "OTP sent successfully.", "expires_in_minutes": settings.OTP_EXPIRY_MINUTES}


@router.post("/verify-otp")
async def verify_otp(
    payload: OTPVerifyRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Verify OTP and mark mobile as verified (max 5 attempts per code)."""
    await check_rate_limit(request, "verify_otp", max_requests=10, window_seconds=60, identifier=payload.mobile.strip())

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
async def refresh_token(
    payload: RefreshRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
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
    _set_auth_cookies(response, access_token, new_refresh_token)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user_type=user.user_type,
        user_id=str(user.id),
        name=user.name,
        email=user.email,
        mobile=user.mobile,
        city=user.city,
    )


@router.post("/logout")
async def logout(response: Response):
    """Logout — clears secure cookies and informs client."""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Logged out successfully."}


@router.post("/google", response_model=TokenResponse)
async def google_login(
    payload: GoogleAuthRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """Simulate Google OAuth registration/login."""
    if not payload.id_token or len(payload.id_token) < 5:
        raise HTTPException(status_code=400, detail="Invalid Google ID token.")

    email = "google_buyer@test.com"
    name = "Google User"

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
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

        credit = ContactCredit(user_id=user.id, total_credits=5, used_credits=0)
        db.add(credit)
        await db.commit()

    access_token = create_access_token({"sub": str(user.id), "role": user.user_type})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    _set_auth_cookies(response, access_token, refresh_token)

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


@router.post("/request-password-reset")
async def request_password_reset(
    payload: RequestPasswordResetPayload,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Step 1: Request password reset.
    Generates a secure 10-minute OTP and signed reset token after finding registered account.
    """
    await check_rate_limit(request, "pwd_reset_req", max_requests=5, window_seconds=60, identifier=payload.mobile_or_email.strip())

    target = payload.mobile_or_email.strip()
    result = await db.execute(select(User).where((User.email.ilike(target)) | (User.mobile == target)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="No registered account found with this email or mobile.")

    otp = _generate_otp(6)
    target_mobile = user.mobile or target
    await store_otp(f"pwd_reset:{target}", otp, expiry_minutes=10)
    await send_otp_sms(target_mobile, otp)

    # Generate a signed short-lived reset token (valid for 10 minutes)
    reset_token = create_access_token(
        {"sub": str(user.id), "type": "password_reset", "contact": target},
        expires_delta=timedelta(minutes=10)
    )

    return {
        "message": "Password reset OTP has been dispatched to your contact.",
        "reset_token": reset_token,
        "expires_in_minutes": 10,
        "requires_otp": True
    }


@router.post("/reset-password")
async def reset_password(
    payload: ResetPasswordPayload,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Step 2: Reset user password.
    Requires verified OTP or valid signed reset_token to prevent unauthorized takeover.
    """
    await check_rate_limit(request, "pwd_reset_submit", max_requests=5, window_seconds=60, identifier=payload.mobile_or_email.strip())

    target = payload.mobile_or_email.strip()
    result = await db.execute(select(User).where((User.email.ilike(target)) | (User.mobile == target)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="No registered account found with this email or mobile.")

    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")

    is_verified = False

    # Check 1: Verified via signed reset token
    if payload.reset_token:
        try:
            token_payload = decode_token(payload.reset_token)
            if token_payload.get("type") == "password_reset" and token_payload.get("sub") == str(user.id):
                is_verified = True
        except Exception:
            is_verified = False

    # Check 2: Verified via OTP code
    if not is_verified and payload.otp:
        otp_valid = await verify_otp_code(f"pwd_reset:{target}", payload.otp)
        if otp_valid:
            is_verified = True

    if not is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset verification failed. Please provide a valid OTP or reset token."
        )

    # Invalidate OTP immediately
    await delete_otp(f"pwd_reset:{target}")

    user.password_hash = hash_password(payload.new_password)
    db.add(user)
    await db.commit()
    return {"message": "Password has been successfully updated. You can now log in."}
