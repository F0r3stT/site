from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_
from datetime import datetime
from typing import Optional

from repositories.base import BaseRepository
from models.login_otp import LoginOTPChallenge


class OTPRepository(BaseRepository[LoginOTPChallenge]):
    def __init__(self, db: AsyncSession):
        super().__init__(LoginOTPChallenge, db)
    
    async def get_by_id(self, challenge_id: str) -> Optional[LoginOTPChallenge]:
        return await self.get(challenge_id)
    
    async def consume_all_active_by_user(self, user_id: str) -> None:
        await self.db.execute(
            update(LoginOTPChallenge)
            .where(
                and_(
                    LoginOTPChallenge.user_id == user_id,
                    LoginOTPChallenge.consumed_at.is_(None),
                    LoginOTPChallenge.expires_at > datetime.utcnow()
                )
            )
            .values(consumed_at=datetime.utcnow())
        )
        await self.db.commit()
    
    async def increment_attempts(self, challenge_id: str) -> int:
        result = await self.db.execute(
            update(LoginOTPChallenge)
            .where(LoginOTPChallenge.id == challenge_id)
            .values(attempts=LoginOTPChallenge.attempts + 1)
            .returning(LoginOTPChallenge.attempts)
        )
        await self.db.commit()
        return result.scalar_one()
    
    async def consume(self, challenge_id: str) -> bool:
        result = await self.db.execute(
            update(LoginOTPChallenge)
            .where(
                and_(
                    LoginOTPChallenge.id == challenge_id,
                    LoginOTPChallenge.consumed_at.is_(None)
                )
            )
            .values(consumed_at=datetime.utcnow())
        )
        await self.db.commit()
        return result.rowcount > 0
    
    async def update_for_resend(
        self, 
        challenge_id: str, 
        new_hash: str, 
        new_expires: datetime
    ) -> int:
        result = await self.db.execute(
            update(LoginOTPChallenge)
            .where(
                and_(
                    LoginOTPChallenge.id == challenge_id,
                    LoginOTPChallenge.consumed_at.is_(None)
                )
            )
            .values(
                code_hash=new_hash,
                expires_at=new_expires,
                send_count=LoginOTPChallenge.send_count + 1,
                last_sent_at=datetime.utcnow()
            )
            .returning(LoginOTPChallenge.send_count)
        )
        await self.db.commit()
        return result.scalar_one()