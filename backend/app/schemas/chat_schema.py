from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ChatRequest(BaseModel):
    user_id: int = 1 
    message: str
    session_id: Optional[int] = None  # 선택 사항: 기존 대화를 이어가고 싶을 때 넘겨받을 세션 ID
    
# AI에게 요구할 답변 양식 (JSON 구조)
class AIResponseSchema(BaseModel):
    search_keyword: str = Field(
        description="네이버 쇼핑에서 검색할 가장 핵심적인 옷 키워드 딱 1개 (예: '여성 오버핏 가디건', '남성 와이드 데님 팬츠')"
    )
    
# 요청(Request): 장바구니에 담을 때 필요한 정보들
class CartItemCreate(BaseModel):
    user_id: int
    product_id: int
    quantity: int = 1
    selected_size: str
    selected_color: Optional[str] = None

# 응답(Response): DB에서 꺼내서 보여줄 정보들
class CartItemResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    quantity: int
    selected_size: str
    selected_color: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True