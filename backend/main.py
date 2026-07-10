# backend/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from transformers import pipeline

# 1. 글로벌 변수로 ML 모델들을 담을 딕셔너리 선언
ml_models = {}

# 2. FastAPI 라이프사이클 (서버 시작/종료 시 실행될 로직)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # [서버 켜질 때] 로컬 감정 분류 모델 로딩
    print("🤖 AI 모델 로딩을 시작합니다... (시간이 조금 걸릴 수 있습니다)")
    try:
        # 영어 기반의 가벼운 감정 분류 모델 (추후 한국어 모델이나 커스텀 모델로 변경 가능)
        ml_models["emotion_classifier"] = pipeline(
            "text-classification", 
            model="bhadresh-savani/bert-base-uncased-emotion"
        )
        print("✅ 로컬 감정 분류 모델 로드 완료!")
    except Exception as e:
        print(f"❌ 모델 로딩 실패: {e}")
    
    yield # 여기서부터 서버가 요청을 받기 시작함

    # [서버 꺼질 때] 메모리 정리
    ml_models.clear()
    print("🛑 AI 모델 메모리 해제 완료. 서버를 종료합니다.")

# 3. FastAPI 앱 인스턴스 생성 (lifespan 연결)
app = FastAPI(
    title="MoodFit AI API",
    description="로컬 모델 및 LangChain RAG 처리 서버",
    version="1.0.0",
    lifespan=lifespan
)

# 4. 테스트용 기본 API (서버가 잘 켜졌는지 확인용)
@app.get("/")
async def root():
    return {"message": "MoodFit AI 서버가 정상적으로 실행 중입니다!", "model_loaded": "emotion_classifier" in ml_models}