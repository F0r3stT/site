from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_
from datetime import datetime
from typing import Optional

from repositories.base import BaseRepository
from models.refresh_token import RefreshToken


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    def __init__(self, db: AsyncSession):
        super().__init__(RefreshToken, db)
    
    async def save(
        self, 
        user_id: str, 
        token_hash: str, 
        expires_at: datetime
    ) -> RefreshToken:
        return await self.create(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at
        )
    
    async def exists_active(self, user_id: str, token_hash: str) -> bool:
        query = select(RefreshToken).where(
            and_(
                RefreshToken.user_id == user_id,
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at.is_(None),
                RefreshToken.expires_at > datetime.utcnow()
            )
        )
        result = await self.db.execute(query)
        return result.first() is not None
    
    async def revoke(self, user_id: str, token_hash: str) -> bool:
        result = await self.db.execute(
            update(RefreshToken)
            .where(
                and_(
                    RefreshToken.user_id == user_id,
                    RefreshToken.token_hash == token_hash,
                    RefreshToken.revoked_at.is_(None)
                )
            )
            .values(revoked_at=datetime.utcnow())
        )
        await self.db.commit()
        return result.rowcount > 0