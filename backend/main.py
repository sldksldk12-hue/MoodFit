import os         # 🌟 환경변수(API 키)를 읽어오기
import requests   # 🌟 외부 API(OpenWeather)와 통신
import urllib.parse
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware  # CORS 미들웨어 임포트
from pydantic import BaseModel
from transformers import pipeline
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.database import get_db
from app.models.models import EmotionLog, ChatMessage, ChatSession
from app.domains.ai_chat.rag_service import RagsFashionService

ml_models = {}
rag_service = None 

@asynccontextmanager
async def lifespan(app: FastAPI):
    global rag_service
    print("AI 모델 및 LangChain 서비스 로딩 시작...")
    try:
        # 최신 KoELECTRA 감정 모델로 교체
        ml_models["emotion_classifier"] = pipeline(
            "text-classification", 
            model="Jinuuuu/KoELECTRA_fine_tunning_emotion"
        )
        rag_service = RagsFashionService()
        print("✅ 모든 AI 및 RAG 인프라 로드 완료!")
    except Exception as e:
        print(f"❌ 초기화 실패: {e}")
    
    yield 
    ml_models.clear()
    print("🛑 AI 모델 메모리 해제 완료.")

app = FastAPI(
    title="MoodFit AI API",
    description="로컬 모델 및 LangChain RAG 처리 서버",
    version="1.2.0",
    lifespan=lifespan
)

# CORS 설정 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발 단계이므로 일단 모든 프론트엔드 주소(React, Vue 등) 허용
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, PUT, DELETE 등 모든 요청 방식 허용
    allow_headers=["*"],  # 모든 데이터 헤더 허용
)

class ChatRequest(BaseModel):
    user_id: int = 1 
    message: str
    session_id: int = None  # 선택 사항: 기존 대화를 이어가고 싶을 때 넘겨받을 세션 ID

@app.get("/")
async def root():
    return {"message": "MoodFit AI 서버 운영 중", "rag_ready": rag_service is not None}

@app.get("/api/weather")
async def get_current_weather():
    # 백엔드에서 안전하게 OpenWeather를 찔러서 프론트엔드로 전달 (API 키 숨김)
    api_key = os.getenv("OPENWEATHER_API_KEY")
    city = "Seoul"
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric&lang=kr"
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            return response.json() # 원본 형태 그대로 반환
        else:
            return {"error": "날씨 정보를 불러오지 못했습니다."}
    except Exception as e:
        return {"error": str(e)}
    
@app.get("/api/festival")
async def get_recommended_festivals():
    api_key = os.getenv("TOUR_API_KEY")
    if not api_key:
        return {"error": "서버에 축제 API 키가 설정되지 않았습니다."}

    try:
        # 오늘 날짜 구하기 (YYYYMMDD 형식)
        today_str = datetime.now().strftime("%Y%m%d")
        
        # 이중 인코딩 방지를 위한 수동 URL 조합
        # MobileOS=ETC, MobileApp=MoodFit (서비스명), _type=json, eventStartDate=오늘날짜
        base_url = "http://apis.data.go.kr/B551011/KorService1/searchFestival1"
        query_string = (
            f"?serviceKey={api_key}"
            f"&numOfRows=5"            # 프론트엔드 화면에 맞게 5개만 가져오기
            f"&pageNo=1"
            f"&MobileOS=ETC"
            f"&MobileApp=MoodFit"
            f"&_type=json"
            f"&listYN=Y"
            f"&arrange=A"              # A: 제목순, D: 생성일순
            f"&eventStartDate={today_str}"
        )
        url = base_url + query_string

        # API 호출
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            
            # 4. 공공데이터포털의 복잡한 JSON 구조 파싱
            items = data.get("response", {}).get("body", {}).get("items", {})
            # 데이터가 없을 경우 items가 빈 문자열("")로 올 수 있으므로 방어 로직 추가
            item_list = items.get("item", []) if isinstance(items, dict) else []

            festivals = []
            for idx, item in enumerate(item_list):
                # 프론트엔드 위젯 규격(id, title, location, period, image_url, description)에 맞게 변환
                
                # 원본 날짜 포맷팅 (20260715 -> 2026.07.15)
                start_date = item.get("eventstartdate", "")
                end_date = item.get("eventenddate", "")
                period = f"{start_date[:4]}.{start_date[4:6]}.{start_date[6:]} ~ {end_date[:4]}.{end_date[4:6]}.{end_date[6:]}" if start_date else "상시 진행"

                festivals.append({
                    "id": idx + 1,
                    "title": item.get("title", "축제명 없음"),
                    "location": item.get("addr1", "장소 미상"),
                    "period": period,
                    # 이미지가 없으면 회색 기본 이미지(Placeholder)를 넘겨서 프론트엔드 화면이 깨지지 않게 방어!
                    "image_url": item.get("firstimage") or item.get("firstimage2") or "https://via.placeholder.com/600x400?text=No+Image",
                    "description": "자세한 사항은 관광공사 홈페이지를 참고해주세요.",
                    "tags": ["축제", "나들이"]
                })

            return {"status": "success", "data": festivals}
        else:
            return {"error": f"공공데이터 API 통신 실패: {response.status_code}"}
            
    except Exception as e:
        return {"error": f"축제 정보를 파싱하는 중 에러가 발생했습니다: {str(e)}"}

@app.post("/api/chat/emotion")
async def analyze_emotion_and_recommend(req: ChatRequest, db: Session = Depends(get_db)):
    classifier = ml_models.get("emotion_classifier")
    if not classifier or not rag_service:
        return {"error": "AI 서버 인프라가 준비되지 않았습니다."}
    
    # 감정 분석 실행
    result = classifier(req.message)
    raw_label = result[0]['label']
    emotion_score = result[0]['score']
    
    emotion_map = {
        "happy": "joy", "sad": "sadness", "angry": "anger",
        "anxious": "fear", "embarrassed": "surprise", "heartache": "sadness",
        "행복": "joy", "슬픔": "sadness", "분노": "anger", 
        "불안": "fear", "당황": "surprise", "상처": "sadness"
    }
    
    # 신뢰도 60% 미만 중립 처리 방어 로직
    if emotion_score < 0.60:
        predicted_emotion = "neutral"
        print(f"🛡️ 확신도 부족({emotion_score:.2f}) -> 감정 중립(neutral) 처리됨")
    else:
        predicted_emotion = emotion_map.get(raw_label, "neutral")
        
    # 데이터베이스 및 RAG 처리 블록
    try:
        # 세션 처리
        if req.session_id:
            current_session_id = req.session_id
        else:
            new_session = ChatSession(session_uuid=f"session-{datetime.now().timestamp()}")
            db.add(new_session)
            db.commit()
            db.refresh(new_session)
            current_session_id = new_session.id

        # 유저 메시지 DB 저장
        user_message = ChatMessage(
            session_id=current_session_id,
            sender_type="USER",
            message_text=req.message
        )
        db.add(user_message)
        db.commit()
        db.refresh(user_message)

        # 감정 로그 DB 저장
        new_emotion_log = EmotionLog(
            message_id=user_message.id,
            predicted_emotion=predicted_emotion,
            confidence=emotion_score,
            raw_input=req.message
        )
        db.add(new_emotion_log)
        db.commit()
        db.refresh(new_emotion_log)
        
        # RAG 워크플로우 가동 
        ai_recommendation = rag_service.generate_fashion_recommendation(
            db=db,
            user_id=req.user_id,
            emotion=predicted_emotion,
            confidence=emotion_score,
            user_message=req.message,
            session_id=current_session_id
        )
        
        # AI 답변 DB 저장
        ai_message = ChatMessage(
            session_id=current_session_id,
            sender_type="AI",
            message_text=ai_recommendation
        )
        db.add(ai_message)
        db.commit()

        # 프론트엔드로 응답 반환
        return {
            "status": "success",
            "session_id": current_session_id,
            "emotion_log_id": new_emotion_log.id,
            "mapped_emotion": predicted_emotion,
            "ai_response": ai_recommendation
        }
        
    except Exception as e:
        db.rollback()
        return {"error": f"RAG 워크플로우 처리 중 에러 발생: {str(e)}"}