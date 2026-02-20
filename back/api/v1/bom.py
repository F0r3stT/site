from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from core.database import get_db
from core.dependencies import get_current_user
from schemas.bom import BOMItemResponse, BOMUploadResponse
from services.bom_service import BOMService

router = APIRouter(prefix="/bom", tags=["BOM"])


@router.post("/parse", response_model=List[dict])
async def parse_bom_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user)
):
    """Parse BOM file and return raw items"""
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(400, "Only Excel/CSV files allowed")
    
    content = await file.read()
    service = BOMService(db)
    
    try:
        items = await service.parse_excel(content)
        return items
    except Exception as e:
        raise HTTPException(400, f"Failed to parse BOM: {str(e)}")


@router.post("/match", response_model=List[dict])
async def match_bom_items(
    items: List[dict],
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user)
):
    """Match BOM items with products"""
    service = BOMService(db)
    matched = await service.match_products(items)
    return matched