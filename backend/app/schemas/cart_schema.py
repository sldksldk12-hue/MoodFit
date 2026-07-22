# app/schemas/cart_schema.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CartItemBase(BaseModel):
    product_id: int
    quantity: int = 1
    selected_size: Optional[str] = None
    selected_color: Optional[str] = None

class CartItemCreate(CartItemBase):
    user_id: int

class CartItemResponse(CartItemBase):
    id: int
    user_id: int
    # Null 데이터에 의해 FastAPI가 500 에러를 뱉는 것을 방지하기 위해 Optional 처리
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CartItemQuantityUpdate(BaseModel):
    user_id: int
    quantity: int