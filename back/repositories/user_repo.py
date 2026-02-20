from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.repositories.base import BaseRepository
from app.models.user import User


class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)
    
    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    async def mark_email_verified(self, user_id: str) -> None:
        await self.update(user_id, email_verified=True)
    
    async def update_password(self, user_id: str, password_hash: str) -> None:
        await self.update(user_id, password_hash=password_hash)