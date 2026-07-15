# backend/app/domains/ai_chat/rag_service.py
import os
import requests
from sqlalchemy.orm import Session
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder # 🌟 메모리용 모듈 추가
from langchain_core.messages import HumanMessage, AIMessage # 🌟 대화 타입 지정용 모듈 추가
from langchain_core.output_parsers import StrOutputParser

# 🌟 ChatMessage 모델 추가
from app.models.models import User, EmotionLog, WeatherLog, ChatMessage 

class RagsFashionService:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7,
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        self.weather_api_key = os.getenv("OPENWEATHER_API_KEY")
        
        # 🌟 시스템 메시지와 유저 메시지 사이에 'chat_history'라는 기억 장치 추가
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
2. 이전 대화 문맥(chat_history)을 완벽히 파악하고, 유저가 변경을 원한다면 이전 코디를 바탕으로 수정해서 제안하세요.
3. **매우 중요**: 유저가 기피하는 색상({disliked_colors})은 옷, 신발, 액세서리 등 추천 목록의 그 어떤 곳에도 절대 포함되어서는 안 됩니다.
4. 친근하면서도 전문적인 톤앤매너(해요체)를 유지하세요."""),
            MessagesPlaceholder(variable_name="chat_history"), # 이전 대화가 들어가는 자리
            ("human", "{user_message}")
        ])
        
        self.chain = self.prompt_template | self.llm | StrOutputParser()

    def get_real_weather(self) -> dict:
        city = "Seoul"
        try:
            url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={self.weather_api_key}&units=metric&lang=kr"
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                return {"temp": data["main"]["temp"], "desc": data["weather"][0]["description"], "region": city}
        except Exception as e:
            print(f"⚠️ 날씨 API 에러: {e}")
        return {"temp": 22.0, "desc": "맑음(기본값)", "region": "Seoul"}

    def generate_fashion_recommendation(self, db: Session, user_id: int, emotion: str, confidence: float, user_message: str, session_id: int = None) -> str:
        
        weather_data = self.get_real_weather()
        current_weather = f"섭씨 {weather_data['temp']}도, {weather_data['desc']}"
        
        # 🌟 1. DB에서 이전 대화(기억) 긁어오기
        chat_history = []
        if session_id:
            try:
                past_messages = db.query(ChatMessage).filter(
                    ChatMessage.session_id == session_id
                ).order_by(ChatMessage.created_at.asc()).all()
                
                for msg in past_messages:
                    if msg.sender_type == "USER":
                        # 단, 방금 유저가 보낸 메시지는 빼야 합니다. (아래 human에 들어가니까)
                        if msg.message_text != user_message: 
                            chat_history.append(HumanMessage(content=msg.message_text))
                    elif msg.sender_type == "AI":
                        chat_history.append(AIMessage(content=msg.message_text))
            except Exception as e:
                print(f"⚠️ 대화 기록 불러오기 실패: {e}")

        # 2. 날씨 기록
        try:
            if session_id:
                new_weather_log = WeatherLog(
                    session_id=session_id, region_name=weather_data['region'],
                    temperature=weather_data['temp'], condition_code=weather_data['desc']
                )
                db.add(new_weather_log)
                db.commit()
        except Exception as e:
            db.rollback()

        # 3. 취향 조회
        preferred_style, disliked_colors = "캐주얼(Casual)", "없음"
        try:
            user_info = db.query(User).filter(User.id == user_id).first()
            if user_info:
                preferred_style = user_info.preferred_styles or preferred_style
                disliked_colors = user_info.disliked_colors or disliked_colors
        except Exception:
            pass

        # 4. 프롬프트에 chat_history 주입!
        response = self.chain.invoke({
            "emotion": emotion,
            "confidence": f"{confidence * 100:.1f}",
            "weather": current_weather,
            "preferred_style": preferred_style,
            "disliked_colors": disliked_colors,
            "chat_history": chat_history, # 히스토리 저장
            "user_message": user_message
        })

        return response