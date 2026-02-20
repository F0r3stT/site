from pydantic import BaseModel
from typing import Optional, List
from app.models.bom_item import BOMStatus


class BOMItemBase(BaseModel):
    original_part_number: str
    original_description: Optional[str] = None
    quantity: int


class BOMItemCreate(BOMItemBase):
    pass


class BOMItemResponse(BOMItemBase):
    id: str
    order_id: str
    status: BOMStatus
    matched_part_number: Optional[str] = None
    unit_price: Optional[float] = None
    total_price: Optional[float] = None
    suggested_replacement_id: Optional[str] = None
    
    class Config:
        from_attributes = True


class BOMUploadResponse(BaseModel):
    items: List[BOMItemResponse]
    summary: dict