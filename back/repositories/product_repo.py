from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional

from repositories.base import BaseRepository
from models.product import Product


class ProductRepository(BaseRepository[Product]):
    def __init__(self, db: AsyncSession):
        super().__init__(Product, db)
    
    async def get_by_part_number(self, part_number: str) -> Optional[Product]:
        query = select(Product).where(Product.part_number == part_number)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def search_products(
        self, 
        query: str, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Product]:
        search_term = f"%{query}%"
        
        stmt = select(Product).where(
            or_(
                Product.part_number.ilike(search_term),
                Product.description.ilike(search_term),
                Product.keywords.ilike(search_term),
                Product.cross_reference.ilike(search_term)
            )
        ).offset(skip).limit(limit)
        
        result = await self.db.execute(stmt)
        return result.scalars().all()
    
    async def get_in_stock(self, skip: int = 0, limit: int = 100) -> List[Product]:
        query = select(Product).where(
            Product.quantity_local > 0
        ).offset(skip).limit(limit)
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_all_active(self) -> List[Product]:
        query = select(Product).where(Product.is_active == True)
        result = await self.db.execute(query)
        return result.scalars().all()