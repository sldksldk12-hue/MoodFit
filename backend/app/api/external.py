import os
import requests
import urllib.parse
from datetime import datetime
from fastapi import APIRouter

router = APIRouter()

DEFAULT_FESTIVALS = [
    {
        "id": 1,
        "title": "강동선사문화축제",
        "location": "서울 강동구 암사동 선사유적지",
        "period": "2026.10.11 ~ 2026.10.13",
        "image_url": "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80",
        "description": "선사 시대 문화체험과 함께 즐기는 신나는 강동구 대표 가을 축제",
        "tags": ["축제", "문화", "나들이"]
    },
    {
        "id": 2,
        "title": "자라섬 재즈 페스티벌",
        "location": "경기도 가평군 자라섬",
        "period": "2026.10.18 ~ 2026.10.20",
        "image_url": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
        "description": "자연 속에서 울려 퍼지는 감성 가득한 국내 최대 재즈 음악 축제",
        "tags": ["음악", "자연", "캠핑"]
    },
    {
        "id": 3,
        "title": "서울 세계 불꽃 축제",
        "location": "서울 영등포구 여의도 한강공원",
        "period": "2026.10.05 ~ 2026.10.05",
        "image_url": "https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?auto=format&fit=crop&w=800&q=80",
        "description": "밤하늘을 수놓는 환상적인 불꽃 쇼와 한강변 야간 데이트 코디 추천",
        "tags": ["야경", "데이트", "불꽃쇼"]
    }
]

DEFAULT_WEATHER = {
    "name": "Seoul",
    "weather": [{"main": "Clear", "description": "맑음"}],
    "main": {"temp": 24.5}
}

@router.get("/weather")
async def get_current_weather():
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        return DEFAULT_WEATHER
    city = "Seoul"
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric&lang=kr"
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            return response.json() 
    except Exception as e:
        print(f"⚠️ 날씨 API 오류: {e}")
    return DEFAULT_WEATHER
    
@router.get("/festival")
async def get_recommended_festivals():
    api_key = os.getenv("TOUR_API_KEY")
    if not api_key:
        return {"status": "success", "data": DEFAULT_FESTIVALS}
    try:
        today_str = datetime.now().strftime("%Y0101")
        raw_url = f"https://apis.data.go.kr/B551011/KorService2/searchFestival2?serviceKey={api_key}&numOfRows=15&pageNo=1&MobileOS=ETC&MobileApp=MoodFit&_type=json&arrange=A&eventStartDate={today_str}"
        response = requests.get(raw_url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            items = data.get("response", {}).get("body", {}).get("items", {})
            item_list = items.get("item", []) if isinstance(items, dict) else (items if isinstance(items, list) else [])
            if isinstance(item_list, dict):
                item_list = [item_list]

            if item_list and len(item_list) > 0:
                festivals = []
                for idx, item in enumerate(item_list):
                    start_date = str(item.get("eventstartdate", ""))
                    end_date = str(item.get("eventenddate", ""))
                    period = f"{start_date[:4]}.{start_date[4:6]}.{start_date[6:]} ~ {end_date[:4]}.{end_date[4:6]}.{end_date[6:]}" if len(start_date) >= 8 else "상시 진행"
                    img = item.get("firstimage") or item.get("firstimage2") or "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80"
                    festivals.append({
                        "id": idx + 1,
                        "title": item.get("title", "축제명 없음"),
                        "location": item.get("addr1", "장소 미상"),
                        "period": period,
                        "image_url": img,
                        "description": "자세한 사항은 한국관광공사(VisitKorea)를 참고해 주세요.",
                        "tags": ["축제", "관광", "나들이"]
                    })
                return {"status": "success", "data": festivals[:6]}
    except requests.exceptions.Timeout:
        print("⚠️ 공공데이터 포털(data.go.kr) 응답 지연으로 기본 축제 카드를 표시합니다.")
    except Exception as e:
        print(f"⚠️ 축제 API 파싱 오류: {e}")
    return {"status": "success", "data": DEFAULT_FESTIVALS}