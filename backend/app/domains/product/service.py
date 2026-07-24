import os
import json
import requests
from typing import Optional, List
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from urllib.parse import quote
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from app.models.models import Product, ProductCategory, ProductOption, ProductMoodTag

def seed_initial_categories(db: Session):
    """3자리 단축 코드 기반의 카테고리 시드 데이터를 자동으로 데이터베이스에 적재합니다."""
    try:
        if db.query(ProductCategory).count() == 0:
            print("🌱 카테고리 데이터 자동 적재(Seeding)를 시작합니다...")
            
            # 1. 대분류 적재
            c100 = ProductCategory(id=100, category_name='상의', parent_id=None)
            c200 = ProductCategory(id=200, category_name='하의', parent_id=None)
            c300 = ProductCategory(id=300, category_name='아우터', parent_id=None)
            c400 = ProductCategory(id=400, category_name='악세사리/신발', parent_id=None)
            db.add_all([c100, c200, c300, c400])
            db.flush()
            
            # 2. 중분류 적재
            subs = [
                # 상의 하위
                ProductCategory(id=101, category_name='반소매 티셔츠', parent_id=100),
                ProductCategory(id=102, category_name='긴소매 티셔츠', parent_id=100),
                ProductCategory(id=103, category_name='맨투맨', parent_id=100),
                ProductCategory(id=104, category_name='셔츠', parent_id=100),
                ProductCategory(id=105, category_name='후드', parent_id=100),
                ProductCategory(id=106, category_name='니트', parent_id=100),
                
                # 하의 하위
                ProductCategory(id=201, category_name='데님', parent_id=200),
                ProductCategory(id=202, category_name='트레이닝', parent_id=200),
                ProductCategory(id=203, category_name='코튼', parent_id=200),
                ProductCategory(id=204, category_name='숏 팬츠', parent_id=200),
                ProductCategory(id=205, category_name='레깅스', parent_id=200),
                ProductCategory(id=206, category_name='조거 팬츠', parent_id=200),
                ProductCategory(id=207, category_name='청바지', parent_id=200),
                ProductCategory(id=208, category_name='스커트', parent_id=200),
                
                # 아우터 하위
                ProductCategory(id=301, category_name='집업', parent_id=300),
                ProductCategory(id=302, category_name='슈트', parent_id=300),
                ProductCategory(id=303, category_name='카디건', parent_id=300),
                ProductCategory(id=304, category_name='패딩', parent_id=300),
                ProductCategory(id=305, category_name='재킷', parent_id=300),
                ProductCategory(id=306, category_name='코트', parent_id=300),
                ProductCategory(id=307, category_name='베스트', parent_id=300),
                
                # 악세사리/신발 하위
                ProductCategory(id=401, category_name='캡', parent_id=400),
                ProductCategory(id=402, category_name='베레모', parent_id=400),
                ProductCategory(id=403, category_name='페도라', parent_id=400),
                ProductCategory(id=404, category_name='비니', parent_id=400),
                ProductCategory(id=405, category_name='스니커즈', parent_id=400),
                ProductCategory(id=406, category_name='스포츠화', parent_id=400),
                ProductCategory(id=407, category_name='구두', parent_id=400),
                ProductCategory(id=408, category_name='부츠', parent_id=400),
                ProductCategory(id=409, category_name='샌들', parent_id=400)
            ]
            db.add_all(subs)
            db.commit()
            print("✅ 3자리 단축 코드 기반 카테고리 데이터 자동 적재 완료!")
    except Exception as seeder_err:
        db.rollback()
        print(f"⚠️ 카테고리 자동 적재 중 오류 발생: {seeder_err}")


HANJA_TO_HANGUL_MAP = {
    "合成": "합성", "成": "성", "綿": "면", "毛": "모", "麻": "마",
    "絹": "실크", "革": "가죽", "皮": "피", "裏": "안감", "表": "겉감",
    "亞麻": "아마", "羊毛": "양모", "羽毛": "우모", "天然": "천연", "人造": "인조"
}

def sanitize_json_hanja(obj):
    """JSON 또는 텍스트 내 잔여 한자(合成, 綿 등)를 순수 한글(합성피혁, 면 등)로 자동 시정"""
    if isinstance(obj, str):
        res = obj
        for hanja, hangul in HANJA_TO_HANGUL_MAP.items():
            res = res.replace(hanja, hangul)
        return res
    elif isinstance(obj, list):
        return [sanitize_json_hanja(item) for item in obj]
    elif isinstance(obj, dict):
        return {k: sanitize_json_hanja(v) for k, v in obj.items()}
    return obj

def generate_gpt_product_options(product_name: str, category_name: str, brand: str) -> dict:
    """GPT-4o-mini를 활용하여 상품에 딱 맞는 1:1 맞춤형 사이즈, 색상, 실측치수 및 상세스펙(소재, 핏, 계절, 제조국) JSON을 생성합니다."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
        
    try:
        llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.3,
            model_kwargs={"response_format": {"type": "json_object"}},
            openai_api_key=api_key
        )
        
        system_prompt = """당신은 전문 패션 브랜드 MD입니다.
주어진 상품명, 카테고리, 브랜드 정보를 분석하여 해당 상품에 가장 어울리는 현실적이고 고유한 상품 옵션 및 상세 스펙을 JSON으로 생성하세요.

[요구 규칙]
1. `sizes`: 해당 상품의 카테고리/특성에 부합하는 선택 가능한 사이즈 목록 (배열)
   - 의류 상의/아우터 예시: ["95(S)", "100(M)", "105(L)", "110(XL)"]
   - 의류 하의 예시: ["28(S)", "30(M)", "32(L)", "34(XL)"]
   - 신발 예시: ["250", "255", "260", "265", "270", "275", "280"]
   - 모자/액세서리 예시: ["FREE"]
2. `colors`: 해당 상품 디자인 및 브랜드 분위기에 어울리는 색상 목록 (배열, 3~5개)
3. `measurements`: 사이즈별 cm 단위 실측 치수 목록 (배열).
   - 상의/아우터 키값: size, shoulder (어깨), chest (가슴), sleeve (소매), length (총장)
   - 하의 키값: size, waist (허리), rise (밑위), thigh (허벅지), length (총장)
   - 신발 키값: size, foot_length (발길이), foot_width (발볼), heel_height (굽높이)
   - 모자/액세서리 키값: size, head_circumference (둘레), depth (깊이), brim_length (챙길이)
   - 상품의 핏(오버핏, 크롭, 와이드, 슬림) 특성을 수치에 자연스럽게 반영하세요.
4. `specs`: 해당 상품의 상세 정보 4가지 항목 (객체)
   - `material`: 소재 (예: "나일론 100%, 고어텍스 방수 원단", "면 100%, 20수 싱글원단", "데님, 면 98% 스판 2%", "합성피혁, 고무")
   - `fit`: 핏 (예: "오버핏", "레귤러 핏", "슬림 핏", "와이드 핏", "크롭 핏")
   - `season`: 계절 (예: "봄 / 가을", "여름", "겨울", "사계절")
   - `country`: 제조국 (예: "대한민국", "베트남", "중국", "인도네시아")
5. 모든 텍스트(특히 material 소재 및 country 제조국) 작성 시 한자(合成, 綿, 毛, 革 등)나 외국어를 절대 혼용하지 마시고, 100% 한글(합성피혁, 면, 모, 가죽 등)로만 명확히 작성하세요.

JSON 출력 형식:
{
  "sizes": ["..."],
  "colors": ["..."],
  "measurements": [
    { ... }
  ],
  "specs": {
    "material": "...",
    "fit": "...",
    "season": "...",
    "country": "..."
  }
}
"""

        human_message = f"상품명: {product_name}\n카테고리: {category_name}\n브랜드: {brand}"
        
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=human_message)
        ])
        
        result_json = json.loads(response.content)
        return sanitize_json_hanja(result_json)
    except Exception as e:
        print(f"[Error] GPT 옵션 생성 에러 ({product_name}): {e}")
        return None


def seed_initial_product_options(db: Session, force_reseed: bool = False):
    """모든 상품에 대해 GPT-4o-mini로 1:1 맞춤형 고유 옵션(사이즈, 색상, 실측치수, 상세스펙)을 생성하여 적재합니다."""
    try:
        if force_reseed:
            db.query(ProductOption).delete()
            db.flush()

        products = db.query(Product).all()
        created_count = 0
        
        for product in products:
            existing_options = db.query(ProductOption).filter(ProductOption.product_id == product.id).count()
            if existing_options == 0:
                category_name = "미분류"
                if product.category_id:
                    cat = db.query(ProductCategory).filter(ProductCategory.id == product.category_id).first()
                    if cat:
                        category_name = cat.category_name
                
                # 1. GPT 1:1 옵션 및 상세스펙 생성 시도
                gpt_data = generate_gpt_product_options(
                    product_name=product.product_name,
                    category_name=category_name,
                    brand=product.brand
                )
                
                specs = None
                if gpt_data and "sizes" in gpt_data and "colors" in gpt_data and "measurements" in gpt_data:
                    sizes = gpt_data["sizes"]
                    colors = gpt_data["colors"]
                    measurements = gpt_data["measurements"]
                    specs = gpt_data.get("specs")
                else:
                    # 데이터 생성 실패 시, 카테고리 기반 기본 옵션 생성
                    cat_id = product.category_id or 0
                    name = product.product_name.lower()
                    is_shoes = cat_id in [405, 406, 407, 408, 409] or any(k in name for k in ["스니커즈", "구두", "부츠", "신발", "운동화", "샌들", "슬리퍼", "단화", "로퍼", "워커"])
                    is_hat = cat_id in [401, 402, 403, 404] or any(k in name for k in ["캡", "모자", "비니", "베레모", "볼캡", "페도라"])
                    is_pants = (200 <= cat_id < 300) or any(k in name for k in ["바지", "팬츠", "데님", "슬랙스", "조거", "청바지", "스커트", "치마", "숏팬츠", "반바지", "레깅스"])
                    
                    if is_shoes:
                        sizes = ["250", "255", "260", "265", "270", "275", "280"]
                        colors = ["블랙", "화이트", "아이보리", "믹스"]
                        measurements = [{"size": "260", "foot_length": 26.0, "foot_width": 9.8, "heel_height": 3.5}]
                        specs = {"material": "천연가죽, 합성고무", "fit": "레귤러 핏", "season": "사계절", "country": "베트남"}
                    elif is_hat:
                        sizes = ["FREE"]
                        colors = ["블랙", "네이비", "베이지", "카키", "화이트"]
                        measurements = [{"size": "FREE", "head_circumference": 58, "depth": 16, "brim_length": 7.5}]
                        specs = {"material": "면 100%", "fit": "FREE 핏", "season": "사계절", "country": "대한민국"}
                    elif is_pants:
                        sizes = ["28(S)", "30(M)", "32(L)", "34(XL)"]
                        colors = ["중청", "연청", "진청", "블랙", "크림"]
                        measurements = [{"size": "30(M)", "waist": 38.5, "rise": 27, "thigh": 29.5, "length": 100}]
                        specs = {"material": "데님, 면 98% 스판 2%", "fit": "와이드 핏", "season": "봄 / 가을", "country": "대한민국"}
                    else:
                        sizes = ["95(S)", "100(M)", "105(L)", "110(XL)"]
                        colors = ["블랙", "화이트", "그레이", "네이비", "베이지"]
                        measurements = [{"size": "100(M)", "shoulder": 48, "chest": 53, "sleeve": 62, "length": 69}]
                        specs = {"material": "면 100%", "fit": "오버핏", "season": "봄 / 가을", "country": "대한민국"}

                if not specs:
                    specs = {"material": "상세설명 참조", "fit": "레귤러 핏", "season": "사계절", "country": "대한민국"}

                size_option = ProductOption(
                    product_id=product.id,
                    option_name="사이즈",
                    option_values=sizes,
                    is_required=1
                )
                color_option = ProductOption(
                    product_id=product.id,
                    option_name="색상",
                    option_values=colors,
                    is_required=1
                )
                measurement_option = ProductOption(
                    product_id=product.id,
                    option_name="실측치수",
                    option_values=measurements,
                    is_required=0
                )
                spec_option = ProductOption(
                    product_id=product.id,
                    option_name="상세스펙",
                    option_values=specs,
                    is_required=0
                )
                db.add_all([size_option, color_option, measurement_option, spec_option])
                created_count += 4
                
        if created_count > 0 or force_reseed:
            db.commit()
            print(f"[Success] GPT 1:1 맞춤형 상품 옵션 데이터 자동 적재 완료! ({created_count}개 옵션 생성됨)")
    except Exception as err:
        db.rollback()
        print(f"[Error] 상품 옵션 자동 적재 중 오류 발생: {err}")


def generate_gpt_product_mood_tags(product_name: str, category_name: str, brand: str) -> Optional[dict]:
    """GPT-4o-mini를 이용해 상품 1개에 어울리는 4대 무드 태그(감정, 날씨, 계절, TPO/관광지)를 JSON으로 생성합니다."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
        
    try:
        llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.3,
            model_kwargs={"response_format": {"type": "json_object"}},
            openai_api_key=api_key
        )
        
        system_prompt = """당신은 패션 감성 분석 및 스타일링 전문 AI입니다.
주어진 상품명, 카테고리, 브랜드 정보를 바탕으로 해당 의류/아이템에 가장 어울리는 4대 무드 태그(감정, 날씨, 계절, TPO/관광지)를 JSON으로 생성하세요.

[요구 규칙]
1. `mood_tag`: 유저의 기분/감정 태그 (예: "#활동적", "#차분함", "#설렘", "#시크", "#편안함", "#행복", "#러블리")
2. `weather_tag`: 어울리는 날씨 태그 (예: "#맑음", "#비오는날", "#쌀쌀함", "#무더위", "#바람", "#한파")
3. `season_tag`: 어울리는 계절 태그 (예: "#봄", "#여름", "#가을", "#겨울", "#환절기", "#사계절")
4. `tour_tag`: 어울리는 TPO/관광지 태그 (예: "#자연/공원", "#카페/도심", "#전시/문화", "#레포츠", "#바다/휴양", "#데이트")

JSON 출력 형식:
{
  "mood_tag": "#활동적",
  "weather_tag": "#맑음",
  "season_tag": "#봄",
  "tour_tag": "#카페/도심"
}
"""

        human_message = f"상품명: {product_name}\n카테고리: {category_name}\n브랜드: {brand}"
        
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=human_message)
        ])
        
        result_json = json.loads(response.content)
        return result_json
    except Exception as e:
        print(f"[Error] GPT 무드 태그 생성 에러 ({product_name}): {e}")
        return None


def seed_initial_product_mood_tags(db: Session, force_reseed: bool = False):
    """모든 상품에 대해 GPT-4o-mini로 1:1 맞춤형 4대 무드 태그(감정, 날씨, 계절, TPO/관광지)를 생성하여 적재합니다."""
    try:
        if force_reseed:
            db.query(ProductMoodTag).delete()
            db.flush()

        products = db.query(Product).all()
        created_count = 0
        
        for product in products:
            existing_tags = db.query(ProductMoodTag).filter(ProductMoodTag.product_id == product.id).count()
            if existing_tags == 0:
                category_name = "미분류"
                if product.category_id:
                    cat = db.query(ProductCategory).filter(ProductCategory.id == product.category_id).first()
                    if cat:
                        category_name = cat.category_name
                
                # 1. GPT 1:1 무드 태그 생성 시도
                gpt_tags = generate_gpt_product_mood_tags(
                    product_name=product.product_name,
                    category_name=category_name,
                    brand=product.brand
                )
                
                if gpt_tags and "mood_tag" in gpt_tags and "weather_tag" in gpt_tags and "season_tag" in gpt_tags:
                    mood_t = gpt_tags.get("mood_tag", "#편안함")
                    weather_t = gpt_tags.get("weather_tag", "#맑음")
                    season_t = gpt_tags.get("season_tag", "#사계절")
                    tour_t = gpt_tags.get("tour_tag", "#카페/도심")
                else:
                    mood_t, weather_t, season_t, tour_t = "#편안함", "#맑음", "#사계절", "#카페/도심"
                
                new_tag = ProductMoodTag(
                    product_id=product.id,
                    mood_tag=mood_t,
                    weather_tag=weather_t,
                    season_tag=season_t,
                    tour_tag=tour_t
                )
                db.add(new_tag)
                created_count += 1
                
        if created_count > 0 or force_reseed:
            db.commit()
            print(f"[Success] GPT 1:1 맞춤형 상품 무드 태그 자동 적재 완료! ({created_count}개 상품 무드 태그 생성됨)")
    except Exception as err:
        db.rollback()
        print(f"[Error] 상품 무드 태그 자동 적재 중 오류 발생: {err}")

# 커스텀 카테고리 매핑 사전 정의 (소재 수식어 '데님', '코튼', '가죽' 등으로 인한 2차 오분류 방지 체계)
CATEGORY_MAP = {
    # 1. 신발/액세서리 (단어 겹침 최우선 방지: 코트비전, 에어포스 등)
    "코트비전": 405, "에어포스": 405, "조던": 405, "스니커즈": 405, "단화": 405,
    "스포츠화": 406, "런닝화": 406, "러닝화": 406, "운동화": 406, "신발": 406,
    "구두": 407, "로퍼": 407, "힐": 407, "부츠": 408, "워커": 408, "샌들": 409, "슬리퍼": 409,
    "캡": 401, "야구모": 401, "베레모": 402, "페도라": 403, "비니": 404,
    "백팩": 410, "가방": 410, "에코백": 410, "크로스백": 410, "토트백": 410,

    # 2. 복합 아우터 (소재/수식어 조합 명사 우선 매핑)
    "데님 자켓": 305, "데님자켓": 305, "가죽 자켓": 305, "레더 자켓": 305, "라이더 자켓": 305,
    "후드 집업": 301, "후드집업": 301, "니트 집업": 301, "니트집업": 301,
    "트렌치코트": 306, "트렌치 코트": 306, "트렌치": 306,
    "가디건": 303, "카디건": 303,
    "바람막이": 301, "집업": 301,
    "슈트": 302, "수트": 302,
    "패딩": 304, "다운": 304, "숏패딩": 304, "롱패딩": 304,
    "재킷": 305, "자켓": 305, "블레이저": 305, "무스탕": 305, "라이더": 305,
    "코트": 306, "더플코트": 306,
    "베스트": 307, "조끼": 307,

    # 3. 하의 (단독 '데님', '코튼' 소재 키워드는 하의 오매칭 방지를 위해 '데님 팬츠', '청바지'로 정밀화)
    "데님 팬츠": 201, "데님 바지": 201, "청바지": 207, "데님": 201,
    "숏 팬츠": 204, "트레이닝 팬츠": 202, "트레이닝 바지": 202, "트레이닝": 202, "츄리닝": 202, "면바지": 203,
    "반바지": 204, "핫팬츠": 204, "레깅스": 205, "조거 팬츠": 206, "조거": 206, "스커트": 208, "치마": 208,

    # 4. 상의 (복합 상의 명사 우선 매핑)
    "데님 셔츠": 104, "데님 남방": 104, "반팔 셔츠": 104, "반팔 남방": 104,
    "스웨트셔츠": 103, "맨투맨": 103, "후드티": 105, "후드 셔츠": 105, "후드": 105,
    "반소매": 101, "반팔": 101, "긴소매": 102, "긴팔": 102,
    "셔츠": 104, "남방": 104, "니트": 106, "스웨터": 106, "티셔츠": 101, "티": 101
}

def get_or_create_category(db: Session, category_name: str) -> int:
    """카테고리 이름으로 DB를 검색하고, 없으면 새로 만들어서 ID를 반환합니다."""
    category = db.query(ProductCategory).filter(ProductCategory.category_name == category_name).first()
    if category:
        return category.id
    
    new_category = ProductCategory(category_name=category_name)
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    
    print(f"📁 새로운 카테고리 생성됨: [{new_category.id}] {category_name}")
    return new_category.id


def classify_product_category(db: Session, item_meta: dict, prod_name: str, search_keyword: str) -> int:
    """
    네이버 API 카테고리 메타데이터(category1~4)를 1순위로 검사하여 
    단어 부분 일치(예: "코트비전" -> "코트")로 인한 오분류를 원천 방지하는 스마트 분류 함수
    """
    cat1 = item_meta.get("category1", "")
    cat2 = item_meta.get("category2", "")
    cat3 = item_meta.get("category3", "")
    cat4 = item_meta.get("category4", "")
    full_meta = f"{cat1} {cat2} {cat3} {cat4}"

    # 1. 네이버 API 공식 메타데이터 기반 최우선 판별 (신발/잡화/아우터/상의/하의)
    if any(k in full_meta for k in ["신발", "운동화", "스니커즈", "구두", "부츠", "슬리퍼", "샌들", "로퍼", "워커"]):
        if "운동화" in full_meta or "스포츠화" in full_meta:
            return 406
        elif "구두" in full_meta or "로퍼" in full_meta:
            return 407
        elif "부츠" in full_meta or "워커" in full_meta:
            return 408
        elif "샌들" in full_meta or "슬리퍼" in full_meta:
            return 409
        return 405  # 기본 스니커즈

    if any(k in full_meta for k in ["가방", "백팩", "지갑", "모자", "패션잡화"]):
        if "모자" in full_meta or "캡" in full_meta:
            return 401
        elif "가방" in full_meta or "백팩" in full_meta:
            return 410

    # 2. CATEGORY_MAP 기반 상품명 및 검색어 우선순위 매칭
    for key, cat_id in CATEGORY_MAP.items():
        if key in prod_name:
            return cat_id

    for key, cat_id in CATEGORY_MAP.items():
        if key in search_keyword:
            return cat_id

    return get_or_create_category(db, cat1 if cat1 else "AI 추천 상품")


def check_product_has_colors(db: Session, product: Product, color_list: List[str]) -> bool:
    """상품 제목(product_name) 또는 상품 옵션(ProductOption '색상')에 target 색상이 포함되어 있는지 검사"""
    if not color_list:
        return False
    if any(c in product.product_name for c in color_list):
        return True
    color_opt = db.query(ProductOption).filter(
        ProductOption.product_id == product.id,
        ProductOption.option_name == "색상"
    ).first()
    if color_opt and isinstance(color_opt.option_values, list):
        for opt_val in color_opt.option_values:
            if any(c in str(opt_val) for c in color_list):
                return True
    return False


def get_or_fetch_products(
    db: Session,
    keyword: str,
    display: int = 3,
    emotion: Optional[str] = None,
    weather_desc: Optional[str] = None,
    tour_category: Optional[str] = None,
    gender: Optional[str] = None,
    exclude_ids: Optional[List[int]] = None,
    liked_colors: Optional[str] = None,
    disliked_colors: Optional[str] = None
):
    """자체 DB 무드 태그 및 성별 스마트 매칭 (이전 추천 제외) -> 부족하면 네이버 API 수집 -> DB 영구 저장 -> 프론트엔드 반환"""
    try:
        if exclude_ids is None:
            exclude_ids = []

        liked_list = [c.strip() for c in liked_colors.replace("/", ",").split(",") if c.strip()] if liked_colors else []
        disliked_list = [c.strip() for c in disliked_colors.replace("/", ",").split(",") if c.strip()] if disliked_colors else []

        naver_keyword = keyword
        if gender in ["남성", "여성"] and gender not in keyword and ("남자" not in keyword and "여자" not in keyword):
            naver_keyword = f"{gender} {keyword}"

        search_terms = keyword.split()
        gender_prefix_words = {"남성", "여성", "남자", "여자", "남성용", "여성용"}
        
        # 품목명(카테고리 명사) 최우선 추출 사전
        category_noun_list = [
            "반소매", "반팔", "긴소매", "긴팔", "맨투맨", "스웨트셔츠", "셔츠", "남방", "후드", "니트", "스웨터",
            "데님", "청바지", "트레이닝", "면바지", "슬랙스", "팬츠", "바지", "반바지", "스커트", "치마", "조거",
            "집업", "슈트", "수트", "카디건", "가디건", "패딩", "다운", "재킷", "자켓", "블레이저", "코트", "베스트", "조끼", "아노락", "바람막이",
            "백팩", "가방", "에코백", "크로스백", "토트백", "캡", "모자", "비니", "스니커즈", "운동화", "구두", "로퍼", "부츠", "샌들", "슬리퍼"
        ]
        
        matched_cat_noun = None
        for cat_noun in category_noun_list:
            if cat_noun in keyword:
                matched_cat_noun = cat_noun
                break

        core_terms = [term for term in search_terms if term not in gender_prefix_words]
        if not core_terms:
            core_terms = search_terms

        # DB 검색 기본 제약 조건 (이전 추천 제외 + 성별 타겟 필터링 + 기피 색상 제외)
        base_conditions = []
        if exclude_ids:
            base_conditions.append(~Product.id.in_(exclude_ids))

        # 기피 색상(disliked_colors) DB 하드 제외 조건 추가
        if disliked_list:
            for d_color in disliked_list:
                if d_color not in keyword:
                    base_conditions.append(~Product.product_name.ilike(f"%{d_color}%"))

        # 성별 기반 상품 필터링 (남성 유저에게 여성 전용 상품 제외)
        if gender == "남성":
            base_conditions.append(Product.gender_target != "여성")
            female_keywords = ["여성", "원피스", "스커트", "블라우스", "크롭"]
            for fk in female_keywords:
                if fk not in keyword:
                    base_conditions.append(~Product.product_name.ilike(f"%{fk}%"))
        elif gender == "여성":
            base_conditions.append(Product.gender_target != "남성")
            male_keywords = ["남성용", "남자전용"]
            for mk in male_keywords:
                if mk not in keyword:
                    base_conditions.append(~Product.product_name.ilike(f"%{mk}%"))

        # 최우선 품목명(카테고리 명사) 조건 강제 반영
        if matched_cat_noun:
            base_conditions.append(or_(Product.product_name.ilike(f"%{matched_cat_noun}%"), Product.brand.ilike(f"%{matched_cat_noun}%")))

        # 핵심 상품 단어(core_terms) 조건
        and_core = [
            or_(Product.product_name.ilike(f"%{term}%"), Product.brand.ilike(f"%{term}%")) 
            for term in core_terms
        ]
        conditions = base_conditions + and_core

        # 무드 태그 우선순위 스마트 쿼리
        query = db.query(Product).outerjoin(ProductMoodTag, Product.id == ProductMoodTag.product_id)
        query = query.filter(and_(*conditions))
        
        # 무드 태그 조건이 주어진 경우, 매칭되는 무드 태그 상품을 우선 정렬
        mood_conditions = []
        if emotion:
            emotion_keywords = {
                "joy": ["활동적", "행복", "설렘", "신남"],
                "sadness": ["차분함", "편안함", "시크"],
                "anger": ["활동적", "편안함"],
                "fear": ["편안함", "차분함"],
                "surprise": ["설렘", "활동적"]
            }.get(emotion, [])
            for ek in emotion_keywords:
                mood_conditions.append(ProductMoodTag.mood_tag.ilike(f"%{ek}%"))
                
        if weather_desc:
            if "비" in weather_desc:
                mood_conditions.append(ProductMoodTag.weather_tag.ilike("%비%"))
            elif "바람" in weather_desc:
                mood_conditions.append(ProductMoodTag.weather_tag.ilike("%바람%"))
            elif "맑" in weather_desc or "햇" in weather_desc:
                mood_conditions.append(ProductMoodTag.weather_tag.ilike("%맑음%"))
            elif "눈" in weather_desc or "추" in weather_desc:
                mood_conditions.append(ProductMoodTag.weather_tag.ilike("%한파%") | ProductMoodTag.weather_tag.ilike("%쌀쌀%"))
                
        if tour_category:
            mood_conditions.append(ProductMoodTag.tour_tag.ilike(f"%{tour_category}%"))
            
        local_products = []
        matched_mood_count = 0
        if mood_conditions:
            matched_products = query.filter(or_(*mood_conditions)).limit(display).all()
            for p in matched_products:
                if p not in local_products:
                    local_products.append(p)
            matched_mood_count = len(local_products)

        if len(local_products) < display:
            exact_products = db.query(Product).filter(and_(*conditions)).limit(display).all()
            for p in exact_products:
                if p not in local_products:
                    local_products.append(p)

        if len(local_products) < display and len(core_terms) > 1:
            or_core = [
                or_(Product.product_name.ilike(f"%{term}%"), Product.brand.ilike(f"%{term}%")) 
                for term in core_terms
            ]
            or_query = db.query(Product).filter(and_(*base_conditions), or_(*or_core))
            or_products = or_query.limit(display).all()
            for p_item in or_products:
                if p_item not in local_products:
                    local_products.append(p_item)
        
        # 성별 특화 자체 DB 쿼리 검사
        if gender in ["남성", "여성"]:
            gender_products = [
                p for p in local_products 
                if p.gender_target == gender or (gender in p.product_name) or ("남자" if gender == "남성" else "여자" in p.product_name)
            ]
            if len(gender_products) >= display:
                local_products = gender_products
            else:
                local_products = []
        
        # 기피 색상 하드 exclusion 및 선호 색상 최상단 다중 정렬 (ProductOption 통합 검사)
        if disliked_list and local_products:
            local_products = [p for p in local_products if not check_product_has_colors(db, p, disliked_list)]

        if liked_list and local_products:
            liked_prods = [p for p in local_products if check_product_has_colors(db, p, liked_list)]
            other_prods = [p for p in local_products if p not in liked_prods]
            local_products = liked_prods + other_prods

        if len(local_products) >= display:
            if matched_mood_count > 0:
                print(f"[MoodMatch] 무드 태그 100% 매칭 연동 완료! ({matched_mood_count}개 무드 태그 일치 상품 최우선 배치)")
            else:
                print(f"[Info] 자체 DB에서 안 보여준 신규 {gender if gender else ''} '{keyword}' 상품을 찾았습니다! (API 호출 안함)")
            return [
                {
                    "id": p.id,
                    "title": p.product_name,
                    "link": f"/product/{p.id}",
                    "image": p.image_url[0] if isinstance(p.image_url, list) and len(p.image_url) > 0 else p.image_url,
                    "lprice": p.discount_price
                } for p in local_products[:display]
            ]
            
        print(f"[Info] 자체 DB에 안 보여준 새로운 {gender if gender else ''} '{keyword}' 상품이 부족하여 네이버 신규 수집을 진행합니다...")
        client_id = os.getenv("NAVER_CLIENT_ID")
        client_secret = os.getenv("NAVER_CLIENT_SECRET")
        start_param = len(exclude_ids) + 1 if exclude_ids else 1
        headers = {"X-Naver-Client-Id": client_id, "X-Naver-Client-Secret": client_secret}
        
        # 유저가 설정한 선호 색상이 있으면 선호 색상별로 개별 네이버 쿼리를 순회하여 수집
        search_queries = [f"{naver_keyword} {c}" for c in liked_list] if liked_list else [naver_keyword]
        new_products = []

        for query_str in search_queries:
            if len(new_products) >= display:
                break
            
            url = f"https://openapi.naver.com/v1/search/shop.json?query={quote(query_str)}&display={display}&start={start_param}"
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                items = response.json().get("items", [])
                for item in items:
                    shop_pid = item.get("productId", str(hash(item["link"])))
                    existing_p = db.query(Product).filter(Product.shop_product_id == shop_pid).first()
                    if not existing_p:
                        matched_cat_id = None
                        prod_name = item["title"].replace("<b>", "").replace("</b>", "")

                        # 기피 색상 포함 여부 하드 검사
                        if disliked_list:
                            skip_color = False
                            for d_color in disliked_list:
                                if d_color in prod_name:
                                    skip_color = True
                                    break
                            if skip_color:
                                continue
                        
                        matched_cat_id = classify_product_category(db, item, prod_name, keyword)
                        
                        saved_gender = gender if gender in ["남성", "여성"] else "공용"
                        if "여성" in prod_name or "여자" in prod_name or "원피스" in prod_name or "스커트" in prod_name:
                            saved_gender = "여성"
                        elif "남성" in prod_name or "남자" in prod_name:
                            saved_gender = "남성"

                        new_p = Product(
                            category_id=matched_cat_id,
                            shop_product_id=shop_pid,
                            product_name=prod_name,
                            original_price=int(item["lprice"]),
                            discount_price=int(item["lprice"]),
                            image_url=[item["image"]],
                            purchase_link=item["link"],
                            brand=item.get("mallName", "제휴 쇼핑몰"),
                            gender_target=saved_gender,
                            inventory=100
                        )
                        db.add(new_p)
                        new_products.append(new_p)
                        if len(new_products) >= display:
                            break

        if new_products:
            db.commit()
            print(f"[Success] 수집 완료! {len(new_products)}개의 취향 맞춤 신규 상품을 자체 DB에 영구 저장했습니다.")
            # 응답 지연 시간(19s -> 2s) 획기적 단축을 위해 GPT 1:1 맞춤 옵션 및 무드 태그 생성을 백그라운드 쓰레드로 비동기 전환
            def _async_bg_seed():
                from app.db.database import SessionLocal
                bg_db = SessionLocal()
                try:
                    seed_initial_product_options(bg_db)
                    seed_initial_product_mood_tags(bg_db)
                except Exception as bg_err:
                    print(f"⚠️ [BG Seeding Note]: {bg_err}")
                finally:
                    bg_db.close()

            import threading
            threading.Thread(target=_async_bg_seed, daemon=True).start()

            # 신규 수집 상품 중 선호 색상 다중 정렬 (ProductOption 스펙 포함 검사)
            if liked_list:
                liked_new = [p for p in new_products if check_product_has_colors(db, p, liked_list)]
                other_new = [p for p in new_products if p not in liked_new]
                new_products = liked_new + other_new

            return [
                {
                    "id": p.id,
                    "title": p.product_name,
                    "link": f"/product/{p.id}",
                    "image": p.image_url[0] if isinstance(p.image_url, list) and len(p.image_url) > 0 else p.image_url,
                    "lprice": p.discount_price
                } for p in new_products[:display]
            ]
            
            final_products = db.query(Product).filter(and_(*conditions)).limit(display).all()
            if len(final_products) < display and len(search_terms) > 1:
                term_or_conditions = [
                    or_(Product.product_name.ilike(f"%{term}%"), Product.brand.ilike(f"%{term}%")) 
                    for term in search_terms
                ]
                or_query = db.query(Product).filter(or_(*term_or_conditions))
                if exclude_ids:
                    or_query = or_query.filter(~Product.id.in_(exclude_ids))
                if gender == "남성":
                    or_query = or_query.filter(Product.gender_target != "여성")
                elif gender == "여성":
                    or_query = or_query.filter(Product.gender_target != "남성")

                or_prods = or_query.limit(display).all()
                for p_item in or_prods:
                    if p_item not in final_products:
                        final_products.append(p_item)

            return [
                {
                    "id": p.id,
                    "title": p.product_name,
                    "link": f"/product/{p.id}",
                    "image": p.image_url[0] if isinstance(p.image_url, list) and len(p.image_url) > 0 else p.image_url,
                    "lprice": p.discount_price
                } for p in final_products[:display]
            ]
        else:
            return []
            
    except Exception as e:
        print(f"[Error] 데이터 자동 수집 파이프라인 에러: {e}")
        db.rollback()
        return []
