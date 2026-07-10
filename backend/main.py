# backend/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from pydantic import BaseModel
from transformers import pipeline
from sqlalchemy.orm import Session
from datetime import datetime

# 기존 도구들 임포트
from app.db.database import get_db
from app.models.models import EmotionLog, ChatMessage, ChatSession

# 🌟 방금 만든 LangChain RAG 서비스 임포트
from app.domains.ai_chat.rag_service import RagsFashionService

ml_models = {}
rag_service = None # RAG 서비스 인스턴스 변수

@asynccontextmanager
async def lifespan(app: FastAPI):
    global rag_service
    print("🤖 AI 모델 및 LangChain 서비스 로딩 시작...")
    try:
        # 로컬 ML 모델 로드
        ml_models["emotion_classifier"] = pipeline(
            "text-classification", 
            model="bhadresh-savani/bert-base-uncased-emotion"
        )
        # LangChain 서비스 인스턴스 생성
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
    version="1.1.0",
    lifespan=lifespan
)

class ChatRequest(BaseModel):
    user_id: int = 1 # 테스트용 유저 ID 기본값
    message: str

@app.get("/")
async def root():
    return {"message": "MoodFit AI 서버 운영 중", "rag_ready": rag_service is not None}

# 🔥 고도화된 챗 엔드포인트
@app.post("/api/chat/emotion")
async def analyze_emotion_and_recommend(req: ChatRequest, db: Session = Depends(get_db)):
    classifier = ml_models.get("emotion_classifier")
    if not classifier or not rag_service:
        return {"error": "AI 서버 인프라가 준비되지 않았습니다."}
    
    # 1. 로컬 ML 모델로 1차 감정 분류 수행
    result = classifier(req.message)
    predicted_emotion = result[0]['label']
    emotion_score = result[0]['score']
    
    try:
        # 2. 대화 세션 및 메시지 생성 후 DB 기록
        new_session = ChatSession(session_uuid=f"session-{datetime.now().timestamp()}")
        db.add(new_session)
        db.commit()
        db.refresh(new_session)

        user_message = ChatMessage(
            session_id=new_session.id,
            sender_type="USER",
            message_text=req.message
        )
        db.add(user_message)
        db.commit()
        db.refresh(user_message)

        # 3. emotion_logs에 감정 데이터 저장
        new_emotion_log = EmotionLog(
            message_id=user_message.id,
            predicted_emotion=predicted_emotion,
            confidence=emotion_score,
            raw_input=req.message
        )
        db.add(new_emotion_log)
        db.commit()
        db.refresh(new_emotion_log)
        
        # 4. 🌟 랭체인 RAG 워크플로우 가동 (감정 + 날씨 + 취향 결합 피드백 생성)
        ai_recommendation = rag_service.generate_fashion_recommendation(
            db=db,
            user_id=req.user_id,
            emotion=predicted_emotion,
            confidence=emotion_score,
            user_message=req.message
        )
        
        # 5. AI 답변도 ChatMessage 테이블에 저장 (선택 사항, 협업 시 대화 내역 유지용)
        ai_message = ChatMessage(
            session_id=new_session.id,
            sender_type="AI",
            message_text=ai_recommendation
        )
        db.add(ai_message)
        db.commit()

        return {
            "status": "success",
            "emotion_log_id": new_emotion_log.id,
            "detected_emotion": predicted_emotion,
            "confidence": round(emotion_score, 4),
            "ai_response": ai_recommendation
        }
        
    except Exception as e:
        db.rollback()
        return {"error": f"RAG 워크플로우 처리 중 에러 발생: {str(e)}"}