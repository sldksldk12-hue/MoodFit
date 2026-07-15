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

@app.get("/")
async def root():
    return {"message": "MoodFit AI 서버 운영 중", "rag_ready": rag_service is not None}

@app.post("/api/chat/emotion")
async def analyze_emotion_and_recommend(req: ChatRequest, db: Session = Depends(get_db)):
    classifier = ml_models.get("emotion_classifier")
    if not classifier or not rag_service:
        return {"error": "AI 서버 인프라가 준비되지 않았습니다."}
    
    # 1. 로컬 ML 모델로 1차 감정 분류 수행
    result = classifier(req.message)
    raw_label = result[0]['label']
    emotion_score = result[0]['score']
    
    # KoELECTRA 모델이 뱉는 라벨을 LangChain 공통 규격으로 맵핑
    emotion_map = {
        "happy": "joy",
        "sad": "sadness",
        "angry": "anger",
        "anxious": "fear",
        "embarrassed": "surprise",
        "heartache": "sadness",
        # (혹시 한글로 나올 경우를 대비한 방탄 코드)
        "행복": "joy", "슬픔": "sadness", "분노": "anger", 
        "불안": "fear", "당황": "surprise", "상처": "sadness"
    }
    
    # 변환 실패 시 'neutral(중립)'으로 기본값 처리
    predicted_emotion = emotion_map.get(raw_label, "neutral")
    
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

        # 3. emotion_logs에 변환된 공통 감정 데이터(영어) 저장
        new_emotion_log = EmotionLog(
            message_id=user_message.id,
            predicted_emotion=predicted_emotion,
            confidence=emotion_score,
            raw_input=req.message
        )
        db.add(new_emotion_log)
        db.commit()
        db.refresh(new_emotion_log)
        
        # 4. 🌟 랭체인 RAG 워크플로우 가동 (영어 라벨이 GPT 프롬프트에 주입됨)
        ai_recommendation = rag_service.generate_fashion_recommendation(
            db=db,
            user_id=req.user_id,
            emotion=predicted_emotion,
            confidence=emotion_score,
            user_message=req.message
        )
        
        # 5. AI 답변 DB 저장
        ai_message = ChatMessage(
            session_id=new_session.id,
            sender_type="AI",
            message_text=ai_recommendation
        )
        db.add(ai_message)
        db.commit()

        # 원본 한글 라벨과 변환된 라벨을 모두 출력해 줍니다.
        return {
            "status": "success",
            "emotion_log_id": new_emotion_log.id,
            "raw_korean_label": raw_label,
            "mapped_emotion": predicted_emotion,
            "confidence": round(emotion_score, 4),
            "ai_response": ai_recommendation
        }
        
    except Exception as e:
        db.rollback()
        return {"error": f"RAG 워크플로우 처리 중 에러 발생: {str(e)}"}