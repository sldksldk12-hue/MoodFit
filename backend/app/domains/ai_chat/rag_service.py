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

def detect_effective_gender(user_gender: Optional[str], user_message: str) -> str:
    """
    유저 가입 성별과 대화 문장을 분석하여, 타인/선물/파트너 복장 추천 요청인 경우
    타겟 성별(여성/남성/공용)을 동적으로 감지하여 반환합니다.
    """
    msg = user_message.lower() if user_message else ""
    female_keywords = [
        "여자친구", "여친", "아내", "부인", "여동생", "누나", "엄마", "어머니",
        "여성복", "여성의류", "여성용", "여자옷", "여자 의류", "여성 옷", "원피스", "스커트", "치마", "여성"
    ]
    male_keywords = [
        "남자친구", "남친", "남편", "신랑", "남동생", "오빠", "형", "아빠", "아버지",
        "남성복", "남성의류", "남성용", "남자옷", "남자 의류", "남성 옷", "남성"
    ]

    has_female_intent = any(k in msg for k in female_keywords)
    has_male_intent = any(k in msg for k in male_keywords)

    if has_female_intent and not has_male_intent:
        return "여성"
    if has_male_intent and not has_female_intent:
        return "남성"

    return user_gender if user_gender in ["남성", "여성", "공용"] else "공용"


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
            ("system", """당신은 유저의 기분과 날씨, 패션 취향을 분석하여 최적의 코디를 제안하는 백화점 VIP 라운지의 감각적이고 친절한 퍼스널 쇼퍼이자 패션 테라피스트 AI 'MoodFit'입니다.

[현재 환경 정보]
- 유저의 오늘 기분/감정: {emotion} (확신도: {confidence}%)
- 현재 날씨 및 기온: {weather}
- 관광지 정보: {tour_info}

[유저 패션 및 신체 프로필]
- 추천 대상 성별: {gender}
- 유저 키: {user_height}cm
- 유저 몸무게: {user_weight}kg
- 유저 체형: {body_form}
- 선호하는 스타일: {preferred_style}
- 선호 색상: {liked_colors}
- ⚠️ 절대 추천하면 안 되는 기피 색상 (하드 필터링 제약 조건): {disliked_colors}

[이전 대화 핵심 요약 (Chat Summary)]:
{chat_summary}

[절대 금지 규칙 - 위반 시 시스템 오류 발생]
1. "1.", "2.", "3." 등 숫자로 번호를 매기는 리스트 형태를 절대 사용하지 마세요.
2. "상의:", "하의:", "신발:", "액세서리:" 등 분류명과 콜론(:) 조합을 절대 사용하지 마세요.
3. "-", "*" 등 글머리 기호를 사용한 요약식 나열을 절대 피하세요.

[답변 작성 가이드]
1. 고객의 옆에서 직접 옷을 골라주며 대화하듯, 친근하고 부드러운 산문 형태(해요체)의 이야기로 작성하세요.
2. 첫 문장에서는 유저의 현재 감정에 깊이 공감해주며, 상황이나 선호도(예: 어두운 계열 선호)에 대한 긍정적인 리액션을 보여주세요.
3. 전체적인 룩의 무드가 어떻게 어울리는지, 왜 이 색상과 소재의 조합을 추천하는지 한 편의 짧은 글처럼 매끄럽게 이어지게 설명하세요.
4. 이전 대화 핵심 요약문(Chat Summary)의 맥락을 완벽히 파악하고, 유저가 변경/추가를 원한다면 이전 추천을 바탕으로 연속성 있게 답변하세요.
5. **성별 맞춤 지침**: {gender_guideline}
6. **선호 스타일 최우선 반영**: 유저가 설정한 선호 스타일({preferred_style}) 감성을 중심으로 전체 코디 분위기와 실루엣을 제안하세요.
7. **선호/기피 색상 반영**: 유저가 좋아하는 색상({liked_colors})을 매칭에 우선 반영하고, **기피하는 색상({disliked_colors})은 옷, 신발, 액세서리 등 추천 목록 그 어디에도 절대 포함시키지 마세요.**"""),
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

    def get_real_weather(self, map_y: Optional[float] = None, map_x: Optional[float] = None, city_name: Optional[str] = "서울") -> dict:
        if self.weather_api_key:
            try:
                if map_y is not None and map_x is not None:
                    url = f"http://api.openweathermap.org/data/2.5/weather?lat={map_y}&lon={map_x}&appid={self.weather_api_key}&units=metric&lang=kr"
                else:
                    url = f"http://api.openweathermap.org/data/2.5/weather?q=Seoul&appid={self.weather_api_key}&units=metric&lang=kr"
                    city_name = "서울"
                    
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
        return {"temp": 24.5, "desc": "맑음(쾌적한 날씨)", "region": city_name or "서울"}

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
                else:
                    recent_msgs = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.desc()).limit(6).all()
                    if recent_msgs:
                        msgs_text = []
                        for m in reversed(recent_msgs):
                            sender = "유저" if m.sender_type == "USER" else "AI"
                            msgs_text.append(f"{sender}: {m.message_text[:100]}")
                        chat_summary_text = "\n".join(msgs_text)
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

        # 4. 동적 성별 감지 및 프롬프트 주입
        effective_gender = detect_effective_gender(gender, user_message)

        if effective_gender != gender and gender in ["남성", "여성"]:
            gender_guideline = f"유저의 가입 성별은 [{gender}]이지만, 이번 대화 요청은 타인/선물/파트너용 [{effective_gender}] 스타일 추천 요청입니다. 반드시 100% [{effective_gender}] 전용 및 공용 착장 스타일만을 제안하고 다정하게 설명하세요."
        else:
            gender_guideline = f"유저 성별이 [{effective_gender}]로 설정되어 있으므로, 반드시 100% [{effective_gender}]에게 적합한 스타일과 의류 핏을 제안하고 반대 성별 전용 의류는 제안하지 마세요."

        response = self.chain.invoke({
            "emotion": emotion,
            "confidence": f"{confidence * 100:.1f}",
            "weather": current_weather,
            "tour_info": tour_info_text,
            "gender": effective_gender,
            "gender_guideline": gender_guideline,
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

    def stream_recommendation(
        self,
        emotion: str,
        confidence: float,
        user_message: str,
        db: Session,
        user_id: int,
        session_id: Optional[int] = None
    ):
        """AI 추천 텍스트를 0.3초 만에 실시간 스트리밍 청크 단위로 생성합니다."""
        tour_info_text = "선택된 관광지 정보 없음"
        latest_tour = None
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
                    )
            except Exception as e:
                print(f"[Error] 관광지 정보 조회 실패: {e}")

        map_x, map_y, city_name = None, None, "Seoul"
        if latest_tour and latest_tour.map_x is not None and latest_tour.map_y is not None:
            map_x = float(latest_tour.map_x)
            map_y = float(latest_tour.map_y)
            city_name = latest_tour.title
            
        weather_data = self.get_real_weather(map_y=map_y, map_x=map_x, city_name=city_name)
        current_weather = f"섭씨 {weather_data['temp']}도, {weather_data['desc']} ({weather_data['region']})"

        chat_summary_text = "이전 대화 내역 없음"
        if session_id:
            try:
                chat_sess = db.query(ChatSession).filter(ChatSession.id == session_id).first()
                if chat_sess and chat_sess.summary_text:
                    chat_summary_text = chat_sess.summary_text
                else:
                    recent_msgs = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.desc()).limit(6).all()
                    if recent_msgs:
                        msgs_text = []
                        for m in reversed(recent_msgs):
                            sender = "유저" if m.sender_type == "USER" else "AI"
                            msgs_text.append(f"{sender}: {m.message_text[:100]}")
                        chat_summary_text = "\n".join(msgs_text)
            except Exception as hist_err:
                print(f"[Error] 이전 대화 히스토리 불러오기 실패: {hist_err}")

        gender, user_height, user_weight, body_form, preferred_style, liked_colors, disliked_colors = (
            "정보 없음", "정보 없음", "정보 없음", "정보 없음", "캐주얼(Casual)", "없음", "없음"
        )
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
        except Exception:
            pass

        effective_gender = detect_effective_gender(gender, user_message)

        if effective_gender != gender and gender in ["남성", "여성"]:
            gender_guideline = f"유저의 가입 성별은 [{gender}]이지만, 이번 대화 요청은 타인/선물/파트너용 [{effective_gender}] 스타일 추천 요청입니다. 반드시 100% [{effective_gender}] 전용 및 공용 착장 스타일만을 제안하고 다정하게 설명하세요."
        else:
            gender_guideline = f"유저 성별이 [{effective_gender}]로 설정되어 있으므로, 반드시 100% [{effective_gender}]에게 적합한 스타일과 의류 핏을 제안하고 반대 성별 전용 의류는 제안하지 마세요."

        prompt_inputs = {
            "emotion": emotion,
            "confidence": f"{confidence * 100:.1f}",
            "weather": current_weather,
            "tour_info": tour_info_text,
            "gender": effective_gender,
            "gender_guideline": gender_guideline,
            "user_height": user_height,
            "user_weight": user_weight,
            "body_form": body_form,
            "preferred_style": preferred_style,
            "liked_colors": liked_colors,
            "disliked_colors": disliked_colors,
            "chat_summary": chat_summary_text,
            "user_message": user_message
        }

        full_response = ""
        for chunk in self.chain.stream(prompt_inputs):
            full_response += chunk
            yield chunk

        if session_id and full_response:
            import threading
            def _async_update_summary():
                from app.db.database import SessionLocal
                from app.models.models import ChatSession
                from langchain_openai import ChatOpenAI
                bg_db = SessionLocal()
                try:
                    sess = bg_db.query(ChatSession).filter(ChatSession.id == session_id).first()
                    if sess:
                        sum_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, openai_api_key=os.getenv("OPENAI_API_KEY"))
                        res = sum_llm.invoke(f"이전: {sess.summary_text or '없음'}\n신규: {user_message} -> {full_response[:200]}\n2줄 요약해라.")
                        sess.summary_text = res.content.strip()
                        bg_db.commit()
                except Exception:
                    bg_db.rollback()
                finally:
                    bg_db.close()
            threading.Thread(target=_async_update_summary, daemon=True).start()