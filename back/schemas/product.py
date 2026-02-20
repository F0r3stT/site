from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ProductBase(BaseModel):
    part_number: str
    manufacturer: Optional[str] = None
    description: Optional[str] = None
    quantity_local: int = 0
    quantity_global: int = 0
    purchase_price: float
    selling_price: float
    keywords: Optional[str] = None
    cross_reference: Optional[str] = None
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    part_number: Optional[str] = None
    manufacturer: Optional[str] = None
    description: Optional[str] = None
    quantity_local: Optional[int] = None
    quantity_global: Optional[int] = None
    purchase_price: Optional[float] = None
    selling_price: Optional[float] = None
    keywords: Optional[str] = None
    cross_reference: Optional[str] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    id: str
    in_stock_local: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True