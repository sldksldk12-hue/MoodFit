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
from app.api.tour import extract_destination, fetch_and_save_tour_log

router = APIRouter()

@router.post("/emotion")
async def analyze_emotion_and_recommend(req: ChatRequest, request: Request, db: Session = Depends(get_db)):
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

        # 관광 목적지 정보 추출 및 수집 자동화
        tour_log_id = None
        extracted_dest = extract_destination(req.message)
        if extracted_dest:
            tour_log_id = fetch_and_save_tour_log(
                db=db, session_id=current_session_id, destination_info=extracted_dest
            )
            
        ai_recommendation, weather_log_id = rag_service.generate_fashion_recommendation(
            db=db, user_id=req.user_id, emotion=predicted_emotion, confidence=emotion_score, user_message=req.message, session_id=current_session_id
        )
        
        search_keyword = "데일리 룩"
        summary_reason = f"[{predicted_emotion}] 기분에 어울리는 추천 코디입니다." 
        recommended_products = []
        new_ai_log = None
        
        if os.getenv("OPENAI_API_KEY"):
            start_time = time.perf_counter()
            try:
                user_gender = user.gender if user else "공용"
                keyword_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
                parser = PydanticOutputParser(pydantic_object=AIResponseSchema)
                
                # 🌟 프롬프트 변경: [주의사항 5] 감성적인 3줄 요약 지시
                keyword_prompt = ChatPromptTemplate.from_template(
                    "다음 패션 추천글을 분석해서, 네이버 쇼핑에서 검색할 가장 핵심적인 '의류/잡화 쇼핑 키워드 최대 4개'와 '추천 이유 요약'을 추출해줘.\n"
                    "현재 유저 성별: {user_gender}\n"
                    "[주의사항 1]: '오버핏', '레인', '시원한', '편안한' 같은 수식어는 제외하고, 오직 명확한 카테고리/품목명(예: '가디건,청바지,스니커즈,크로스백')만 추출할 것!\n"
                    "[주의사항 2]: 최대 4개의 키워드를 추출할 때 상의, 하의, 신발, 악세사리(모자, 가방 등)를 각각 1개씩 골고루 포함시킬 것.\n"
                    "[주의사항 3]: 만약 추천글에 신발이나 악세사리가 직접적으로 명시되어 있지 않다면, 해당 코디에 가장 잘 어울리는 신발이나 악세사리를 AI가 스스로 판단하여 키워드에 추가할 것.\n"
                    "[주의사항 4]: 현재 유저 성별은 [{user_gender}]입니다. 유저 성별과 상충되는 단어는 절대 포함시키지 마세요.\n"
                    "[주의사항 5]: 전체 추천글을 바탕으로, 이 코디를 추천하는 이유를 '친한 친구나 친절한 매장 직원'이 옆에서 다정하게 설명해주듯 3줄(3문장) 정도로 요약해 주세요. 요약에는 유저의 현재 기분, 날씨, 장소 정보가 있다면 자연스럽게 포함하고, 누락된 정보가 있다면 억지로 지어내지 말고 있는 대화 내용만 바탕으로 부드럽게 요약하세요.\n\n"
                    "추천글:\n{recommendation}\n\n{format_instructions}"
                )
                keyword_chain = keyword_prompt | keyword_llm | parser
                
                with get_openai_callback() as cb:
                    parsed_result = keyword_chain.invoke({
                        "recommendation": ai_recommendation,
                        "user_gender": user_gender,
                        "format_instructions": parser.get_format_instructions()
                    })
                    
                    summary_reason = parsed_result.summary_reason
                    
                    raw_keywords = parsed_result.search_keyword.split(",")
                    keyword_list = [k.strip() for k in raw_keywords if k.strip()][:4]

                    weather_desc = None
                    if weather_log_id:
                        w_log = db.query(WeatherLog).filter(WeatherLog.id == weather_log_id).first()
                        if w_log:
                            weather_desc = w_log.condition_code

                    past_rec_sessions = db.query(RecommendationSession).filter(
                        RecommendationSession.chat_session_id == current_session_id
                    ).all()
                    
                    exclude_ids = []
                    for rs in past_rec_sessions:
                        for r_item in rs.items:
                            if r_item.product_id not in exclude_ids:
                                exclude_ids.append(r_item.product_id)

                    user_liked_colors = user.liked_colors if user else None
                    user_disliked_colors = user.disliked_colors if user else None
                    tour_cat = extracted_dest.get("content_type") if extracted_dest else None

                    recommended_products = []
                    final_search_keywords = []

                    if len(keyword_list) == 1:
                        items_per_keyword = 4
                    elif len(keyword_list) == 2:
                        items_per_keyword = 2
                    elif len(keyword_list) == 3:
                        items_per_keyword = 2 
                    else:
                        items_per_keyword = 1

                    for kw in keyword_list:
                        search_kw = kw
                        if user_gender == "남성":
                            search_kw = search_kw.replace("여성", "").replace("여자", "").replace("여성용", "").strip()
                            if "남성" not in search_kw and "남자" not in search_kw:
                                search_kw = f"남성 {search_kw}"
                        elif user_gender == "여성":
                            search_kw = search_kw.replace("남성", "").replace("남자", "").replace("남성용", "").strip()
                            if "여성" not in search_kw and "여자" not in search_kw:
                                search_kw = f"여성 {search_kw}"
                        
                        final_search_keywords.append(search_kw)

                        fetched_items = get_or_fetch_products(
                            db=db,
                            keyword=search_kw,
                            display=items_per_keyword,
                            emotion=predicted_emotion,
                            weather_desc=weather_desc,
                            tour_category=tour_cat,
                            gender=user_gender,
                            exclude_ids=exclude_ids,
                            liked_colors=user_liked_colors,
                            disliked_colors=user_disliked_colors
                        )
                        
                        recommended_products.extend(fetched_items)
                        
                        for item in fetched_items:
                            exclude_ids.append(item['id'])

                    # 🌟 넉넉하게 가져온 상품 리스트를 정확히 4개까지만 자르기
                    recommended_products = recommended_products[:4]

                    search_keyword = ", ".join(final_search_keywords)
                    
                    latency_ms = int((time.perf_counter() - start_time) * 1000)
                    new_ai_log = AiCallLog(
                        chat_session_id=current_session_id,
                        model_name="gpt-4o-mini",
                        prompt_version="v1.2.0", # 프롬프트 버전 업데이트
                        log_status="SUCCESS",
                        prompt_tokens=cb.prompt_tokens,
                        completion_tokens=cb.completion_tokens,
                        total_tokens=cb.total_tokens,
                        latency_ms=latency_ms
                    )
                    db.add(new_ai_log)
                    db.commit()             
                    db.refresh(new_ai_log)  
                    
            except Exception as e:
                latency_ms = int((time.perf_counter() - start_time) * 1000)
                print(f"⚠️ 쇼핑 키워드 추출 실패: {e}")
                
                new_ai_log = AiCallLog(
                    chat_session_id=current_session_id,
                    model_name="gpt-4o-mini",
                    prompt_version="v1.2.0",
                    log_status="FAILURE",
                    failure_reason=str(e),
                    latency_ms=latency_ms
                )
                db.add(new_ai_log)
                db.commit()             
                db.refresh(new_ai_log)

        if recommended_products:
            try:
                new_rec_session = RecommendationSession(
                    user_id=req.user_id,
                    chat_session_id=current_session_id,
                    emotion_log_id=new_emotion_log.id,
                    weather_log_id=weather_log_id,
                    tour_log_id=tour_log_id
                )
                db.add(new_rec_session)
                db.flush() 
                
                if new_ai_log:
                    new_ai_log.recommendation_session_id = new_rec_session.id
                
                base_score = float(emotion_score * 100)
                
                for item in recommended_products:
                    prod_id = item.get("id")
                    prod_title = item.get("title", "")
                    
                    if prod_id:
                        bonus = 5.0 if any(kw in prod_title for kw in final_search_keywords) else 0.0
                        final_score = min(base_score + bonus, 99.9)
                        
                        new_rec_item = RecommendationItem(
                            recommendation_session_id=new_rec_session.id,
                            product_id=prod_id,
                            score=round(final_score, 1),
                            recommendation_reason=summary_reason 
                        )
                        db.add(new_rec_item)
            except Exception as rec_err:
                print(f"⚠️ 추천 세션 저장 실패: {rec_err}")
                db.rollback() 

        ai_message = ChatMessage(session_id=current_session_id, sender_type="AI", message_text=ai_recommendation)
        db.add(ai_message)
        db.commit()

        return {
            "status": "success",
            "session_id": current_session_id,
            "mapped_emotion": predicted_emotion,
            "ai_response": ai_recommendation,
            "summary_reason": summary_reason,
            "search_keyword": search_keyword,
            "products": recommended_products 
        }
    except Exception as e:
        db.rollback()
        return {"error": f"RAG 워크플로우 처리 중 에러 발생: {str(e)}"}