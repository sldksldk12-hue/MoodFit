from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from transformers import pipeline
from dotenv import load_dotenv

# 분리한 라우터들을 가져오기
from app.api import chat, product, external, cart, auth, tour, like, order, history, inquiry, review
from app.domains.ai_chat.rag_service import RagsFashionService
# Base와 DB engine 임포트 추가 (모든 모델을 인식하도록 models 자체를 가져오는 것이 안전)
from app.models import models 
from app.db.database import engine, SessionLocal

load_dotenv()

# DB 테이블 자동 생성 코드 추가: 누락된 테이블을 서버 구동 시 자동 생성
models.Base.metadata.create_all(bind=engine)

ml_models = {}
rag_service = None 

@asynccontextmanager
async def lifespan(app: FastAPI):
    global rag_service
    print("AI 모델 및 LangChain 서비스 로딩 시작...")
    try:
        ml_models["emotion_classifier"] = pipeline("text-classification", model="Jinuuuu/KoELECTRA_fine_tunning_emotion")
        rag_service = RagsFashionService()
        
        # 라우터(chat.py 등)에서 꺼내 쓸 수 있도록 app.state에 모델을 저장
        app.state.ml_models = ml_models
        app.state.rag_service = rag_service
        print("✅ 모든 AI 및 RAG 인프라 로드 완료!")
        
        # 카테고리 자동 적재 (Service 모듈의 함수 호출)
        from app.domains.product.service import seed_initial_categories
        db = SessionLocal()
        try:
            seed_initial_categories(db)
        finally:
            db.close()
    except Exception as e:
        print(f"❌ 초기화 실패: {e}")
    
    yield 
    ml_models.clear()
    print("🛑 AI 모델 메모리 해제 완료.")

app = FastAPI(title="MoodFit AI API", version="1.3.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

# 분리된 라우터들을 조립, prefix를 설정해 주소를 관리
app.include_router(external.router, prefix="/api", tags=["External"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(tour.router, prefix="/api/tour", tags=["Tour"])
app.include_router(product.router, prefix="/api/products", tags=["Product"])
app.include_router(cart.router)
app.include_router(auth.router, prefix="/moodfit")
app.include_router(like.router)
app.include_router(order.router, prefix="/api/orders", tags=["Order"])
app.include_router(history.router)
app.include_router(inquiry.router)
app.include_router(review.router)

@app.get("/")
async def root():
    return {"message": "MoodFit AI 서버 운영 중", "rag_ready": rag_service is not None}