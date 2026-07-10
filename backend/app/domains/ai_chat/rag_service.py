# backend/app/domains/ai_chat/rag_service.py
import os
from sqlalchemy.orm import Session
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# DB 모델 임포트 (기존에 정의된 모델 이름을 기반으로 고도화)
from app.models.models import User, EmotionLog  # 실제 선호도/날씨 테이블 이름에 맞게 조정 필요

class RagsFashionService:
    def __init__(self):
        # 1. OpenAI LLM 초기화 (GPT-4o-mini 같은 가성비 좋은 모델 추천)
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7,
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        
        # 2. LangChain 프롬프트 템플릿 정의 (감정, 날씨, 취향, 제약조건 결합)
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
        """
        DB에서 유저 취향과 날씨 정보를 가져와 LangChain RAG 워크플로우를 실행합니다.
        """
        # [하드 필터링 룰] 원래는 DB에서 해당 유저의 preference와 최신 weather_log를 조회해야 합니다.
        # 아직 데이터가 없는 경우를 대비해, 기본(Fallback) 데이터를 세팅하고 DB 조회를 시도합니다.
        preferred_style = "캐주얼(Casual)"
        disliked_colors = "레드(Red), 네온그린(Neon Green)"
        current_weather = "섭씨 24도, 조금 흐리고 선선한 바람이 부는 날씨"

        try:
            # 💡 [AI-Core 업무 정의 반영] 유저 취향 데이터 조회 예시
            user_prof = db.query(User).filter(User.id == user_id).first()
            if user_prof and hasattr(user_prof, 'preferred_style'):
                preferred_style = user_prof.preferred_style
                # 만약 기피 색상 필드가 있다면 가져옴
                disliked_colors = getattr(user_prof, 'disliked_colors', disliked_colors)
            
            # (선택 사항) 최신 날씨 로그 테이블이 있다면 쿼리해서 가동
            # latest_weather = db.query(WeatherLog).order_by(WeatherLog.id.desc()).first()
            # if latest_weather:
            #     current_weather = f"{latest_weather.status}, 기온 {latest_weather.temperature}℃"
        except Exception as e:
            print(f"⚠️ DB 가동 중 프로필 조회 실패(기본값 대체): {e}")

        # 4. 랭체인 실행 (동적 데이터 바인딩)
        response = self.chain.invoke({
            "emotion": emotion,
            "confidence": f"{confidence * 100:.1f}",
            "weather": current_weather,
            "preferred_style": preferred_style,
            "disliked_colors": disliked_colors,
            "user_message": user_message
        })

        return response