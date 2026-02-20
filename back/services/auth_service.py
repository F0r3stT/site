import secrets
import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Optional, Tuple
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.repositories.user_repo import UserRepository
from app.repositories.otp_repo import OTPRepository
from app.repositories.refresh_token_repo import RefreshTokenRepository
from app.schemas.user import UserCreate, UserResponse
from app.schemas.auth import TokenResponse
from app.utils.mailer import send_otp_email
from app.utils.security import generate_otp_code, hash_otp, verify_password


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.otp_repo = OTPRepository(db)
        self.refresh_repo = RefreshTokenRepository(db)
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    async def register(self, user_data: UserCreate) -> Tuple[UserResponse, Optional[str]]:
        # Check if user exists
        existing = await self.user_repo.get_by_email(user_data.email)
        if existing:
            raise ValueError("Email already registered")
        
        # Hash password
        password_hash = self.pwd_context.hash(user_data.password)
        
        # Create user
        user = await self.user_repo.create(
            id=secrets.token_hex(16),
            email=user_data.email,
            password_hash=password_hash,
            role=user_data.role,
            company_name=user_data.company_name,
            country=user_data.country,
            phone=user_data.phone,
            email_verified=False
        )
        
        # Generate OTP if enabled
        challenge_id = None
        if settings.OTP_ENABLED:
            challenge_id = await self._create_otp_challenge(user.id, user.email)
        
        return UserResponse.model_validate(user), challenge_id
    
    async def _create_otp_challenge(self, user_id: str, email: str) -> str:
        code = generate_otp_code()
        code_hash = hash_otp(code, settings.OTP_PEPPER)
        
        challenge = await self.otp_repo.create(
            user_id=user_id,
            code_hash=code_hash,
            expires_at=datetime.utcnow() + timedelta(minutes=settings.OTP_TTL_MINUTES),
            max_attempts=settings.OTP_MAX_ATTEMPTS
        )
        
        await send_otp_email(email, code, settings.OTP_TTL_MINUTES)
        return challenge.id
    
    async def verify_otp(self, challenge_id: str, code: str) -> TokenResponse:
        challenge = await self.otp_repo.get_by_id(challenge_id)
        if not challenge:
            raise ValueError("Invalid challenge")
        
        # Check if consumed
        if challenge.consumed_at:
            raise ValueError("Code already used")
        
        # Check expiry
        if challenge.expires_at < datetime.utcnow():
            await self.otp_repo.consume(challenge.id)
            raise ValueError("Code expired")
        
        # Check attempts
        if challenge.attempts >= challenge.max_attempts:
            await self.otp_repo.consume(challenge.id)
            raise ValueError("Too many attempts")
        
        # Verify code
        expected_hash = hash_otp(code, settings.OTP_PEPPER)
        if not hmac.compare_digest(expected_hash, challenge.code_hash):
            await self.otp_repo.increment_attempts(challenge.id)
            raise ValueError("Invalid code")
        
        # Mark as consumed and verify user
        await self.otp_repo.consume(challenge.id)
        await self.user_repo.mark_email_verified(challenge.user_id)
        
        # Get user
        user = await self.user_repo.get(challenge.user_id)
        return await self._create_tokens(user)
    
    async def login(self, email: str, password: str) -> TokenResponse:
        user = await self.user_repo.get_by_email(email)
        if not user:
            raise ValueError("Invalid credentials")
        
        if not verify_password(password, user.password_hash):
            raise ValueError("Invalid credentials")
        
        if not user.email_verified:
            raise ValueError("Email not verified")
        
        return await self._create_tokens(user)
    
    async def _create_tokens(self, user) -> TokenResponse:
        # Access token
        access_token = jwt.encode(
            {
                "user_id": user.id,
                "role": user.role,
                "typ": "access",
                "exp": datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            },
            settings.JWT_SECRET,
            algorithm=settings.JWT_ALGORITHM
        )
        
        # Refresh token
        refresh_token = jwt.encode(
            {
                "user_id": user.id,
                "role": user.role,
                "typ": "refresh",
                "exp": datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
            },
            settings.JWT_SECRET,
            algorithm=settings.JWT_ALGORITHM
        )
        
        # Save refresh token hash
        refresh_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        await self.refresh_repo.save(
            user_id=user.id,
            token_hash=refresh_hash,
            expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user)
        )