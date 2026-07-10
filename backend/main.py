# backend/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from pydantic import BaseModel
from transformers import pipeline
from sqlalchemy.orm import Session
from datetime import datetime

# 만든 DB 연결 도구와 모델 임포트
from app.db.database import get_db
from app.models.models import EmotionLog, ChatMessage, ChatSession

# 1. 글로벌 변수로 ML 모델들을 담을 딕셔너리 선언
ml_models = {}

# 2. FastAPI 라이프사이클 (서버 시작/종료 시 실행될 로직)
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🤖 AI 모델 로딩을 시작합니다... (시간이 조금 걸릴 수 있습니다)")
    try:
        ml_models["emotion_classifier"] = pipeline(
            "text-classification", 
            model="bhadresh-savani/bert-base-uncased-emotion"
        )
        print("✅ 로컬 감정 분류 모델 로드 완료!")
    except Exception as e:
        print(f"❌ 모델 로딩 실패: {e}")
    
    yield 

    ml_models.clear()
    print("🛑 AI 모델 메모리 해제 완료. 서버를 종료합니다.")

# 3. FastAPI 앱 인스턴스 생성
app = FastAPI(
    title="MoodFit AI API",
    description="로컬 모델 및 LangChain RAG 처리 서버",
    version="1.0.0",
    lifespan=lifespan
)

# 4. 유저가 보낼 데이터의 형태(스펙) 정의
class ChatRequest(BaseModel):
    message: str

# 5. 서버 기본 상태 체크용 API
@app.get("/")
async def root():
    return {"message": "MoodFit AI 서버가 정상적으로 실행 중입니다!", "model_loaded": "emotion_classifier" in ml_models}

# 6. 감정 분석 & DB 자동 저장 API 엔드포인트
@app.post("/api/chat/emotion")
async def analyze_emotion(req: ChatRequest, db: Session = Depends(get_db)):
    classifier = ml_models.get("emotion_classifier")
    
    if not classifier:
        return {"error": "모델이 아직 로드되지 않았습니다."}
    
    # AI 감정 분석 실행
    result = classifier(req.message)
    predicted_emotion = result[0]['label']
    emotion_score = result[0]['score']
    
    try:
        # DB 구조 상 감정 로그는 채팅 메시지를, 채팅 메시지는 세션을 부모로 가져야 합니다.
        # 테스트를 위해 임의의 세션과 메시지를 생성합니다.
        new_session = ChatSession(session_uuid=f"test-session-{datetime.now().timestamp()}")
        db.add(new_session)
        db.commit()
        db.refresh(new_session)

        new_message = ChatMessage(
            session_id=new_session.id,
            sender_type="USER",
            message_text=req.message
        )
        db.add(new_message)
        db.commit()
        db.refresh(new_message)

        # AI가 분석한 결과를 EmotionLog 테이블에 저장합니다.
        new_emotion_log = EmotionLog(
            message_id=new_message.id,
            predicted_emotion=predicted_emotion,
            confidence=emotion_score,
            raw_input=req.message
        )
        db.add(new_emotion_log)
        db.commit() # 최종 저장
        db.refresh(new_emotion_log)
        
        return {
            "status": "success",
            "db_saved_id": new_emotion_log.id,
            "input_message": req.message,
            "analyzed_emotion": predicted_emotion,
            "confidence_score": round(emotion_score, 4),
            "message": "감정 분석 결과가 DB에 성공적으로 저장되었습니다!"
        }
        
    except Exception as e:
        db.rollback() # 에러 발생 시 변경사항 취소
        return {"error": f"DB 저장 중 에러 발생: {str(e)}"}