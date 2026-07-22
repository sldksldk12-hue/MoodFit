# app/schemas/inquiry_schema.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# 클라이언트 -> 서버 (문의 작성 요청)
class InquiryCreate(BaseModel):
    user_id: int
    product_id: int
    title: str
    content: str

# 서버 -> 클라이언트 (문의 내역 응답)
class InquiryResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    title: str
    content: str
    reply_content: Optional[str] = None
    inq_status: str
    created_at: datetime
    replied_at: Optional[datetime] = None

    # SQLAlchemy 모델을 Pydantic으로 자동 변환
    class Config:
        from_attributes = True