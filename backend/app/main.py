"""
Property Marketplace Portal — FastAPI Application Entry Point
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import engine, Base, get_db
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


# ─── Health Check & Database Reset ──────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


@app.get("/reset-database", tags=["Admin"])
@app.post("/reset-database", tags=["Admin"])
async def root_reset_database(db: AsyncSession = Depends(get_db)):
    """Purge all test properties, images, contacts, and reset database to clean fresh state."""
    from sqlalchemy import text
    try:
        await db.execute(text("TRUNCATE TABLE property_images, contact_unlocks, favorites, property_amenities, property_views, property_verifications, property_reports, notifications, payments, subscriptions, otps, saved_searches, properties CASCADE;"))
        await db.execute(text("DELETE FROM users WHERE email != 'admin@aurahomes.in';"))
        await db.commit()
        return {"status": "success", "message": "Database truncated and cleared successfully! Portal is fresh and clean."}
    except Exception as e:
        await db.rollback()
        try:
            for t in ["property_images", "contact_unlocks", "payments", "subscriptions", "properties"]:
                try:
                    await db.execute(text(f"DELETE FROM {t};"))
                    await db.commit()
                except Exception:
                    await db.rollback()
            return {"status": "success", "message": "Tables cleared successfully via fallback."}
        except Exception as e2:
            return {"status": "error", "message": str(e2)}
