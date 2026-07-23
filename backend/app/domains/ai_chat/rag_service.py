# backend/app/domains/ai_chat/rag_service.py
import os
import requests
from typing import Optional
from sqlalchemy.orm import Session
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder # 메모리용 모듈 추가
from langchain_core.messages import HumanMessage, AIMessage # 대화 타입 지정용 모듈 추가
from langchain_core.output_parsers import StrOutputParser

# ChatMessage 모델 추가
from app.models.models import User, EmotionLog, WeatherLog, ChatMessage, TourLog 

class RagsFashionService:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7,
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        self.weather_api_key = os.getenv("OPENWEATHER_API_KEY")
        
        # 시스템 메시지와 유저 메시지 사이에 'chat_history'라는 기억 장치 추가
        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", """당신은 유저의 기분과 날씨, 패션 취향을 분석하여 최적의 코디를 제안하는 퍼스널 쇼퍼이자 패션 테라피스트 AI 'MoodFit'입니다.

[현재 환경 정보]
- 유저의 오늘 기분/감정: {emotion} (확신도: {confidence}%)
- 현재 날씨 및 기온: {weather}
- 관광지 정보: {tour_info}

[유저 패션 및 신체 프로필]
- 유저 성별: {gender}
- 유저 키: {user_height}cm
- 유저 몸무게: {user_weight}kg
- 유저 체형: {body_form}
- 선호하는 스타일: {preferred_style}
- 선호 색상: {liked_colors}
- ⚠️ 절대 추천하면 안 되는 기피 색상 (하드 필터링 제약 조건): {disliked_colors}

[답변 작성 가이드]
1. 유저의 현재 감정에 깊이 공감해주며, 오늘 날씨에 적합한 활동적인 멘트로 시작하세요.
2. 이전 대화 문맥(chat_history)을 완벽히 파악하고, 유저가 변경을 원한다면 이전 코디를 바탕으로 수정해서 제안하세요.
3. **선호 스타일 최우선 반영**: 유저가 설정한 선호 스타일({preferred_style}) 감성(예: 스트릿, 미니멀, 캐주얼, 아메카지, 스포티, 모던 등)을 중심으로 전체 코디 분위기와 실루엣을 제안하세요.
4. **선호/기피 색상 반영**: 유저가 좋아하는 색상({liked_colors})을 매칭에 우선 반영하고, **기피하는 색상({disliked_colors})은 옷, 신발, 액세서리 등 추천 목록 그 어디에도 절대 포함시키지 마세요.**
5. **신체 핏 가이드**: 유저의 키({user_height}cm), 몸무게({user_weight}kg), 체형({body_form})에 맞는 핏 팁(오버핏, 레귤러핏 등)을 친절하게 제시하세요.
6. 친근하면서도 전문적인 톤앤매너(해요체)를 유지하세요."""),
            MessagesPlaceholder(variable_name="chat_history"), # 이전 대화가 들어가는 자리
            ("human", "{user_message}")
        ])
        
        self.chain = self.prompt_template | self.llm | StrOutputParser()

    def get_real_weather(self, map_y: Optional[float] = None, map_x: Optional[float] = None, city_name: Optional[str] = "Seoul") -> dict:
        try:
            if map_y is not None and map_x is not None:
                # 위도/경도가 제공된 경우
                url = f"http://api.openweathermap.org/data/2.5/weather?lat={map_y}&lon={map_x}&appid={self.weather_api_key}&units=metric&lang=kr"
            else:
                # 디폴트 서울 (Seoul)
                url = f"http://api.openweathermap.org/data/2.5/weather?q=Seoul&appid={self.weather_api_key}&units=metric&lang=kr"
                city_name = "Seoul"
                
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                return {
                    "temp": data["main"]["temp"],
                    "desc": data["weather"][0]["description"],
                    "region": city_name
                }
        except Exception as e:
            print(f"[Error] 날씨 API 에러: {e}")
        return {"temp": 22.0, "desc": "맑음(기본값)", "region": city_name}

    def generate_fashion_recommendation(self, db: Session, user_id: int, emotion: str, confidence: float, user_message: str, session_id: int = None) -> tuple[str, Optional[int]]:
        # 0. 관광 목적지 정보 (TPO) 조회 및 프롬프트 반영 준비
        latest_tour = None
        tour_info_text = ""
        if session_id:
            try:
                latest_tour = db.query(TourLog).filter(
                    TourLog.session_id == session_id
                ).order_by(TourLog.created_at.desc()).first()
                if latest_tour:
                    tour_info_text = (
                        f"\n[유저 나들이 목적지 (TPO)]\n"
                        f"- 방문 목적지: {latest_tour.title}\n"
                        f"- 카테고리: {latest_tour.content_type}\n"
                        f"- 위치/주소: {latest_tour.addr or '정보 없음'}\n"
                        f"- 해당 목적지의 분위기 및 상황적 제약조건(예: 야외활동 여부, 장소의 격식 등)에 맞게 패션 아이템 및 가이드를 제공하세요."
                    )
            except Exception as e:
                print(f"[Error] 관광지 정보 조회 실패: {e}")

        # 1. 날씨 조회 (관광지 좌표 우선, 없으면 서울 디폴트)
        map_x, map_y, city_name = None, None, "Seoul"
        if latest_tour and latest_tour.map_x is not None and latest_tour.map_y is not None:
            map_x = float(latest_tour.map_x)
            map_y = float(latest_tour.map_y)
            city_name = latest_tour.title
            
        weather_data = self.get_real_weather(map_y=map_y, map_x=map_x, city_name=city_name)
        current_weather = f"섭씨 {weather_data['temp']}도, {weather_data['desc']} ({weather_data['region']})"
        
        # 1.5. DB에서 이전 대화(기억) 긁어오기
        chat_history = []
        if session_id:
            try:
                past_messages = db.query(ChatMessage).filter(
                    ChatMessage.session_id == session_id
                ).order_by(ChatMessage.created_at.asc()).all()
                
                # 방금 DB에 등록된 제일 마지막 유저 메시지는 human 인자로 넘어가므로 chat_history에서 제외
                if past_messages and past_messages[-1].sender_type == "USER" and past_messages[-1].message_text == user_message:
                    past_messages = past_messages[:-1]
                
                for msg in past_messages:
                    if msg.sender_type == "USER":
                        chat_history.append(HumanMessage(content=msg.message_text))
                    elif msg.sender_type == "AI":
                        chat_history.append(AIMessage(content=msg.message_text))
                        
                print(f"[Memory] 세션 ID({session_id})의 이전 대화 {len(chat_history)}건이 RAG 메모리에 로드되었습니다.")
            except Exception as e:
                print(f"[Error] 대화 기록 불러오기 실패: {e}")

        # 2. 날씨 기록 (현지 날씨 저장)
        weather_log_id = None
        try:
            if session_id:
                new_weather_log = WeatherLog(
                    session_id=session_id, region_name=weather_data['region'],
                    temperature=weather_data['temp'], condition_code=weather_data['desc']
                )
                db.add(new_weather_log)
                db.commit()
                db.refresh(new_weather_log)
                weather_log_id = new_weather_log.id
        except Exception as e:
            db.rollback()
            print(f"[Error] 날씨 DB 저장 실패: {e}")

        # 3. 유저 신체 스펙 및 패션 취향 정보 조회
        gender = "정보 없음"
        user_height = "정보 없음"
        user_weight = "정보 없음"
        body_form = "정보 없음"
        preferred_style = "캐주얼(Casual)"
        liked_colors = "없음"
        disliked_colors = "없음"

        try:
            user_info = db.query(User).filter(User.id == user_id).first()
            if user_info:
                gender = user_info.gender or gender
                user_height = str(user_info.user_height) if user_info.user_height else user_height
                user_weight = str(user_info.user_weight) if user_info.user_weight else user_weight
                body_form = user_info.body_form or body_form
                preferred_style = user_info.preferred_styles or preferred_style
                liked_colors = user_info.liked_colors or liked_colors
                disliked_colors = user_info.disliked_colors or disliked_colors
        except Exception as e:
            print(f"[Error] 유저 취향 정보 조회 실패: {e}")

        # 4. 프롬프트에 모든 유저 취향/신체 정보 및 chat_history 주입!
        response = self.chain.invoke({
            "emotion": emotion,
            "confidence": f"{confidence * 100:.1f}",
            "weather": current_weather,
            "tour_info": tour_info_text,
            "gender": gender,
            "user_height": user_height,
            "user_weight": user_weight,
            "body_form": body_form,
            "preferred_style": preferred_style,
            "liked_colors": liked_colors,
            "disliked_colors": disliked_colors,
            "chat_history": chat_history,
            "user_message": user_message
        })

        return response, weather_log_id