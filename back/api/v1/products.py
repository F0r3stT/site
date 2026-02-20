from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from core.database import get_db
from core.dependencies import get_current_user, require_admin
from schemas.product import ProductCreate, ProductUpdate, ProductResponse
from repositories.product_repo import ProductRepository

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=List[ProductResponse])
async def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None,
    in_stock_only: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """List products with optional filters"""
    repo = ProductRepository(db)
    
    if search:
        products = await repo.search_products(search, skip, limit)
    elif in_stock_only:
        products = await repo.get_in_stock(skip, limit)
    else:
        products = await repo.get_multi(skip=skip, limit=limit)
    
    return [ProductResponse.model_validate(p) for p in products]


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get product by ID"""
    repo = ProductRepository(db)
    product = await repo.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductResponse.model_validate(product)


# Admin endpoints
@router.post("", response_model=ProductResponse)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin)
):
    """Create new product (admin only)"""
    repo = ProductRepository(db)
    product = await repo.create(**data.model_dump())
    return ProductResponse.model_validate(product)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin)
):
    """Update product (admin only)"""
    repo = ProductRepository(db)
    product = await repo.update(product_id, **data.model_dump(exclude_unset=True))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductResponse.model_validate(product)


@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin)
):
    """Delete product (admin only)"""
    repo = ProductRepository(db)
    success = await repo.delete(product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}