import os         # 환경변수(API 키)를 읽어오기
import requests   # 외부 API(OpenWeather)와 통신
from dotenv import load_dotenv
import urllib.parse
from urllib.parse import quote
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware  # CORS 미들웨어 임포트
from pydantic import BaseModel, Field

# 랭체인 관련 임포트 추가
from langchain_core.output_parsers import PydanticOutputParser
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from transformers import pipeline
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.database import get_db
from app.models.models import EmotionLog, ChatMessage, ChatSession
from app.domains.ai_chat.rag_service import RagsFashionService

load_dotenv() # 환경변수 로드

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
    
# AI에게 요구할 답변 양식 (JSON 구조)
class AIResponseSchema(BaseModel):
    search_keyword: str = Field(description="네이버 쇼핑에서 검색할 가장 핵심적인 옷 키워드 딱 1개 (예: '여성 오버핏 가디건', '남성 와이드 데님 팬츠')")

# 네이버 쇼핑 검색 헬퍼 함수
def search_naver_shopping(query: str, display: int = 3):
    client_id = os.getenv("NAVER_CLIENT_ID")
    client_secret = os.getenv("NAVER_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        print("❌ 네이버 API 키가 없습니다.")
        return []

    url = f"https://openapi.naver.com/v1/search/shop.json?query={quote(query)}&display={display}"
    headers = {
        "X-Naver-Client-Id": client_id,
        "X-Naver-Client-Secret": client_secret
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            items = data.get("items", [])
            products = []
            for item in items:
                products.append({
                    "title": item["title"].replace("<b>", "").replace("</b>", ""), 
                    "link": item["link"],
                    "image": item["image"],
                    "lprice": int(item["lprice"]) 
                })
            return products
        else:
            print(f"❌ 네이버 API 에러: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ 상품 검색 중 에러 발생: {e}")
        return []

@app.get("/")
async def root():
    return {"message": "MoodFit AI 서버 운영 중", "rag_ready": rag_service is not None}

@app.get("/api/weather")
async def get_current_weather():
    api_key = os.getenv("OPENWEATHER_API_KEY")
    city = "Seoul"
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric&lang=kr"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            return response.json() 
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
        today_str = datetime.now().strftime("%Y%m%d")
        url = "http://apis.data.go.kr/B551011/KorService2/searchFestival2"
        params = {
            "serviceKey": urllib.parse.unquote(api_key), 
            "numOfRows": 5,
            "pageNo": 1,
            "MobileOS": "ETC",
            "MobileApp": "MoodFit",
            "_type": "json",
            "arrange": "A",
            "eventStartDate": today_str
        }
        response = requests.get(url, params=params)
        if response.status_code == 200:
            data = response.json()
            items = data.get("response", {}).get("body", {}).get("items", {})
            item_list = items.get("item", []) if isinstance(items, dict) else []
            festivals = []
            for idx, item in enumerate(item_list):
                start_date = item.get("eventstartdate", "")
                end_date = item.get("eventenddate", "")
                period = f"{start_date[:4]}.{start_date[4:6]}.{start_date[6:]} ~ {end_date[:4]}.{end_date[4:6]}.{end_date[6:]}" if start_date else "상시 진행"
                festivals.append({
                    "id": idx + 1,
                    "title": item.get("title", "축제명 없음"),
                    "location": item.get("addr1", "장소 미상"),
                    "period": period,
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
    
    if emotion_score < 0.60:
        predicted_emotion = "neutral"
        print(f"🛡️ 확신도 부족({emotion_score:.2f}) -> 감정 중립(neutral) 처리됨")
    else:
        predicted_emotion = emotion_map.get(raw_label, "neutral")
        
    try:
        # 세션 및 DB 저장 처리
        if req.session_id:
            current_session_id = req.session_id
        else:
            new_session = ChatSession(session_uuid=f"session-{datetime.now().timestamp()}")
            db.add(new_session)
            db.commit()
            db.refresh(new_session)
            current_session_id = new_session.id

        user_message = ChatMessage(session_id=current_session_id, sender_type="USER", message_text=req.message)
        db.add(user_message)
        db.commit()
        db.refresh(user_message)

        new_emotion_log = EmotionLog(message_id=user_message.id, predicted_emotion=predicted_emotion, confidence=emotion_score, raw_input=req.message)
        db.add(new_emotion_log)
        db.commit()
        
        # RAG 워크플로우 가동 (텍스트 답변 생성)
        ai_recommendation = rag_service.generate_fashion_recommendation(
            db=db, user_id=req.user_id, emotion=predicted_emotion, confidence=emotion_score, user_message=req.message, session_id=current_session_id
        )
        
        # AI 답변을 바탕으로 쇼핑 키워드 추출 & 네이버 검색
        search_keyword = "데일리 룩"
        recommended_products = []
        
        if os.getenv("OPENAI_API_KEY"):
            try:
                keyword_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
                parser = PydanticOutputParser(pydantic_object=AIResponseSchema)
                
                keyword_prompt = ChatPromptTemplate.from_template(
                    "다음 패션 추천글을 분석해서, 네이버 쇼핑에서 검색할 가장 적합한 '의류 쇼핑 키워드 딱 1개'를 추출해줘.\n"
                    "추천글:\n{recommendation}\n\n"
                    "{format_instructions}"
                )
                
                keyword_chain = keyword_prompt | keyword_llm | parser
                parsed_result = keyword_chain.invoke({
                    "recommendation": ai_recommendation,
                    "format_instructions": parser.get_format_instructions()
                })
                search_keyword = parsed_result.search_keyword
                
                # 추출된 키워드로 진짜 상품 검색
                recommended_products = search_naver_shopping(search_keyword, display=3)
            except Exception as e:
                print(f"⚠️ 쇼핑 키워드 추출 실패: {e}")

        # AI 텍스트 답변 DB 저장
        ai_message = ChatMessage(session_id=current_session_id, sender_type="AI", message_text=ai_recommendation)
        db.add(ai_message)
        db.commit()

        # 프론트엔드로 최종 응답 반환 (상품 리스트 포함)
        return {
            "status": "success",
            "session_id": current_session_id,
            "mapped_emotion": predicted_emotion,
            "ai_response": ai_recommendation,
            "search_keyword": search_keyword,
            "products": recommended_products # 배열 형태로 네이버 상품 3개
        }
        
    except Exception as e:
        db.rollback()
        return {"error": f"RAG 워크플로우 처리 중 에러 발생: {str(e)}"}