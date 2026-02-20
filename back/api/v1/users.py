from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from schemas.user import UserResponse, UserUpdate, ChangePasswordRequest
from services.user_service import UserService
from repositories.user_repo import UserRepository
from core.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/profile", response_model=UserResponse)
async def get_profile(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user profile"""
    return UserResponse.model_validate(current_user)


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    data: UserUpdate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user profile"""
    service = UserService(db)
    updated = await service.update_profile(current_user.id, data)
    return UserResponse.model_validate(updated)


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Change user password"""
    service = UserService(db)
    await service.change_password(
        current_user.id, 
        data.current_password, 
        data.new_password
    )
    return {"message": "Password updated successfully"}