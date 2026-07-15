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