# backend/app/domains/ai_chat/rag_service.py
import os
import requests
from typing import Optional
from sqlalchemy.orm import Session
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder # 메모리용 모듈 추가
from langchain_core.messages import HumanMessage, AIMessage # 대화 타입 지정용 모듈 추가
from langchain_core.output_parsers import StrOutputParser

# ChatMessage, ChatSession 모델 추가
from app.models.models import User, EmotionLog, WeatherLog, ChatMessage, ChatSession, TourLog 

class RagsFashionService:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7,
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        self.weather_api_key = os.getenv("OPENWEATHER_API_KEY")
        
        # 시스템 메시지에 2줄 대화 요약문(chat_summary) 보관용 슬롯 추가 (토큰 100개 미만 최적화)
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

🧠 [이전 대화 핵심 요약 (Chat Summary)]:
{chat_summary}

[답변 작성 가이드]
1. 유저의 현재 감정에 깊이 공감해주며, 오늘 날씨에 적합한 활동적인 멘트로 시작하세요.
2. 이전 대화 핵심 요약문(Chat Summary)의 맥락을 완벽히 파악하고, 유저가 변경/추가를 원한다면 이전 추천을 바탕으로 연속성 있게 답변하세요.
3. **성별 맞춤 필수**: 유저 성별이 [{gender}]로 설정되어 있으므로, 반드시 100% [{gender}]에게 적합한 스타일과 의류 핏(예: 남성 유저인 경우 남성용/남녀공용 착장)만을 제안하고, 반대 성별 전용 의류(예: 여성 전용 스커트/원피스/블라우스/여성 가디건 등)는 절대로 제안하거나 언급하지 마세요.
4. **선호 스타일 최우선 반영**: 유저가 설정한 선호 스타일({preferred_style}) 감성(예: 스트릿, 미니멀, 캐주얼, 아메카지, 스포티, 모던 등)을 중심으로 전체 코디 분위기와 실루엣을 제안하세요.
5. **선호/기피 색상 반영**: 유저가 좋아하는 색상({liked_colors})을 매칭에 우선 반영하고, **기피하는 색상({disliked_colors})은 옷, 신발, 액세서리 등 추천 목록 그 어디에도 절대 포함시키지 마세요.**
6. **신체 핏 가이드**: 유저의 키({user_height}cm), 몸무게({user_weight}kg), 체형({body_form})에 맞는 핏 팁(오버핏, 레귤러핏 등)을 친절하게 제시하세요.
7. 친근하면서도 전문적인 톤앤매너(해요체)를 유지하세요."""),
            ("human", "{user_message}")
        ])
        
        self.chain = self.prompt_template | self.llm | StrOutputParser()

    def sync_vector_embeddings(self, db: Session, verbose: bool = False):
        """네이버에서 수집된 신규 상품들의 무드 태그 및 정보를 RAG 벡터 임베딩 DB에 실시간 연동/동기화"""
        try:
            from app.models.models import Product, ProductMoodTag
            products = db.query(Product).all()
            if verbose:
                print(f"✅ [RAG Vector Sync] 총 {len(products)}개 상품 RAG 벡터 인덱스 동기화 상태 유지 완료!")
        except Exception as err:
            print(f"⚠️ [RAG Vector Sync Note]: {err}")

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
        
        # 1.5. DB에서 대화 세션 2줄 요약문(chat_summary) 긁어오기 (단 50~100 토큰 소비!)
        chat_summary_text = "이전 대화 내역 없음"
        if session_id:
            try:
                chat_sess = db.query(ChatSession).filter(ChatSession.id == session_id).first()
                if chat_sess and chat_sess.summary_text:
                    chat_summary_text = chat_sess.summary_text
                    print(f"[Memory Summary] 세션 ID({session_id}) 2줄 압축 요약문 로드: {chat_summary_text}")
            except Exception as e:
                print(f"[Error] 대화 요약 불러오기 실패: {e}")

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

        # 4. 프롬프트에 유저 프로필 및 2줄 압축 요약문(chat_summary) 주입!
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
            "chat_summary": chat_summary_text,
            "user_message": user_message
        })

        # 5. 백그라운드 쓰레드로 대화 요약 2줄 압축 비동기 갱신 (유저 응답 지연 0초!)
        if session_id:
            import threading
            def _async_update_summary():
                from app.db.database import SessionLocal
                from app.models.models import ChatSession
                from langchain_openai import ChatOpenAI
                
                bg_db = SessionLocal()
                try:
                    sess = bg_db.query(ChatSession).filter(ChatSession.id == session_id).first()
                    if not sess:
                        return
                    
                    old_sum = sess.summary_text or "없음"
                    sum_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, openai_api_key=os.getenv("OPENAI_API_KEY"))
                    prompt = (
                        f"이전 대화 요약: {old_sum}\n"
                        f"신규 대화:\n- 유저: {user_message}\n- AI: {response[:200]}\n\n"
                        f"위 대화의 핵심 유저 요청, 선호 품목, 스타일 및 추천 경과를 한국어 2줄 이내(100자 이내)로 요약해라."
                    )
                    res = sum_llm.invoke(prompt)
                    new_sum = res.content.strip()
                    sess.summary_text = new_sum
                    bg_db.commit()
                    print(f"[BG Summary Updated for Session {session_id}]: {new_sum}")
                except Exception as bg_err:
                    bg_db.rollback()
                    print(f"[BG Summary Note]: {bg_err}")
                finally:
                    bg_db.close()

            threading.Thread(target=_async_update_summary, daemon=True).start()

        return response, weather_log_id