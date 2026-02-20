from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_
from typing import List, Optional, Dict, Any
from datetime import datetime

from repositories.base import BaseRepository
from models.order import Order, OrderStatus
from models.order_file import OrderFile
from models.bom_item import BOMItem


class OrderRepository(BaseRepository[Order]):
    def __init__(self, db: AsyncSession):
        super().__init__(Order, db)
    
    async def get_user_orders(
        self, 
        user_id: str, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Order]:
        query = select(Order).where(
            Order.customer_id == user_id
        ).order_by(Order.created_at.desc()).offset(skip).limit(limit)
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_order_with_files(self, order_id: str, user_id: str) -> Optional[Order]:
        query = select(Order).where(
            and_(
                Order.id == order_id,
                Order.customer_id == user_id
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def update_status(self, order_id: str, status: OrderStatus) -> bool:
        result = await self.db.execute(
            update(Order)
            .where(Order.id == order_id)
            .values(status=status, updated_at=datetime.utcnow())
        )
        await self.db.commit()
        return result.rowcount > 0
    
    async def add_file(self, order_id: str, file_data: Dict[str, Any]) -> OrderFile:
        file = OrderFile(order_id=order_id, **file_data)
        self.db.add(file)
        await self.db.commit()
        await self.db.refresh(file)
        return file
    
    async def get_order_files(self, order_id: str) -> List[OrderFile]:
        query = select(OrderFile).where(OrderFile.order_id == order_id)
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def save_bom_items(self, order_id: str, items: List[Dict]) -> List[BOMItem]:
        saved = []
        for item in items:
            bom_item = BOMItem(order_id=order_id, **item)
            self.db.add(bom_item)
            saved.append(bom_item)
        
        await self.db.commit()
        for item in saved:
            await self.db.refresh(item)
        
        return saved