from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import jwt
import secrets
import hashlib
import hmac

from core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash password"""
    return pwd_context.hash(password)


def create_access_token(data: Dict[str, Any]) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    to_encode.update({
        "typ": "access",
        "exp": datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    })
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: Dict[str, Any]) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    to_encode.update({
        "typ": "refresh",
        "exp": datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    })
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def hash_token(token: str) -> str:
    """Hash token for storage"""
    return hashlib.sha256(token.encode()).hexdigest()


def generate_otp_code() -> str:
    """Generate 6-digit OTP code"""
    return f"{secrets.randbelow(1000000):06d}"


def hash_otp(code: str, pepper: str) -> str:
    """Hash OTP code with pepper"""
    combined = f"{code}:{pepper}"
    return hashlib.sha256(combined.encode()).hexdigest()


def verify_otp(code: str, hashed: str, pepper: str) -> bool:
    """Verify OTP code"""
    expected = hash_otp(code, pepper)
    return hmac.compare_digest(expected, hashed)