from pydantic import BaseModel, Field
from typing import Optional

class ChatRequest(BaseModel):
    user_id: int = 1 
    message: str
    session_id: Optional[int] = None  # 선택 사항: 기존 대화를 이어가고 싶을 때 넘겨받을 세션 ID
    
# AI에게 요구할 답변 양식 (JSON 구조)
class AIResponseSchema(BaseModel):
    search_keyword: str = Field(description="네이버 쇼핑 검색을 위한 의류/잡화 쇼핑 키워드 (쉼표로 구분)")
    # AI가 3줄 요약 문구를 담아줄 수 있도록 아래 필드가 반드시 있어야 합니다!
    summary_reason: str = Field(
        description="이 코디를 추천하는 핵심 이유를 친근한 말투로 3줄 요약한 문장", 
        default="추천 이유를 불러오는 중입니다."
    )