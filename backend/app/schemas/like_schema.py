# app/schemas/like_schema.py
from pydantic import BaseModel
from datetime import datetime

class ProductLikeBase(BaseModel):
    product_id: int

class ProductLikeCreate(ProductLikeBase):
    user_id: int

class ProductLikeResponse(ProductLikeBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True