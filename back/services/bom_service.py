import pandas as pd
from typing import List, Dict
from fuzzywuzzy import fuzz
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.product_repo import ProductRepository
from app.schemas.bom import BOMItemCreate, BOMItemResponse


class BOMService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.product_repo = ProductRepository(db)
    
    async def parse_excel(self, file_content: bytes) -> List[Dict]:
        """Parse Excel BOM file"""
        df = pd.read_excel(file_content)
        
        # Try to find columns
        part_col = None
        desc_col = None
        qty_col = None
        
        for col in df.columns:
            col_lower = str(col).lower()
            if any(x in col_lower for x in ['part', 'pn', 'mpn']):
                part_col = col
            elif any(x in col_lower for x in ['desc', 'name', 'description']):
                desc_col = col
            elif any(x in col_lower for x in ['qty', 'quantity', 'count']):
                qty_col = col
        
        if not part_col or not qty_col:
            raise ValueError("Could not find required columns (Part Number, Quantity)")
        
        items = []
        for _, row in df.iterrows():
            items.append({
                "part_number": str(row[part_col]).strip(),
                "description": str(row[desc_col]).strip() if desc_col else "",
                "quantity": int(row[qty_col]) if pd.notna(row[qty_col]) else 0
            })
        
        return items
    
    async def match_products(self, items: List[Dict]) -> List[Dict]:
        """Match BOM items with products in database"""
        all_products = await self.product_repo.get_all_active()
        
        results = []
        for item in items:
            best_match = None
            best_score = 0
            
            for product in all_products:
                # Search in part number
                score = fuzz.ratio(item["part_number"].upper(), product.part_number.upper())
                
                # Search in keywords
                if product.keywords:
                    for keyword in product.keywords.split():
                        kw_score = fuzz.partial_ratio(item["part_number"].upper(), keyword.upper())
                        score = max(score, kw_score)
                
                # Search in cross reference
                if product.cross_reference:
                    for ref in product.cross_reference.split():
                        ref_score = fuzz.ratio(item["part_number"].upper(), ref.upper())
                        score = max(score, ref_score)
                
                if score > best_score and score > 70:  # Threshold
                    best_score = score
                    best_match = product
            
            if best_match:
                status = "in_stock" if best_match.quantity_local > 0 else "order_only"
                results.append({
                    **item,
                    "matched_product": best_match,
                    "status": status,
                    "match_score": best_score
                })
            else:
                results.append({
                    **item,
                    "status": "not_found"
                })
        
        return results