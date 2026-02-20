from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base


class Product(Base):
    __tablename__ = "products"
    
    id = Column(String, primary_key=True, index=True)
    part_number = Column(String, unique=True, index=True, nullable=False)
    manufacturer = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    
    # Stock
    quantity_local = Column(Integer, default=0)  # Yerevan stock
    quantity_global = Column(Integer, default=0)  # China warehouse
    
    # Pricing
    purchase_price = Column(Float, nullable=False)
    selling_price = Column(Float, nullable=False)
    
    # Search
    keywords = Column(Text, nullable=True)  # Space-separated search terms
    cross_reference = Column(Text, nullable=True)  # Alternative part numbers
    
    # Status
    is_active = Column(Boolean, default=True)
    in_stock_local = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())