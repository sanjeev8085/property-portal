"""OTP storage and verification using Redis with in-memory fallback and max attempt enforcement."""
import time
import logging
from typing import Dict, Tuple
import redis.asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger("otp_service")
REDIS_OTP_PREFIX = "otp:"
REDIS_ATTEMPTS_PREFIX = "otp_attempts:"
MAX_OTP_ATTEMPTS = 5

# In-memory storage fallback: key -> (otp_code, expires_at_timestamp, attempts_count)
_IN_MEMORY_OTP_STORE: Dict[str, Tuple[str, float, int]] = {}


async def _get_redis():
    return await aioredis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=1.0)


async def store_otp(mobile: str, otp: str, expiry_minutes: int = 10) -> None:
    """Store OTP with 10-minute TTL and reset attempts."""
    ttl_seconds = expiry_minutes * 60
    key = f"{REDIS_OTP_PREFIX}{mobile}"
    attempts_key = f"{REDIS_ATTEMPTS_PREFIX}{mobile}"

    try:
        r = await _get_redis()
        await r.setex(key, ttl_seconds, otp)
        await r.setex(attempts_key, ttl_seconds, 0)
        await r.aclose()
        return
    except Exception as exc:
        logger.warning(f"[OTP Service] Redis offline ({exc}). Using in-memory OTP store.")

    # In-memory fallback
    _IN_MEMORY_OTP_STORE[mobile] = (otp, time.time() + ttl_seconds, 0)


async def verify_otp_code(mobile: str, otp: str) -> bool:
    """
    Verify OTP against stored value.
    Enforces maximum 5 attempts and automatically invalidates the code on exhaustion or success.
    """
    key = f"{REDIS_OTP_PREFIX}{mobile}"
    attempts_key = f"{REDIS_ATTEMPTS_PREFIX}{mobile}"

    try:
        r = await _get_redis()
        stored_otp = await r.get(key)
        attempts = await r.get(attempts_key)
        attempts = int(attempts) if attempts else 0

        if not stored_otp:
            await r.aclose()
            return False

        if attempts >= MAX_OTP_ATTEMPTS:
            # Invalidate OTP on attempt exhaustion
            await r.delete(key)
            await r.delete(attempts_key)
            await r.aclose()
            logger.warning(f"[OTP Service] Max OTP verification attempts exceeded for {mobile}. Code invalidated.")
            return False

        if stored_otp == otp.strip():
            # Invalidate on success so code cannot be reused
            await r.delete(key)
            await r.delete(attempts_key)
            await r.aclose()
            return True
        else:
            await r.incr(attempts_key)
            await r.aclose()
            return False
    except Exception as exc:
        logger.warning(f"[OTP Service] Redis offline ({exc}). Verifying via in-memory OTP store.")

    # In-memory fallback verification
    record = _IN_MEMORY_OTP_STORE.get(mobile)
    if not record:
        return False

    stored_otp, expires_at, attempts = record
    if time.time() > expires_at:
        _IN_MEMORY_OTP_STORE.pop(mobile, None)
        return False

    if attempts >= MAX_OTP_ATTEMPTS:
        _IN_MEMORY_OTP_STORE.pop(mobile, None)
        return False

    if stored_otp == otp.strip():
        _IN_MEMORY_OTP_STORE.pop(mobile, None)
        return True
    else:
        _IN_MEMORY_OTP_STORE[mobile] = (stored_otp, expires_at, attempts + 1)
        return False


async def delete_otp(mobile: str) -> None:
    """Delete OTP after successful use."""
    _IN_MEMORY_OTP_STORE.pop(mobile, None)
    try:
        r = await _get_redis()
        await r.delete(f"{REDIS_OTP_PREFIX}{mobile}")
        await r.delete(f"{REDIS_ATTEMPTS_PREFIX}{mobile}")
        await r.aclose()
    except Exception:
        pass
