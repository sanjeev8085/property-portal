"""OTP storage and verification using Redis."""
import redis.asyncio as aioredis
from app.core.config import settings

REDIS_OTP_PREFIX = "otp:"


async def _get_redis():
    return await aioredis.from_url(settings.REDIS_URL, decode_responses=True)


async def store_otp(mobile: str, otp: str, expiry_minutes: int = 10) -> None:
    """Store OTP in Redis with expiry."""
    r = await _get_redis()
    key = f"{REDIS_OTP_PREFIX}{mobile}"
    await r.setex(key, expiry_minutes * 60, otp)
    await r.aclose()


async def verify_otp_code(mobile: str, otp: str) -> bool:
    """Verify OTP against stored value. Returns True if valid."""
    r = await _get_redis()
    key = f"{REDIS_OTP_PREFIX}{mobile}"
    stored = await r.get(key)
    await r.aclose()
    if stored and stored == otp:
        return True
    return False


async def delete_otp(mobile: str) -> None:
    """Delete OTP from Redis after successful use."""
    r = await _get_redis()
    await r.delete(f"{REDIS_OTP_PREFIX}{mobile}")
    await r.aclose()
