from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class OrderStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    IN_REVIEW = "in_review"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    QUOTED = "quoted"
    PAID = "paid"
    PRODUCTION = "production"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PCBColor(str, enum.Enum):
    GREEN = "green"
    BLUE = "blue"
    RED = "red"
    BLACK = "black"
    WHITE = "white"
    YELLOW = "yellow"


class Order(Base):
    __tablename__ = "orders"
    
    id = Column(String, primary_key=True, index=True)
    customer_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Basic info
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(Enum(OrderStatus), default=OrderStatus.DRAFT)
    
    # PCB specs
    pcb_quantity = Column(Integer, nullable=False)
    pcb_width = Column(Float, nullable=False)
    pcb_height = Column(Float, nullable=False)
    layer_count = Column(Integer, nullable=False)
    material = Column(String, nullable=True)
    smt_required = Column(Boolean, default=False)
    
    # PCB config
    pcb_color = Column(Enum(PCBColor), default=PCBColor.GREEN)
    pcb_thickness = Column(Float, default=1.6)
    silkscreen = Column(String, default="white")
    urgent = Column(Boolean, default=False)
    
    # Pricing
    base_price = Column(Float, nullable=True)
    final_price = Column(Float, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    customer = relationship("User", foreign_keys=[customer_id])
    files = relationship("OrderFile", back_populates="order", cascade="all, delete-orphan")
    bom_items = relationship("BOMItem", back_populates="order", cascade="all, delete-orphan")