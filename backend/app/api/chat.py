import os
import time
from datetime import datetime
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.callbacks import get_openai_callback

from app.db.database import get_db
from app.models.models import EmotionLog, ChatMessage, ChatSession, WeatherLog, AiCallLog, User, RecommendationSession, RecommendationItem
from app.schemas.chat_schema import ChatRequest, AIResponseSchema
from app.domains.product.service import get_or_fetch_products

router = APIRouter()

@router.post("/emotion")
async def analyze_emotion_and_recommend(req: ChatRequest, request: Request, db: Session = Depends(get_db)):
    # main.py에서 로드한 AI 모델을 request.app.state를 통해 안전하게 가져옵니다.
    classifier = request.app.state.ml_models.get("emotion_classifier")
    rag_service = request.app.state.rag_service
    
    if not classifier or not rag_service:
        return {"error": "AI 서버 인프라가 준비되지 않았습니다."}
    
    result = classifier(req.message)
    raw_label = result[0]['label']
    emotion_score = result[0]['score']
    
    emotion_map = {
        "happy": "joy", "sad": "sadness", "angry": "anger", "anxious": "fear", 
        "embarrassed": "surprise", "heartache": "sadness", "행복": "joy", 
        "슬픔": "sadness", "분노": "anger", "불안": "fear", "당황": "surprise", "상처": "sadness"
    }
    
    if emotion_score < 0.60:
        predicted_emotion = "neutral"
        print(f"🛡️ 확신도 부족({emotion_score:.2f}) -> 감정 중립(neutral) 처리됨")
    else:
        predicted_emotion = emotion_map.get(raw_label, "neutral")
        
    try:
        user = db.query(User).filter(User.id == req.user_id).first()
        if not user:
            dummy_user = User(id=req.user_id, user_account="test_user", email="test@test.com", password_hash="1234")
            db.add(dummy_user)
            db.commit()

        if req.session_id:
            current_session_id = req.session_id
        else:
            new_session = ChatSession(user_id=req.user_id, session_uuid=f"session-{datetime.now().timestamp()}")
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

        new_weather_log = WeatherLog(session_id=current_session_id, region_name="Seoul", temperature=25.0, condition_code="Clear")
        db.add(new_weather_log)
        db.commit()
        
        ai_recommendation = rag_service.generate_fashion_recommendation(
            db=db, user_id=req.user_id, emotion=predicted_emotion, confidence=emotion_score, user_message=req.message, session_id=current_session_id
        )
        
        search_keyword = "데일리 룩"
        recommended_products = []
        
        if os.getenv("OPENAI_API_KEY"):
            start_time = time.perf_counter()
            try:
                keyword_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
                parser = PydanticOutputParser(pydantic_object=AIResponseSchema)
                # 프롬프트 내용만 업그레이드
                keyword_prompt = ChatPromptTemplate.from_template(
                    "다음 패션 추천글을 분석해서, 네이버 쇼핑에서 검색할 가장 적합한 '의류 쇼핑 키워드 딱 1개'를 추출해줘.\n"
                    "[주의사항]: '화려한', '시원한', '편안한', '가벼운' 같은 형용사/수식어는 절대 포함하지 말고, 오직 상품의 종류(예: '그래픽 티셔츠', '와이드 데님 팬츠', '린넨 셔츠')만 추출할 것!\n\n"
                    "추천글:\n{recommendation}\n\n{format_instructions}"
                )
                keyword_chain = keyword_prompt | keyword_llm | parser
                
                with get_openai_callback() as cb:
                    parsed_result = keyword_chain.invoke({
                        "recommendation": ai_recommendation, "format_instructions": parser.get_format_instructions()
                    })
                    
                    latency_ms = int((time.perf_counter() - start_time) * 1000)
                    search_keyword = parsed_result.search_keyword
                    recommended_products = get_or_fetch_products(db, search_keyword, display=3)
                    
                    new_ai_log = AiCallLog(
                        chat_session_id=current_session_id,
                        model_name="gpt-4o-mini",
                        prompt_version="v1.0.0",
                        log_status="SUCCESS",
                        prompt_tokens=cb.prompt_tokens,
                        completion_tokens=cb.completion_tokens,
                        total_tokens=cb.total_tokens,
                        latency_ms=latency_ms
                    )
                    db.add(new_ai_log)
            except Exception as e:
                latency_ms = int((time.perf_counter() - start_time) * 1000)
                print(f"⚠️ 쇼핑 키워드 추출 실패: {e}")
                
                new_ai_log = AiCallLog(
                    chat_session_id=current_session_id,
                    model_name="gpt-4o-mini",
                    prompt_version="v1.0.0",
                    log_status="FAILURE",
                    failure_reason=str(e),
                    latency_ms=latency_ms
                )
                db.add(new_ai_log)

        # 🌟 추천 세션 및 상품 상세 매핑 기록 (recommendation_sessions / recommendation_items)
        # 🌟 추천 세션 및 상품 상세 매핑 기록 (recommendation_sessions / recommendation_items)
        if recommended_products:
            try:
                # 1. 추천 세션 마스터 등록
                new_rec_session = RecommendationSession(
                    user_id=req.user_id,
                    chat_session_id=current_session_id,
                    emotion_log_id=new_emotion_log.id,
                    weather_log_id=new_weather_log.id,
                    tour_log_id=None
                )
                db.add(new_rec_session)
                db.flush()  # ID 임시 획득
                
                # 2. 추천 아이템 상세 등록
                for item in recommended_products:
                    prod_id = item.get("id")
                    if prod_id:
                        new_rec_item = RecommendationItem(
                            recommendation_session_id=new_rec_session.id,
                            product_id=prod_id,
                            score=90.0,
                            recommendation_reason=f"[{predicted_emotion}] 기분과 날씨에 매칭되는 추천 의류 상품입니다."
                        )
                        db.add(new_rec_item)
            except Exception as rec_err:
                print(f"⚠️ 추천 세션 저장 실패: {rec_err}")
                db.rollback()  # 에러 발생 시 DB 상태를 안전하게 초기화하는 코드 추가

        ai_message = ChatMessage(session_id=current_session_id, sender_type="AI", message_text=ai_recommendation)
        db.add(ai_message)
        db.commit()

        return {
            "status": "success",
            "session_id": current_session_id,
            "mapped_emotion": predicted_emotion,
            "ai_response": ai_recommendation,
            "search_keyword": search_keyword,
            "products": recommended_products 
        }
    except Exception as e:
        db.rollback()
        return {"error": f"RAG 워크플로우 처리 중 에러 발생: {str(e)}"}