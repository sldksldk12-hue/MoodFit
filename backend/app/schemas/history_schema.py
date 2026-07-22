# app/schemas/history_schema.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class HistoryCreate(BaseModel):
    user_id: int
    product_id: int

class HistoryResponse(BaseModel):
    product_id: int
    product_name: str
    brand: str
    discount_price: int
    image_url: Optional[str] = None
    viewed_at: datetime