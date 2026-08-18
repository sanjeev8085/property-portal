"""Async SQLAlchemy database engine and session factory.

Supports PostgreSQL (Supabase / Render / Railway production) and SQLite (tests / local dev).
Automatically normalizes connection strings and manages SSL parameters.
"""
import re
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import StaticPool, NullPool

from app.core.config import settings


def _normalize_db_url(raw_url: str) -> tuple[str, dict]:
    """Normalize database URL for SQLAlchemy asyncpg driver and extract SSL args."""
    url = raw_url.strip()
    connect_args = {}

    if url.startswith("sqlite"):
        return url, {"check_same_thread": False}

    # Convert standard postgres URIs to asyncpg driver
    if url.startswith("postgres://"):
        url = "postgresql+asyncpg://" + url[len("postgres://"):]
    elif url.startswith("postgresql://"):
        url = "postgresql+asyncpg://" + url[len("postgresql://"):]

    # Handle SSL query parameter (common in Supabase / Render / Neon)
    if "sslmode=require" in url or "ssl=require" in url or "sslmode=verify-full" in url:
        url = re.sub(r"[?&]sslmode=[^&]+", "", url)
        url = re.sub(r"[?&]ssl=[^&]+", "", url)
        if url.endswith("?"):
            url = url[:-1]
        connect_args["ssl"] = True

    return url, connect_args


def _make_engine():
    """Create engine with appropriate args for the configured database."""
    url, connect_args = _normalize_db_url(settings.DATABASE_URL)
    is_sqlite = url.startswith("sqlite")

    if is_sqlite:
        return create_async_engine(
            url,
            echo=settings.DEBUG,
            connect_args=connect_args,
            poolclass=StaticPool,
        )
    else:
        return create_async_engine(
            url,
            echo=settings.DEBUG,
            connect_args=connect_args,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,
        )


engine = _make_engine()

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


async def get_db() -> AsyncSession:
    """FastAPI dependency: provides an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
