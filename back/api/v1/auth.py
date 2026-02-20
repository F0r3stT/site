from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.auth import (
    UserCreate, 
    UserLogin, 
    TokenResponse, 
    OTPVerifyRequest,
    OTPResendRequest
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=dict)
async def register(
    user_data: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Register new user"""
    try:
        service = AuthService(db)
        user, challenge_id = await service.register(user_data)
        
        response = {"user": user.model_dump()}
        
        if challenge_id:
            response["verify_required"] = True
            response["challenge_id"] = challenge_id
            response["expires_at"] = datetime.utcnow() + timedelta(minutes=settings.OTP_TTL_MINUTES)
        
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """Login user"""
    try:
        service = AuthService(db)
        return await service.login(credentials.email, credentials.password)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/verify", response_model=TokenResponse)
async def verify_otp(
    data: OTPVerifyRequest,
    db: AsyncSession = Depends(get_db)
):
    """Verify OTP code"""
    try:
        service = AuthService(db)
        return await service.verify_otp(data.challenge_id, data.code)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))