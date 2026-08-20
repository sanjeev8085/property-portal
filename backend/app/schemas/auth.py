"""Pydantic v2 schemas for Auth endpoints."""
from typing import Optional
from pydantic import BaseModel, field_validator
from app.models.user import UserType


class RegisterRequest(BaseModel):
    name: str
    email: Optional[str] = None
    mobile: Optional[str] = None
    password: Optional[str] = None
    city: Optional[str] = None
    user_type: Optional[UserType] = UserType.BUYER

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if v and len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str


class OTPSendRequest(BaseModel):
    mobile: str


class OTPVerifyRequest(BaseModel):
    mobile: str
    otp: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_type: UserType
    user_id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    city: Optional[str] = None


class GoogleAuthRequest(BaseModel):
    id_token: str

