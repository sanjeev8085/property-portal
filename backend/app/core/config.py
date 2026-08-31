"""Application configuration using Pydantic v2 Settings."""
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    APP_NAME: str = "AuraHomes Portal"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    APP_SECRET_KEY: str = "change-me-secret-key-12345"

    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    BACKEND_CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
    ]

    FRONTEND_URL: str = "http://localhost:3000"

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v == "*":
                return ["*"]
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    DATABASE_URL: str = "sqlite+aiosqlite:///./test.db"
    REDIS_URL: str = "redis://localhost:6379/0"

    JWT_SECRET_KEY: str = "change-me-jwt-secret-key-67890"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    OTP_EXPIRY_MINUTES: int = 10
    OTP_LENGTH: int = 6

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # Storage Providers: "supabase", "cloudinary", "minio", "local"
    STORAGE_PROVIDER: str = "local"
    STORAGE_ENDPOINT: str = "http://localhost:9000"
    STORAGE_ACCESS_KEY: str = "minioadmin"
    STORAGE_SECRET_KEY: str = "minioadmin"
    STORAGE_BUCKET_NAME: str = "property-portal"
    STORAGE_PUBLIC_URL: str = "http://localhost:9000/property-portal"

    # Cloudinary (Free Tier)
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # Supabase Storage (Free Tier)
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_BUCKET: str = "properties"

    # Email (Resend / Brevo / SendGrid / Gmail SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@aurahomes.in"
    EMAIL_FROM_NAME: str = "AuraHomes"

    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""  # Separate secret set in Razorpay Dashboard → Webhooks
    GOOGLE_MAPS_API_KEY: str = ""

    RATE_LIMIT_OTP_PER_MINUTE: int = 3
    RATE_LIMIT_LOGIN_PER_MINUTE: int = 10
    RATE_LIMIT_API_PER_MINUTE: int = 100

    # SMS Gateway Configuration
    SMS_PROVIDER: str = "mock"  # "mock", "fast2sms", "2factor", "twilio"
    SMS_API_KEY: str = ""
    SMS_SENDER_ID: str = "AURAHM"

    # WhatsApp Business API Configuration
    WHATSAPP_API_ENABLED: bool = False
    WHATSAPP_API_URL: str = "https://graph.facebook.com/v18.0"
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    WHATSAPP_ACCESS_TOKEN: str = ""

    # Error Monitoring
    SENTRY_DSN: str = ""  # Set to your Sentry DSN in production


settings = Settings()


def validate_production_secrets() -> None:
    """
    Called once at startup in production mode.
    Prints loud warnings if insecure default values are still set.
    Raises RuntimeError only when INSECURE_DEFAULTS_FAIL_FAST=true is set.
    """
    import logging
    import os
    log = logging.getLogger("startup.secrets")

    INSECURE_DEFAULTS = {
        "APP_SECRET_KEY": "change-me-secret-key-12345",
        "JWT_SECRET_KEY": "change-me-jwt-secret-key-67890",
    }
    EMPTY_BUT_REQUIRED_IN_PROD = [
        "RAZORPAY_KEY_ID",
        "RAZORPAY_KEY_SECRET",
    ]

    issues = []

    if settings.APP_ENV == "production" and settings.DEBUG:
        issues.append("DEBUG=True is set while APP_ENV=production — disable immediately.")

    for field, bad_value in INSECURE_DEFAULTS.items():
        if getattr(settings, field, "") == bad_value:
            issues.append(
                f"{field} is still set to the insecure default value. "
                f"Generate a strong random value: python -c \"import secrets; print(secrets.token_hex(32))\""
            )

    for field in EMPTY_BUT_REQUIRED_IN_PROD:
        if settings.APP_ENV == "production" and not getattr(settings, field, ""):
            issues.append(f"{field} is empty — payments will not work in production.")

    if settings.STORAGE_PROVIDER == "local" and settings.APP_ENV == "production":
        issues.append(
            "STORAGE_PROVIDER=local in production. Uploaded images are NOT persisted. "
            "Set STORAGE_PROVIDER=cloudinary and configure CLOUDINARY_* credentials."
        )

    if settings.SMS_PROVIDER == "mock" and settings.APP_ENV == "production":
        issues.append(
            "SMS_PROVIDER=mock in production — OTPs will never be delivered. "
            "Set SMS_PROVIDER=fast2sms and SMS_API_KEY."
        )

    if settings.FRONTEND_URL.startswith("http://localhost") and settings.APP_ENV == "production":
        issues.append(
            "FRONTEND_URL still points to localhost — password reset email links will be broken."
        )

    if issues:
        border = "=" * 72
        log.critical("\n" + border)
        log.critical(" PRODUCTION CONFIGURATION WARNINGS — FIX BEFORE GOING LIVE ")
        log.critical(border)
        for i, issue in enumerate(issues, 1):
            log.critical(f"  [{i}] {issue}")
        log.critical(border + "\n")

        # Hard fail only if explicitly requested
        if os.getenv("INSECURE_DEFAULTS_FAIL_FAST", "").lower() == "true":
            raise RuntimeError(
                f"Startup aborted: {len(issues)} production configuration issue(s) detected. "
                "Fix the above warnings and restart."
            )
