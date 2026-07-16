import os
from datetime import datetime
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.db.database import get_db
from app.models.models import EmotionLog, ChatMessage, ChatSession, WeatherLog, AiCallLog, User
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
            try:
                keyword_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
                parser = PydanticOutputParser(pydantic_object=AIResponseSchema)
                keyword_prompt = ChatPromptTemplate.from_template(
                    "다음 패션 추천글을 분석해서, 네이버 쇼핑에서 검색할 가장 적합한 '의류 쇼핑 키워드 딱 1개'를 추출해줘.\n추천글:\n{recommendation}\n\n{format_instructions}"
                )
                keyword_chain = keyword_prompt | keyword_llm | parser
                parsed_result = keyword_chain.invoke({
                    "recommendation": ai_recommendation, "format_instructions": parser.get_format_instructions()
                })
                search_keyword = parsed_result.search_keyword
                recommended_products = get_or_fetch_products(db, search_keyword, display=3)
                
                new_ai_log = AiCallLog(
                    chat_session_id=current_session_id, model_name="gpt-4o-mini", prompt_version="v1.0.0", log_status="SUCCESS"
                )
                db.add(new_ai_log)
            except Exception as e:
                print(f"⚠️ 쇼핑 키워드 추출 실패: {e}")

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