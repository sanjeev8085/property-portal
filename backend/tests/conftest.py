"""
pytest configuration and shared fixtures for the test suite.

Tests use:
  - In-memory SQLite (no PostgreSQL needed)
  - Mocked OTP and notification services (no Redis/SMS needed)
  - Works with pydantic v1 and v2
"""
import asyncio
import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """Single event loop for the test session."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture(autouse=True)
async def setup_database(test_engine):
    """Create all tables before each test and drop them after."""
    from app.core.database import Base
    import app.models  # noqa
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncSession:
    """Transactional session, rolled back after each test."""
    factory = async_sessionmaker(test_engine, expire_on_commit=False)
    async with factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncClient:
    """HTTP test client with DB override and all external services mocked."""
    from app.main import app
    from app.core.database import get_db

    # Must be an async generator for FastAPI dependency override
    async def _override_db():
        yield db_session
        # No commit here — conftest manages lifecycle

    app.dependency_overrides[get_db] = _override_db

    async def mock_verify(mobile: str, otp: str) -> bool:
        if otp == "000000":
            return False
        return True

    patches = [
        patch("app.api.v1.endpoints.auth.store_otp", new_callable=AsyncMock),
        patch("app.api.v1.endpoints.auth.verify_otp_code", new_callable=AsyncMock, side_effect=mock_verify),
        patch("app.api.v1.endpoints.auth.send_otp_sms", new_callable=AsyncMock, return_value=True),
    ]
    started = [p.start() for p in patches]

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    for p in patches:
        p.stop()
    app.dependency_overrides.clear()


# ─── User Fixtures ────────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def registered_user(client: AsyncClient) -> dict:
    resp = await client.post("/api/v1/auth/register", json={
        "name": "Test Buyer",
        "email": "buyer@test.com",
        "mobile": "9876543210",
        "password": "testpass123",
        "user_type": "buyer",
        "city": "Bhopal",
    })
    assert resp.status_code == 201, f"Register failed: {resp.status_code} {resp.text}"
    return resp.json()


@pytest_asyncio.fixture
async def owner_user(client: AsyncClient) -> dict:
    resp = await client.post("/api/v1/auth/register", json={
        "name": "Test Owner",
        "email": "owner@test.com",
        "mobile": "9876543211",
        "password": "testpass123",
        "user_type": "owner",
        "city": "Bhopal",
    })
    assert resp.status_code == 201, f"Owner register failed: {resp.status_code} {resp.text}"
    return resp.json()


@pytest.fixture
def buyer_auth_headers(registered_user: dict) -> dict:
    return {"Authorization": f"Bearer {registered_user['access_token']}"}


@pytest.fixture
def owner_auth_headers(owner_user: dict) -> dict:
    return {"Authorization": f"Bearer {owner_user['access_token']}"}
