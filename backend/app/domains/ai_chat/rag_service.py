# backend/app/domains/ai_chat/rag_service.py
import os
import requests # 외부 API 통신을 위한 패키지 추가
from sqlalchemy.orm import Session
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# WeatherLog 모델을 추가로 임포트
from app.models.models import User, EmotionLog, WeatherLog 

class RagsFashionService:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7,
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        
        # OpenWeather API 키 (발급받은 키를 여기에 넣거나 .env에 추가하세요)
        self.weather_api_key = os.getenv("OPENWEATHER_API_KEY")
        
        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", """당신은 유저의 기분과 날씨, 패션 취향을 분석하여 최적의 코디를 제안하는 퍼스널 쇼퍼이자 패션 테라피스트 AI 'MoodFit'입니다.

[현재 환경 정보]
- 유저의 오늘 기분/감정: {emotion} (확신도: {confidence}%)
- 현재 날씨 및 기온: {weather}

[유저 패션 프로필]
- 선호하는 스타일: {preferred_style}
- ⚠️ 절대 추천하면 안 되는 기피 색상 (하드 필터링 제약 조건): {disliked_colors}

[답변 작성 가이드]
1. 유저의 현재 감정에 깊이 공감해주며, 오늘 날씨에 적합한 활동적인 멘트로 시작하세요. (비나 눈이 온다면 그에 맞는 아이템을 꼭 추천하세요)
2. 유저가 선호하는 스타일에 부합하는 구체적인 상의, 하의, 아우터, 신발 조합을 추천하세요.
3. **매우 중요**: 유저가 기피하는 색상({disliked_colors})은 옷, 신발, 액세서리 등 추천 목록의 그 어떤 곳에도 절대 포함되어서는 안 됩니다.
4. 오늘 코디에 어울리는 '행운의 아이템'이나 '컬러 팁'을 하나 제안하며 마무리하세요.
5. 친근하면서도 전문적인 톤앤매너(해요체)를 유지하세요."""),
            ("human", "{user_message}")
        ])
        
        self.chain = self.prompt_template | self.llm | StrOutputParser()

    # 실시간 날씨를 가져오는 전용 함수
    def get_real_weather(self) -> dict:
        city = "Seoul"
        try:
            # units=metric(섭씨), lang=kr(한국어 설명)
            url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={self.weather_api_key}&units=metric&lang=kr"
            response = requests.get(url)
            
            if response.status_code == 200:
                data = response.json()
                temp = data["main"]["temp"]
                desc = data["weather"][0]["description"]
                return {"temp": temp, "desc": desc, "region": city}
            else:
                print(f"⚠️ 날씨 API 호출 실패: {response.status_code}")
        except Exception as e:
            print(f"⚠️ 날씨 API 에러: {e}")

        # API 키가 없거나 실패했을 때 서버가 죽지 않도록 방어(Fallback)
        return {"temp": 22.0, "desc": "맑음(기본값)", "region": "Seoul"}

    # 파라미터에 session_id 추가 (날씨 로그를 DB에 남기기 위함)
    def generate_fashion_recommendation(self, db: Session, user_id: int, emotion: str, confidence: float, user_message: str, session_id: int = None) -> str:
        
        # 1. 찐 날씨 API 호출 및 문자열 포매팅
        weather_data = self.get_real_weather()
        current_weather = f"섭씨 {weather_data['temp']}도, {weather_data['desc']}"
        print(f"☁️ 현재 적용된 날씨: {current_weather}")

        try:
            # 2. 날씨 로그를 DB(weather_logs)에 꼼꼼하게 저장!
            if session_id:
                new_weather_log = WeatherLog(
                    session_id=session_id,
                    region_name=weather_data['region'],
                    temperature=weather_data['temp'],
                    condition_code=weather_data['desc']
                )
                db.add(new_weather_log)
                db.commit()
        except Exception as e:
            db.rollback()
            print(f"⚠️ DB 날씨 로그 저장 실패: {e}")

        # 3. 유저 취향 DB 조회
        preferred_style = "캐주얼(Casual)" 
        disliked_colors = "없음"
        
        try:
            user_info = db.query(User).filter(User.id == user_id).first()
            if user_info:
                if hasattr(user_info, 'preferred_styles') and user_info.preferred_styles:
                    preferred_style = user_info.preferred_styles
                if hasattr(user_info, 'disliked_colors') and user_info.disliked_colors:
                    disliked_colors = user_info.disliked_colors
        except Exception as e:
            print(f"⚠️ DB 프로필 조회 실패: {e}")

        # 4. 랭체인 프롬프트 주입 및 실행
        response = self.chain.invoke({
            "emotion": emotion,
            "confidence": f"{confidence * 100:.1f}",
            "weather": current_weather,
            "preferred_style": preferred_style,
            "disliked_colors": disliked_colors,
            "user_message": user_message
        })

        return response