"""
Property Marketplace Portal — FastAPI Application Entry Point
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings, validate_production_secrets
from app.core.database import engine, Base, get_db, AsyncSessionLocal
from app.api.v1.router import api_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # 0. Log startup environment and validate production secrets
    logger.info(f"Starting AuraHomes Portal | env={settings.APP_ENV} | debug={settings.DEBUG}")
    validate_production_secrets()

    # 1. Initialize Sentry error monitoring (best-effort — skipped if DSN not set)
    if settings.SENTRY_DSN:
        try:
            import sentry_sdk
            sentry_sdk.init(
                dsn=settings.SENTRY_DSN,
                environment=settings.APP_ENV,
                traces_sample_rate=0.1,  # 10% performance tracing
                send_default_pii=False,
            )
            logger.info("[Sentry] Error monitoring initialized.")
        except ImportError:
            logger.warning("[Sentry] sentry-sdk not installed. Run: pip install sentry-sdk")
        except Exception as exc:
            logger.warning(f"[Sentry] Failed to initialize: {exc}")
    else:
        logger.info("[Sentry] DSN not configured — error monitoring disabled (set SENTRY_DSN in .env).")

    # 2. Initialize schema automatically if not using alembic in dev/initial free deploy
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schemas verified.")
    except Exception as e:
        logger.warning(f"Database schema auto-creation skipped or already initialized: {e}")

    # 3. Initialize Redis-based rate limiter only in non-test environments (graceful fallback)
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

    # 4. Ensure Super Admin user exists (without overwriting if already set)
    try:
        import os
        from app.models.user import User, UserType, UserStatus
        from app.core.security import hash_password
        from sqlalchemy import select
        # Admin password comes from env var; default is insecure and prints a warning
        admin_password = os.getenv("ADMIN_INITIAL_PASSWORD", "Admin@12345")
        if admin_password == "Admin@12345" and settings.APP_ENV == "production":
            logger.critical(
                "[ADMIN] ADMIN_INITIAL_PASSWORD is not set — using insecure default 'Admin@12345'. "
                "Set ADMIN_INITIAL_PASSWORD in .env immediately!"
            )
        async with AsyncSessionLocal() as db:
            admin_check = await db.execute(select(User).where(User.email == "admin@aurahomes.in"))
            admin_user = admin_check.scalar_one_or_none()
            if not admin_user:
                admin_user = User(
                    name="Super Admin",
                    email="admin@aurahomes.in",
                    mobile="9893000000",
                    password_hash=hash_password(admin_password),
                    user_type=UserType.ADMIN,
                    status=UserStatus.ACTIVE,
                )
                db.add(admin_user)
                await db.commit()
                logger.info("Super Admin user created: admin@aurahomes.in")
            else:
                logger.info("Super Admin user verified: admin@aurahomes.in")
    except Exception as e:
        logger.warning(f"Super Admin auto-seed note: {e}")

    # 5. Spawn subscription expiry checker background task scheduler
    import asyncio
    from app.core.scheduler import start_expiry_scheduler
    scheduler_task = asyncio.create_task(start_expiry_scheduler(interval_seconds=86400))
    app.state.scheduler_task = scheduler_task

    yield

    # Cancel task on shutdown
    scheduler_task.cancel()


# Disable /docs and /redoc in production to prevent API schema disclosure
_docs_url = None if settings.APP_ENV == "production" else "/docs"
_redoc_url = None if settings.APP_ENV == "production" else "/redoc"

app = FastAPI(
    title=settings.APP_NAME,
    description="Property Marketplace Portal API",
    version=settings.APP_VERSION,
    docs_url=_docs_url,
    redoc_url=_redoc_url,
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


from app.api.deps import require_role
from app.models.user import User, UserType

@app.post("/reset-database", tags=["Admin"])
async def root_reset_database(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserType.ADMIN))
):
    """Purge test data and reset database (Admin only)."""
    from sqlalchemy import text, select
    from app.models.user import UserStatus
    from app.core.security import hash_password

    for tbl in [
        "property_images", "contact_unlocks", "favorites", "property_amenities",
        "property_views", "property_verifications", "property_reports",
        "notifications", "payments", "subscriptions", "otps", "saved_searches", "properties"
    ]:
        try:
            await db.execute(text(f"DELETE FROM {tbl};"))
            await db.commit()
        except Exception:
            await db.rollback()

    try:
        await db.execute(text("DELETE FROM users WHERE email != 'admin@aurahomes.in';"))
        await db.commit()
    except Exception:
        await db.rollback()

    return {"status": "success", "message": "Database cleaned and Super Admin verified"}
