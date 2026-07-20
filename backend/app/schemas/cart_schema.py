# app/schemas/cart_schema.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# 공통 속성 정의
class CartItemBase(BaseModel):
    product_id: int
    quantity: int = 1
    selected_size: Optional[str] = None
    selected_color: Optional[str] = None

# 클라이언트 -> 서버 (장바구니 담기 요청 시)
class CartItemCreate(CartItemBase):
    user_id: int

# 서버 -> 클라이언트 (장바구니 목록 조회/응답 시)
class CartItemResponse(CartItemBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    # SQLAlchemy 모델 객체를 Pydantic 모델로 자동 변환하기 위한 설정
    class Config:
        from_attributes = True