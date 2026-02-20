import os
import shutil
import hashlib
from pathlib import Path
from datetime import datetime
from typing import List, Optional
from fastapi import UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import secrets

from repositories.order_repo import OrderRepository
from schemas.order import OrderCreate
from models.order import OrderStatus
from models.user import UserRole


class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = OrderRepository(db)
    
    async def create_order(self, user_id: str, data: OrderCreate):
        """Create new order"""
        order_data = data.model_dump()
        order_data.update({
            "id": secrets.token_hex(16),
            "customer_id": user_id,
            "status": OrderStatus.DRAFT
        })
        
        return await self.repo.create(**order_data)
    
    async def get_user_orders(self, user_id: str, skip: int, limit: int):
        """Get user orders"""
        return await self.repo.get_user_orders(user_id, skip, limit)
    
    async def get_order(self, order_id: str, user_id: str):
        """Get order by ID"""
        order = await self.repo.get_order_with_files(order_id, user_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return order
    
    async def upload_file(
        self, 
        order_id: str, 
        user_id: str, 
        file: UploadFile,
        file_type: str,
        description: str
    ):
        """Upload file to order"""
        # Verify order exists and belongs to user
        order = await self.get_order(order_id, user_id)
        
        # Check file size (50MB max)
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)
        
        if size > 50 * 1024 * 1024:
            raise HTTPException(400, "File too large (max 50MB)")
        
        # Create directory
        upload_dir = Path("uploads") / "orders" / order_id
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Save file
        filename = file.filename.replace(" ", "_")
        file_path = upload_dir / filename
        
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Calculate SHA256
        sha256 = hashlib.sha256(content).hexdigest()
        
        # Save to DB
        file_data = {
            "id": secrets.token_hex(16),
            "filename": filename,
            "file_type": file_type,
            "description": description,
            "file_url": f"/uploads/orders/{order_id}/{filename}",
            "file_size": size,
            "sha256": sha256
        }
        
        return await self.repo.add_file(order_id, file_data)
    
    async def delete_order(self, order_id: str, user_id: str, role: UserRole):
        """Delete order"""
        if role == UserRole.ADMIN:
            # Admin can delete any order
            order = await self.repo.get(order_id)
            if not order:
                raise HTTPException(404, "Order not found")
        else:
            # Regular users can only delete their draft orders
            order = await self.repo.get_order_with_files(order_id, user_id)
            if not order:
                raise HTTPException(404, "Order not found")
            
            if order.status != OrderStatus.DRAFT:
                raise HTTPException(400, "Only draft orders can be deleted")
        
        # Delete files
        upload_dir = Path("uploads") / "orders" / order_id
        if upload_dir.exists():
            shutil.rmtree(upload_dir)
        
        # Delete from DB
        await self.repo.delete(order_id)
    
    async def save_bom_items(self, order_id: str, user_id: str, items: List[dict]):
        """Save BOM items to order"""
        # Verify order
        await self.get_order(order_id, user_id)
        
        # Save items
        saved = await self.repo.save_bom_items(order_id, items)
        
        # Generate summary
        summary = {
            "total": len(saved),
            "in_stock": sum(1 for i in saved if i.status == "in_stock"),
            "order_only": sum(1 for i in saved if i.status == "order_only"),
            "not_found": sum(1 for i in saved if i.status == "not_found")
        }
        
        return {
            "items": saved,
            "summary": summary
        }