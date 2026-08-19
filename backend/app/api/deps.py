from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import JWTError

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserStatus, UserType

bearer_scheme = HTTPBearer(auto_error=False)


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Gracefully extract user if token exists; return None if unauthenticated."""
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        user_id = payload.get("sub")
        if not user_id:
            return None
        import uuid
        user_uuid = uuid.UUID(user_id)
        result = await db.execute(select(User).where(User.id == user_uuid))
        return result.scalar_one_or_none()
    except Exception:
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate JWT, return the current User."""
    try:
        payload = decode_token(credentials.credentials)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload.")

    import uuid
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token payload.")

    result = await db.execute(select(User).where(User.id == user_uuid))
    user: User | None = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="User not found.")
    if user.status == UserStatus.BLOCKED:
        raise HTTPException(status_code=403, detail="Account is blocked.")

    return user


async def get_current_active_user(user: User = Depends(get_current_user)) -> User:
    """Ensure the user is active (not blocked/suspended)."""
    if user.status not in (UserStatus.ACTIVE, UserStatus.PENDING_VERIFICATION):
        raise HTTPException(status_code=403, detail="Account is not active.")
    return user


def require_role(*roles: UserType):
    """Dependency factory: restrict endpoint to specific user roles."""
    async def _check(user: User = Depends(get_current_active_user)) -> User:
        if user.user_type not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions.")
        return user
    return _check


def require_verified_mobile(user: User = Depends(get_current_active_user)) -> User:
    """Ensure the user has a verified mobile number."""
    if not user.is_mobile_verified:
        raise HTTPException(
            status_code=403,
            detail="Mobile number must be verified before this action.",
        )
    return user
