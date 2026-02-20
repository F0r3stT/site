from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

from .user import UserResponse


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserResponse


class OTPVerifyRequest(BaseModel):
    challenge_id: str
    code: str


class OTPResendRequest(BaseModel):
    challenge_id: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str