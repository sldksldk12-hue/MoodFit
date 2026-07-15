# backend/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
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
        # 최신 KoELECTRA 감정 모델로 교체!
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
    
    result = classifier(req.message)
    raw_label = result[0]['label']
    emotion_score = result[0]['score'] # 확신도 (0.0 ~ 1.0)
    
    # 모델이 60% 미만으로 확신하면, 그냥 '중립'으로 처리
    if emotion_score < 0.60:
        predicted_emotion = "neutral"
    else:
        # 60% 이상일 때만 매핑 딕셔너리 사용
        predicted_emotion = emotion_map.get(raw_label, "neutral")
    
    emotion_map = {
        "happy": "joy", "sad": "sadness", "angry": "anger",
        "anxious": "fear", "embarrassed": "surprise", "heartache": "sadness",
        "행복": "joy", "슬픔": "sadness", "분노": "anger", 
        "불안": "fear", "당황": "surprise", "상처": "sadness"
    }
    predicted_emotion = emotion_map.get(raw_label, "neutral")
    
    try:
        # 1. 대화 세션 처리 (핵심 변경점)
        if req.session_id:
            # 클라이언트가 기존 세션 ID를 주면 그걸 그대로 사용!
            current_session_id = req.session_id
        else:
            # 없으면 새로 생성
            new_session = ChatSession(session_uuid=f"session-{datetime.now().timestamp()}")
            db.add(new_session)
            db.commit()
            db.refresh(new_session)
            current_session_id = new_session.id

        # 2. 유저 메시지 DB 저장
        user_message = ChatMessage(
            session_id=current_session_id, # 👈 current_session_id 사용
            sender_type="USER",
            message_text=req.message
        )
        db.add(user_message)
        db.commit()
        db.refresh(user_message)

        # 3. 감정 로그 DB 저장
        new_emotion_log = EmotionLog(
            message_id=user_message.id,
            predicted_emotion=predicted_emotion,
            confidence=emotion_score,
            raw_input=req.message
        )
        db.add(new_emotion_log)
        db.commit()
        db.refresh(new_emotion_log)
        
        # 4. RAG 워크플로우 가동 
        ai_recommendation = rag_service.generate_fashion_recommendation(
            db=db,
            user_id=req.user_id,
            emotion=predicted_emotion,
            confidence=emotion_score,
            user_message=req.message,
            session_id=current_session_id  # current_session_id 넘겨주기
        )
        
        # 5. AI 답변 DB 저장
        ai_message = ChatMessage(
            session_id=current_session_id, # current_session_id 사용
            sender_type="AI",
            message_text=ai_recommendation
        )
        db.add(ai_message)
        db.commit()

        return {
            "status": "success",
            "session_id": current_session_id, # 프론트엔드가 다음 질문 때 쓸 수 있게 응답에 포함
            "emotion_log_id": new_emotion_log.id,
            "mapped_emotion": predicted_emotion,
            "ai_response": ai_recommendation
        }
        
    except Exception as e:
        db.rollback()
        return {"error": f"RAG 워크플로우 처리 중 에러 발생: {str(e)}"}