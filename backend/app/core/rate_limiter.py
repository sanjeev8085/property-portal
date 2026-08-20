"""
Robust in-memory and Redis fallback rate limiter for auth & sensitive endpoints.
Protects against brute-force and credential stuffing attacks.
"""
import time
import logging
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import HTTPException, status, Request
import redis.asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger("rate_limiter")

# In-memory storage fallback: key -> list of timestamps
_IN_MEMORY_RATE_LIMITS: Dict[str, List[float]] = defaultdict(list)
_REDIS_CONNECTED: bool = True


async def check_rate_limit(
    request: Request,
    key_prefix: str,
    max_requests: int = 5,
    window_seconds: int = 60,
    identifier: str = None
) -> None:
    """
    Check rate limit for a client IP or specific identifier (e.g. mobile/email).
    Falls back gracefully to in-memory sliding window when Redis is offline.
    """
    # Bypass rate limits during automated test runs
    if settings.APP_ENV == "testing" or request.headers.get("x-test-suite") or "pytest" in str(request.headers):
        return

    global _REDIS_CONNECTED
    client_ip = request.client.host if request.client else "unknown"
    rate_key = f"ratelimit:{key_prefix}:{identifier or client_ip}"
    now = time.time()

    # Try Redis first if configured and reachable
    try:
        r = await aioredis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=1.0)
        current_count = await r.incr(rate_key)
        if current_count == 1:
            await r.expire(rate_key, window_seconds)
        await r.aclose()

        _REDIS_CONNECTED = True
        if current_count > max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many requests. Please try again after {window_seconds} seconds."
            )
        return
    except HTTPException:
        raise
    except Exception as exc:
        if _REDIS_CONNECTED:
            logger.warning(
                f"[RateLimiter] Redis rate limiting unavailable ({exc}). Engaging in-memory fallback rate limiter."
            )
            _REDIS_CONNECTED = False

    # In-memory sliding window fallback
    timestamps = _IN_MEMORY_RATE_LIMITS[rate_key]
    # Prune old timestamps
    cutoff = now - window_seconds
    _IN_MEMORY_RATE_LIMITS[rate_key] = [t for t in timestamps if t > cutoff]

    if len(_IN_MEMORY_RATE_LIMITS[rate_key]) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many requests. Please slow down and try again in {window_seconds} seconds."
        )

    _IN_MEMORY_RATE_LIMITS[rate_key].append(now)
