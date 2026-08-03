from pydantic import BaseModel, Field
from typing import Optional

class ChatRequest(BaseModel):
    user_id: int = 1 
    message: str
    session_id: Optional[int] = None

class AIResponseSchema(BaseModel):
    search_keyword: str = Field(description="네이버 쇼핑 검색을 위한 의류/잡화 쇼핑 키워드 (쉼표로 구분)")
    summary_reason: str = Field(
        description="이 코디를 추천하는 핵심 이유를 친근한 말투로 3줄 요약한 문장", 
        default="추천 이유를 불러오는 중입니다."
    )
