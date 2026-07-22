# app/schemas/review_schema.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Union, List

# 클라이언트 -> 서버 (리뷰 작성 요청)
class ReviewCreate(BaseModel):
    user_id: int
    product_id: int
    order_item_id: int
    rating: float
    content: str
    image_url: Optional[Union[dict, list]] = None

# 서버 -> 클라이언트 (리뷰 내역 응답)
class ReviewResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    order_item_id: int
    rating: float
    content: str
    image_url: Optional[Union[dict, list]] = None
    created_at: datetime

    class Config:
        from_attributes = True