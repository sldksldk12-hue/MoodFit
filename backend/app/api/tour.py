# backend/app/api/tour.py
import os
import requests
import json
import urllib.parse
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from app.db.database import get_db
from app.models.models import TourLog

router = APIRouter()

@router.get("/logs", summary="관광 추천 로그 조회")
def get_tour_logs(db: Session = Depends(get_db)):
    """저장된 전체 관광지 추천 로그 목록을 최신순으로 가져옵니다."""
    try:
        logs = db.query(TourLog).order_by(TourLog.created_at.desc()).all()
        return logs
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"관광 로그 조회 실패: {str(e)}"
        )


def extract_destination(message: str) -> Optional[dict]:
    """사용자의 대화에서 관광지명 또는 축제명을 GPT를 통해 추출합니다.
    지명 원본(destination)과 검색 최적화용 단축 키워드(search_keyword)를 함께 반환합니다.
    """
    try:
        extraction_prompt = ChatPromptTemplate.from_messages([
            ("system", (
                "당신은 장소명 추출기입니다. 사용자의 질문을 분석해서, 방문하려는 '구체적인 관광지명 또는 축제명'이 존재하면 다음 정보를 추출해줘.\n"
                "1. destination: 가고자 하는 장소/축제의 풀네임 (예: '가평 자라섬 재즈페스티벌', '경복궁 야간개장')\n"
                "2. search_keyword: 검색 API(KTO)에서 잘 조회되도록 불필요한 수식어나 이벤트 단어(페스티벌, 축제, 야간개장 등)를 제거한 핵심 지명/관광지명 (예: '자라섬', '경복궁', '강동선사')\n"
                "만약 장소나 축제명이 전혀 언급되지 않았다면 둘 다 'NONE'으로 채워줘.\n"
                "결과는 반드시 JSON 형식으로만 반환해줘. (키: 'destination', 'search_keyword')"
            )),
            ("human", "{message}")
        ])
        
        # JSON 모드로 GPT 호출
        llm_json = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0,
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            model_kwargs={"response_format": {"type": "json_object"}}
        )
        chain = extraction_prompt | llm_json | StrOutputParser()
        res = chain.invoke({"message": message})
        data = json.loads(res)
        dest = data.get("destination", "NONE")
        kw = data.get("search_keyword", "NONE")
        if dest and dest.strip().upper() != "NONE":
            return {
                "destination": dest.strip(),
                "search_keyword": kw.strip() if kw and kw.strip().upper() != "NONE" else dest.strip()
            }
    except Exception as e:
        print(f"⚠️ 관광지 키워드 추출 오류: {e}")
    return None


def fetch_and_save_tour_log(db: Session, session_id: int, destination_info: dict) -> Optional[int]:
    """추출한 관광지 정보로 공공데이터 API를 검색하고 tour_logs에 저장합니다.
    동일 세션 내에 동일 관광지명이 이미 등록되어 있을 경우 기존 ID를 반환하여 재사용합니다.
    """
    api_key = os.getenv("TOUR_API_KEY")
    if not api_key:
        print("[Warning] TOUR_API_KEY가 없습니다.")
        return None
    
    destination = destination_info.get("destination")
    search_keyword = destination_info.get("search_keyword", destination)
    
    # 0. 동일 세션 내 동일 관광지명으로 기록된 로그가 이미 있는지 확인 (중복 적재 방지)
    existing_log = db.query(TourLog).filter(
        TourLog.session_id == session_id,
        TourLog.title == destination
    ).first()
    if existing_log:
        print(f"[Reuse] 동일 세션 내 중복 관광지 발견: [{existing_log.id}] {destination} (기존 로그 재사용)")
        return existing_log.id
    
    # 1. API 검색 (KTO searchKeyword2 국문 서비스)
    url = "http://apis.data.go.kr/B551011/KorService2/searchKeyword2"
    params = {
        "serviceKey": urllib.parse.unquote(api_key),
        "numOfRows": 1,
        "pageNo": 1,
        "MobileOS": "ETC",
        "MobileApp": "MoodFit",
        "_type": "json",
        "arrange": "A",
        "keyword": search_keyword
    }
    
    content_id = "NONE"
    content_type = "기타"
    addr = None
    map_x = None
    map_y = None
    title = destination
    
    try:
        response = requests.get(url, params=params, timeout=5)
        if response.status_code == 200:
            data = response.json()
            items = data.get("response", {}).get("body", {}).get("items", {})
            item_list = items.get("item", []) if isinstance(items, dict) else []
            if item_list:
                item = item_list[0]
                content_id = str(item.get("contentid", "NONE"))
                title = item.get("title", destination)
                addr = item.get("addr1")
                map_x = float(item["mapx"]) if item.get("mapx") else None
                map_y = float(item["mapy"]) if item.get("mapy") else None
                
                # contenttypeid 매핑
                content_type_id = str(item.get("contenttypeid", ""))
                type_mapping = {
                    "12": "관광지", "14": "문화시설", "15": "축제/공연/행사", 
                    "28": "레포츠", "32": "숙박", "38": "쇼핑", "39": "음식점"
                }
                content_type = type_mapping.get(content_type_id, "기타")
    except Exception as e:
        print(f"[Error] 공공데이터 관광지 검색 오류 (수동 모드 전환): {e}")
        
    # 2. DB 저장
    try:
        new_tour_log = TourLog(
            session_id=session_id,
            content_id=content_id,
            title=title,
            content_type=content_type,
            addr=addr,
            map_x=map_x,
            map_y=map_y
        )
        db.add(new_tour_log)
        db.commit()
        db.refresh(new_tour_log)
        print(f"[Success] 관광지 로그 저장 완료: [{new_tour_log.id}] {title} ({content_type})")
        return new_tour_log.id
    except Exception as db_err:
        db.rollback()
        print(f"[Error] 관광지 로그 DB 저장 실패: {db_err}")
        return None
