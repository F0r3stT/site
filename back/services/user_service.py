from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from repositories.user_repo import UserRepository
from schemas.user import UserUpdate, ChangePasswordRequest
from core.security import get_password_hash, verify_password


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = UserRepository(db)
    
    async def update_profile(self, user_id: str, data: UserUpdate):
        """Update user profile"""
        update_data = data.model_dump(exclude_unset=True)
        
        # Don't allow email change through this endpoint
        if "email" in update_data:
            del update_data["email"]
        
        user = await self.repo.update(user_id, **update_data)
        return user
    
    async def change_password(
        self, 
        user_id: str, 
        current_password: str, 
        new_password: str
    ):
        """Change user password"""
        user = await self.repo.get(user_id)
        if not user:
            raise ValueError("User not found")
        
        if not verify_password(current_password, user.password_hash):
            raise ValueError("Invalid current password")
        
        if len(new_password) < 8:
            raise ValueError("Password must be at least 8 characters")
        
        new_hash = get_password_hash(new_password)
        await self.repo.update_password(user_id, new_hash)