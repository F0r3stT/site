from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class BOMStatus(str, enum.Enum):
    IN_STOCK = "in_stock"
    ORDER_ONLY = "order_only"
    REPLACEMENT_SUGGESTED = "replacement_suggested"
    NOT_FOUND = "not_found"


class BOMItem(Base):
    __tablename__ = "bom_items"
    
    id = Column(String, primary_key=True, index=True)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    
    # Original BOM data
    original_part_number = Column(String, nullable=False)
    original_description = Column(String, nullable=True)
    quantity = Column(Integer, nullable=False)
    
    # Matched product
    matched_product_id = Column(String, ForeignKey("products.id"), nullable=True)
    matched_part_number = Column(String, nullable=True)
    
    # Status
    status = Column(Enum(BOMStatus), default=BOMStatus.NOT_FOUND)
    
    # Pricing
    unit_price = Column(Float, nullable=True)
    total_price = Column(Float, nullable=True)
    
    # Replacement info
    suggested_replacement_id = Column(String, ForeignKey("products.id"), nullable=True)
    replacement_accepted = Column(Boolean, default=False)
    
    # Relationships
    order = relationship("Order", back_populates="bom_items")
    matched_product = relationship("Product", foreign_keys=[matched_product_id])
    suggested_replacement = relationship("Product", foreign_keys=[suggested_replacement_id])