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

    # Payments: Razorpay (Pay-as-you-go, ₹0 monthly fee)
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    GOOGLE_MAPS_API_KEY: str = ""

    RATE_LIMIT_OTP_PER_MINUTE: int = 3
    RATE_LIMIT_LOGIN_PER_MINUTE: int = 10
    RATE_LIMIT_API_PER_MINUTE: int = 100

    # SMS Gateway Configuration
    SMS_PROVIDER: str = "mock"  # "mock", "twilio", "fast2sms", "2factor"
    SMS_API_KEY: str = ""
    SMS_SENDER_ID: str = "AURAHM"

    # WhatsApp Business API Configuration
    WHATSAPP_API_ENABLED: bool = False
    WHATSAPP_API_URL: str = "https://graph.facebook.com/v18.0"
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    WHATSAPP_ACCESS_TOKEN: str = ""


settings = Settings()
