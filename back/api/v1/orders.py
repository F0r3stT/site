from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.order import OrderCreate, OrderResponse, PCBPriceRequest, PCBPriceResponse
from app.schemas.bom import BOMUploadResponse
from app.services.order_service import OrderService
from app.services.pcb_calculator import PCBPriceCalculator
from app.services.bom_service import BOMService

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("", response_model=List[OrderResponse])
async def list_orders(
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List user orders"""
    service = OrderService(db)
    return await service.get_user_orders(current_user.id, skip, limit)


@router.post("", response_model=OrderResponse)
async def create_order(
    order_data: OrderCreate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create new order"""
    service = OrderService(db)
    return await service.create_order(current_user.id, order_data)


@router.post("/price", response_model=PCBPriceResponse)
async def calculate_price(
    data: PCBPriceRequest
):
    """Calculate PCB price"""
    calculator = PCBPriceCalculator()
    return calculator.calculate(data)


@router.post("/{order_id}/files")
async def upload_order_file(
    order_id: str,
    file: UploadFile = File(...),
    file_type: str = Form("other"),
    description: str = Form(""),
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload file to order"""
    service = OrderService(db)
    return await service.upload_file(
        order_id, 
        current_user.id, 
        file, 
        file_type, 
        description
    )


@router.post("/{order_id}/bom", response_model=BOMUploadResponse)
async def upload_bom(
    order_id: str,
    file: UploadFile = File(...),
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload and process BOM file"""
    service = OrderService(db)
    bom_service = BOMService(db)
    
    # Read file
    content = await file.read()
    
    # Parse Excel
    items = await bom_service.parse_excel(content)
    
    # Match with products
    matched = await bom_service.match_products(items)
    
    # Save to order
    result = await service.save_bom_items(order_id, current_user.id, matched)
    
    return result


@router.delete("/{order_id}")
async def delete_order(
    order_id: str,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete draft order"""
    service = OrderService(db)
    await service.delete_order(order_id, current_user.id, current_user.role)
    return {"message": "Order deleted"}