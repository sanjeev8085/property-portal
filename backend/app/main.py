"""
Property Marketplace Portal — FastAPI Application Entry Point
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.router import api_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # 1. Initialize schema automatically if not using alembic in dev/initial free deploy
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schemas verified.")
    except Exception as e:
        logger.warning(f"Database schema auto-creation skipped or already initialized: {e}")

    # 2. Initialize Redis-based rate limiter only in non-test environments (graceful fallback)
    if settings.APP_ENV != "test":
        try:
            import redis.asyncio as aioredis
            from fastapi_limiter import FastAPILimiter
            redis_client = aioredis.from_url(
                settings.REDIS_URL, encoding="utf-8", decode_responses=True
            )
            await FastAPILimiter.init(redis_client)
            logger.info("Redis rate limiting initialized.")
        except Exception:
            logger.info("Redis not reachable — continuing without rate limiting on free tier.")

    # 3. Spawn subscription expiry checker background task scheduler
    import asyncio
    from app.core.scheduler import start_expiry_scheduler
    scheduler_task = asyncio.create_task(start_expiry_scheduler(interval_seconds=86400))
    app.state.scheduler_task = scheduler_task

    yield

    # Cancel task on shutdown
    scheduler_task.cancel()


app = FastAPI(
    title=settings.APP_NAME,
    description="Property Marketplace Portal API",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

from app.core.middleware import SecurityMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityMiddleware)

# ─── Routers ─────────────────────────────────────────────────────────────────
app.include_router(api_router, prefix="/api/v1")


# ─── Health Check ────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}
