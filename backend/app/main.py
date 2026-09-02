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

    # 2. Initialize schema and enforce Row Level Security (RLS) on PostgreSQL
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            if conn.dialect.name == "postgresql":
                from sqlalchemy import text
                tables = [
                    "deactivated_properties", "property_verifications", "property_reports",
                    "contact_unlocks", "favorites", "subscriptions", "subscription_plans",
                    "contact_credits", "payments", "saved_searches", "notifications",
                    "audit_logs", "users", "agents", "properties", "locations",
                    "property_images", "property_amenities", "property_views"
                ]
                for tbl in tables:
                    await conn.execute(text(f"ALTER TABLE IF EXISTS public.{tbl} ENABLE ROW LEVEL SECURITY;"))
                
                # Create explicit RLS policies for all tables to resolve Supabase linter warnings
                public_read_tables = ["properties", "locations", "property_images", "property_amenities", "subscription_plans", "agents"]
                for tbl in public_read_tables:
                    policy_sql = text(f"""
                        DO $$
                        BEGIN
                            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = '{tbl}' AND policyname = 'allow_public_read_{tbl}') THEN
                                CREATE POLICY allow_public_read_{tbl} ON public.{tbl} FOR SELECT USING (true);
                            END IF;
                        END $$;
                    """)
                    await conn.execute(policy_sql)

                service_tables = [
                    "users", "audit_logs", "contact_credits", "contact_unlocks",
                    "deactivated_properties", "favorites", "notifications", "payments",
                    "property_reports", "property_verifications", "property_views",
                    "saved_searches", "subscriptions"
                ]
                for tbl in service_tables:
                    policy_sql = text(f"""
                        DO $$
                        BEGIN
                            DROP POLICY IF EXISTS service_access_{tbl} ON public.{tbl};
                            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = '{tbl}' AND policyname = 'service_role_{tbl}') THEN
                                CREATE POLICY service_role_{tbl} ON public.{tbl} TO service_role USING (true) WITH CHECK (true);
                            END IF;
                        END $$;
                    """)
                # Ensure new attribute columns exist on properties table
                await conn.execute(text("ALTER TABLE properties ADD COLUMN IF NOT EXISTS pg_for VARCHAR(50);"))
                await conn.execute(text("ALTER TABLE properties ADD COLUMN IF NOT EXISTS room_type VARCHAR(100);"))
                await conn.execute(text("ALTER TABLE properties ADD COLUMN IF NOT EXISTS food_status VARCHAR(100);"))
        logger.info("Database schemas and Row Level Security (RLS) verified.")
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

            # Ensure default subscription plans exist in database
            import uuid
            from app.models.monetization import SubscriptionPlan
            
            default_plans = [
                {"name": "Basic Bundle", "price": 99.0, "contact_limit": 5, "validity_days": 30, "description": "Unlock 5 owner contacts. Perfect for quick exploration."},
                {"name": "Standard Package", "price": 199.0, "contact_limit": 15, "validity_days": 30, "description": "Unlock 15 owner contacts. Our most popular choice."},
                {"name": "Premium Package", "price": 399.0, "contact_limit": 50, "validity_days": 60, "description": "Unlock 50 owner contacts. Best value for active searchers."},
            ]
            
            for plan_preset in default_plans:
                plan_check = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.name == plan_preset["name"]))
                existing_plan = plan_check.scalar_one_or_none()
                if not existing_plan:
                    new_plan = SubscriptionPlan(
                        id=uuid.uuid4(),
                        name=plan_preset["name"],
                        description=plan_preset["description"],
                        price=plan_preset["price"],
                        contact_limit=plan_preset["contact_limit"],
                        validity_days=plan_preset["validity_days"],
                        is_active=True,
                    )
                    db.add(new_plan)
                    logger.info(f"Seeded default subscription plan: {plan_preset['name']}")
            
            await db.commit()
    except Exception as e:
        logger.warning(f"Super Admin / Plan auto-seed note: {e}")

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
