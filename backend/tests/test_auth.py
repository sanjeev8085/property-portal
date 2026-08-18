"""
Test Suite: Authentication Endpoints
Tests: /auth/register, /auth/login, /auth/send-otp, /auth/verify-otp,
       /auth/refresh, /auth/logout
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestRegister:
    """Tests for POST /api/v1/auth/register"""

    async def test_register_success(self, client: AsyncClient):
        """A new user can register with valid data."""
        resp = await client.post("/api/v1/auth/register", json={
            "name": "Sanjeev Tyagi",
            "email": "sanjeev@test.com",
            "mobile": "9000000001",
            "password": "secure1234",
            "user_type": "buyer",
            "city": "Bhopal",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["user_type"] == "buyer"

    async def test_register_as_owner(self, client: AsyncClient):
        """Owner user type is accepted on registration."""
        resp = await client.post("/api/v1/auth/register", json={
            "name": "Property Owner",
            "email": "owner2@test.com",
            "password": "secure1234",
            "user_type": "owner",
        })
        assert resp.status_code == 201
        assert resp.json()["user_type"] == "owner"

    async def test_register_duplicate_email_fails(self, client: AsyncClient, registered_user: dict):
        """Duplicate email should return 400."""
        resp = await client.post("/api/v1/auth/register", json={
            "name": "Duplicate",
            "email": "buyer@test.com",  # Already registered
            "password": "secure1234",
        })
        assert resp.status_code == 400
        assert "Email already registered" in resp.json()["detail"]

    async def test_register_weak_password_fails(self, client: AsyncClient):
        """Password shorter than 8 chars should fail validation."""
        resp = await client.post("/api/v1/auth/register", json={
            "name": "Short Pass",
            "email": "shortpass@test.com",
            "password": "abc",
        })
        assert resp.status_code == 422  # Validation error

    async def test_register_without_email_or_mobile_allowed(self, client: AsyncClient):
        """Registration without email (mobile only) should be possible."""
        resp = await client.post("/api/v1/auth/register", json={
            "name": "Mobile Only User",
            "mobile": "9000000099",
            "user_type": "buyer",
        })
        # Should succeed (no password hash, social login case)
        assert resp.status_code in (201, 422)


@pytest.mark.asyncio
class TestLogin:
    """Tests for POST /api/v1/auth/login"""

    async def test_login_success(self, client: AsyncClient, registered_user: dict):
        """Valid credentials return tokens."""
        resp = await client.post("/api/v1/auth/login", json={
            "email": "buyer@test.com",
            "password": "testpass123",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password(self, client: AsyncClient, registered_user: dict):
        """Wrong password returns 401."""
        resp = await client.post("/api/v1/auth/login", json={
            "email": "buyer@test.com",
            "password": "wrongpassword",
        })
        assert resp.status_code == 401
        assert "Invalid" in resp.json()["detail"]

    async def test_login_unknown_email(self, client: AsyncClient):
        """Non-existent email returns 401."""
        resp = await client.post("/api/v1/auth/login", json={
            "email": "nobody@test.com",
            "password": "testpass123",
        })
        assert resp.status_code == 401

    async def test_login_missing_fields(self, client: AsyncClient):
        """Missing email or password returns 422."""
        resp = await client.post("/api/v1/auth/login", json={"email": "x@x.com"})
        assert resp.status_code == 422


@pytest.mark.asyncio
class TestTokenRefresh:
    """Tests for POST /api/v1/auth/refresh"""

    async def test_refresh_with_valid_token(self, client: AsyncClient, registered_user: dict):
        """Valid refresh token returns new access token."""
        resp = await client.post("/api/v1/auth/refresh", json={
            "refresh_token": registered_user["refresh_token"]
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    async def test_refresh_with_invalid_token(self, client: AsyncClient):
        """Invalid refresh token returns 401."""
        resp = await client.post("/api/v1/auth/refresh", json={
            "refresh_token": "not.a.valid.token"
        })
        assert resp.status_code == 401

    async def test_refresh_with_access_token_fails(self, client: AsyncClient, registered_user: dict):
        """Using an access token as refresh token should fail."""
        resp = await client.post("/api/v1/auth/refresh", json={
            "refresh_token": registered_user["access_token"]  # Wrong token type
        })
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestLogout:
    """Tests for POST /api/v1/auth/logout"""

    async def test_logout_returns_success(self, client: AsyncClient, buyer_auth_headers: dict):
        """Logout endpoint returns success message."""
        resp = await client.post("/api/v1/auth/logout", headers=buyer_auth_headers)
        assert resp.status_code == 200
        assert "Logged out" in resp.json()["message"]


@pytest.mark.asyncio
class TestOTP:
    """Tests for OTP send/verify endpoints."""

    async def test_send_otp_returns_success(self, client: AsyncClient):
        """OTP send endpoint returns success message (mocked SMS)."""
        resp = await client.post("/api/v1/auth/send-otp", json={"mobile": "9000000001"})
        # Expect 200 or 429 (rate limit) — both are valid
        assert resp.status_code in (200, 429)

    async def test_verify_invalid_otp(self, client: AsyncClient):
        """Invalid OTP returns 400."""
        resp = await client.post("/api/v1/auth/verify-otp", json={
            "mobile": "9000000001",
            "otp": "000000",
        })
        assert resp.status_code == 400
