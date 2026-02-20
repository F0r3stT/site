from fastapi import APIRouter
from . import auth, orders, users, products, bom

router = APIRouter(prefix="/v1")

router.include_router(auth.router)
router.include_router(users.router)
router.include_router(orders.router)
router.include_router(products.router)
router.include_router(bom.router)