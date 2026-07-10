# backend/app/domains/ai_chat/rag_service.py
import os
from sqlalchemy.orm import Session
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# User 대신 취향 정보가 있는 UserPreference 모델을 임포트
from app.models.models import UserPreference, EmotionLog 

class RagsFashionService:
    def __init__(self):
        # 1. OpenAI LLM 초기화
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7,
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        
        # 2. LangChain 프롬프트 템플릿 정의
        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", """당신은 유저의 기분과 날씨, 패션 취향을 분석하여 최적의 코디를 제안하는 퍼스널 쇼퍼이자 패션 테라피스트 AI 'MoodFit'입니다.

[현재 환경 정보]
- 유저의 오늘 기분/감정: {emotion} (확신도: {confidence}%)
- 현재 날씨 및 기온: {weather}

[유저 패션 프로필]
- 선호하는 스타일: {preferred_style}
- ⚠️ 절대 추천하면 안 되는 기피 색상 (하드 필터링 제약 조건): {disliked_colors}

[답변 작성 가이드]
1. 유저의 현재 감정에 깊이 공감해주며, 오늘 날씨에 적합한 활동적인 멘트로 시작하세요.
2. 유저가 선호하는 스타일에 부합하는 구체적인 상의, 하의, 아우터, 신발 조합을 추천하세요.
3. **매우 중요**: 유저가 기피하는 색상({disliked_colors})은 옷, 신발, 액세서리 등 추천 목록의 그 어떤 곳에도 절대 포함되어서는 안 됩니다.
4. 오늘 코디에 어울리는 '행운의 아이템'이나 '컬러 팁'을 하나 제안하며 마무리하세요.
5. 친근하면서도 전문적인 톤앤매너(해요체)를 유지하세요."""),
            ("human", "{user_message}")
        ])
        
        # 3. LangChain 표현식(LCEL)을 이용한 체인 구성
        self.chain = self.prompt_template | self.llm | StrOutputParser()

    def generate_fashion_recommendation(self, db: Session, user_id: int, emotion: str, confidence: float, user_message: str) -> str:
        # [기본값 설정] DB 조회를 실패했을 때를 대비한 안전망
        preferred_style = "캐주얼(Casual)" 
        disliked_colors = "없음"
        current_weather = "섭씨 22도, 맑음"

        try:
            # 진짜 DB(UserPreference)에서 유저 아이디로 취향 정보를 가져오기
            user_pref = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
            
            if user_pref:
                # DB 설계도와 정확히 일치하는 이름(preferred_styles - s붙음)으로 매핑
                if hasattr(user_pref, 'preferred_styles') and user_pref.preferred_styles:
                    preferred_style = user_pref.preferred_styles
                if hasattr(user_pref, 'disliked_colors') and user_pref.disliked_colors:
                    disliked_colors = user_pref.disliked_colors
                    
        except Exception as e:
            print(f"⚠️ DB 프로필 조회 실패(기본값 사용): {e}")

        # 4. 랭체인 실행 (진짜 DB에서 user1 스트릿 스타일 & 검정색 기피 조건)
        response = self.chain.invoke({
            "emotion": emotion,
            "confidence": f"{confidence * 100:.1f}",
            "weather": current_weather,
            "preferred_style": preferred_style,
            "disliked_colors": disliked_colors,
            "user_message": user_message
        })

        return response