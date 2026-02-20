from app.core.config import settings
from app.schemas.order import PCBPriceRequest, PCBPriceResponse


class PCBPriceCalculator:
    def __init__(self):
        self.engineering_fee = settings.ENGINEERING_FEE
        self.material_rate = settings.MATERIAL_RATE
    
    def calculate(self, data: PCBPriceRequest) -> PCBPriceResponse:
        # Area in cm²
        area_cm2 = (data.width * data.height) / 100
        
        # Layer multiplier
        if data.layers == 4:
            layer_mult = settings.LAYER_MULTI_4
        elif data.layers == 6:
            layer_mult = settings.LAYER_MULTI_6
        else:
            layer_mult = 1.0
        
        # Color fee
        color_fees = {
            "green": 0,
            "blue": settings.COLOR_FEE_BLUE,
            "red": settings.COLOR_FEE_RED,
            "black": settings.COLOR_FEE_BLACK,
            "white": settings.COLOR_FEE_WHITE,
            "yellow": settings.COLOR_FEE_YELLOW,
        }
        color_fee = color_fees.get(data.color.value, 0)
        
        # Base calculation
        material_cost = area_cm2 * data.quantity * self.material_rate
        base_price = self.engineering_fee + material_cost
        
        # Apply multipliers
        total = base_price * layer_mult
        total += color_fee * data.quantity
        
        # Urgent multiplier
        if data.urgent:
            total *= settings.URGENT_MULTI
        
        # Round up to 100 AMD
        total_amd = int((total + 99) // 100 * 100)
        
        return PCBPriceResponse(
            base_price=base_price,
            engineering_fee=self.engineering_fee,
            material_cost=material_cost,
            layer_multiplier=layer_mult,
            color_fee=color_fee * data.quantity,
            urgent_multiplier=settings.URGENT_MULTI if data.urgent else 1.0,
            total=total,
            total_amd=total_amd
        )