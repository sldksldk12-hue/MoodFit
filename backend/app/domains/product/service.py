import os
import json
import requests
import threading
import random
from datetime import datetime, timedelta
from typing import Optional, List
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from urllib.parse import quote
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from app.models.models import Product, ProductCategory, ProductOption, ProductMoodTag

_bg_seed_lock = threading.Lock()

def seed_initial_categories(db: Session):
    """3자리 단축 코드 기반의 카테고리 시드 데이터를 자동으로 데이터베이스에 적재합니다."""
    try:
        if db.query(ProductCategory).count() == 0:
            print("🌱 카테고리 데이터 자동 적재(Seeding)를 시작합니다...")
            
            c100 = ProductCategory(id=100, category_name='상의', parent_id=None)
            c200 = ProductCategory(id=200, category_name='하의', parent_id=None)
            c300 = ProductCategory(id=300, category_name='아우터', parent_id=None)
            c400 = ProductCategory(id=400, category_name='악세사리/신발', parent_id=None)
            db.add_all([c100, c200, c300, c400])
            db.flush()
            
            subs = [
                ProductCategory(id=101, category_name='반소매 티셔츠', parent_id=100),
                ProductCategory(id=102, category_name='긴소매 티셔츠', parent_id=100),
                ProductCategory(id=103, category_name='맨투맨', parent_id=100),
                ProductCategory(id=104, category_name='셔츠', parent_id=100),
                ProductCategory(id=105, category_name='후드', parent_id=100),
                ProductCategory(id=106, category_name='니트', parent_id=100),
                ProductCategory(id=201, category_name='데님', parent_id=200),
                ProductCategory(id=202, category_name='트레이닝', parent_id=200),
                ProductCategory(id=203, category_name='코튼', parent_id=200),
                ProductCategory(id=204, category_name='숏 팬츠', parent_id=200),
                ProductCategory(id=205, category_name='레깅스', parent_id=200),
                ProductCategory(id=206, category_name='조거 팬츠', parent_id=200),
                ProductCategory(id=207, category_name='청바지', parent_id=200),
                ProductCategory(id=208, category_name='스커트', parent_id=200),
                ProductCategory(id=301, category_name='집업', parent_id=300),
                ProductCategory(id=302, category_name='슈트', parent_id=300),
                ProductCategory(id=303, category_name='가디건', parent_id=300),
                ProductCategory(id=304, category_name='패딩', parent_id=300),
                ProductCategory(id=305, category_name='재킷', parent_id=300),
                ProductCategory(id=306, category_name='코트', parent_id=300),
                ProductCategory(id=307, category_name='베스트', parent_id=300),
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
    """JSON 또는 텍스트 내 잔여 한자를 순수 한글로 자동 시정"""
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
    """GPT-4o-mini를 활용하여 맞춤형 옵션 생성"""
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
2. `colors`: 해당 상품 디자인 및 브랜드 분위기에 어울리는 색상 목록 (배열, 3~5개)
3. `measurements`: 사이즈별 cm 단위 실측 치수 목록 (배열)
4. `specs`: 해당 상품의 상세 정보 4가지 항목 (객체) - material, fit, season, country
5. 모든 텍스트 작성 시 한글로만 명확히 작성하세요.

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

def seed_initial_product_options(db: Session, force_reseed: bool = False, verbose: bool = False):
    """모든 상품에 대해 GPT 맞춤형 옵션 적재"""
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

                size_option = ProductOption(product_id=product.id, option_name="사이즈", option_values=sizes, is_required=1)
                color_option = ProductOption(product_id=product.id, option_name="색상", option_values=colors, is_required=1)
                measurement_option = ProductOption(product_id=product.id, option_name="실측치수", option_values=measurements, is_required=0)
                spec_option = ProductOption(product_id=product.id, option_name="상세스펙", option_values=specs, is_required=0)
                db.add_all([size_option, color_option, measurement_option, spec_option])
                created_count += 4
                
        if created_count > 0 or force_reseed:
            db.commit()
            if verbose:
                print(f"[Success] GPT 맞춤형 상품 옵션 데이터 자동 적재 완료! ({created_count}개 생성됨)")
    except Exception as err:
        db.rollback()
        print(f"[Error] 상품 옵션 자동 적재 중 오류 발생: {err}")

def generate_gpt_product_mood_tags(product_name: str, category_name: str, brand: str) -> Optional[dict]:
    """GPT 무드 태그 생성"""
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
        
        system_prompt = """당신은 패션 감성 분석 전문 AI입니다.
주어진 상품명, 카테고리, 브랜드 정보를 바탕으로 어울리는 4대 무드 태그(감정, 날씨, 계절, TPO)를 JSON으로 생성하세요.

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
        return json.loads(response.content)
    except Exception as e:
        print(f"[Error] GPT 무드 태그 생성 에러 ({product_name}): {e}")
        return None

def seed_initial_product_mood_tags(db: Session, force_reseed: bool = False, verbose: bool = False):
    """모든 상품에 대해 무드 태그 적재"""
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
                
                gpt_tags = generate_gpt_product_mood_tags(product.product_name, category_name, product.brand)
                
                if gpt_tags and "mood_tag" in gpt_tags and "weather_tag" in gpt_tags and "season_tag" in gpt_tags:
                    mood_t = gpt_tags.get("mood_tag", "#편안함")
                    weather_t = gpt_tags.get("weather_tag", "#맑음")
                    season_t = gpt_tags.get("season_tag", "#사계절")
                    tour_t = gpt_tags.get("tour_tag", "#카페/도심")
                else:
                    mood_t, weather_t, season_t, tour_t = "#편안함", "#맑음", "#사계절", "#카페/도심"
                
                new_tag = ProductMoodTag(
                    product_id=product.id, mood_tag=mood_t, weather_tag=weather_t, season_tag=season_t, tour_tag=tour_t
                )
                db.add(new_tag)
                created_count += 1
                
        if created_count > 0 or force_reseed:
            db.commit()
            if verbose:
                print(f"[Success] GPT 무드 태그 자동 적재 완료! ({created_count}개 생성됨)")
    except Exception as err:
        db.rollback()
        print(f"[Error] 상품 무드 태그 자동 적재 중 오류 발생: {err}")

CATEGORY_MAP = {
    "코트비전": 405, "에어포스": 405, "조던": 405, "스니커즈": 405, "단화": 405,
    "스포츠화": 406, "런닝화": 406, "러닝화": 406, "운동화": 406, "신발": 406,
    "구두": 407, "로퍼": 407, "힐": 407, "부츠": 408, "워커": 408, "샌들": 409, "슬리퍼": 409,
    "캡": 401, "야구모": 401, "베레모": 402, "페도라": 403, "비니": 404,
    "백팩": 410, "가방": 410, "에코백": 410, "크로스백": 410, "토트백": 410,
    "데님 자켓": 305, "데님자켓": 305, "가죽 자켓": 305, "레더 자켓": 305, "라이더 자켓": 305,
    "후드 집업": 301, "후드집업": 301, "니트 집업": 301, "니트집업": 301,
    "트렌치코트": 306, "트렌치 코트": 306, "트렌치": 306,
    "가디건": 303, "카디건": 303, "바람막이": 301, "집업": 301,
    "슈트": 302, "수트": 302, "패딩": 304, "다운": 304, "숏패딩": 304, "롱패딩": 304,
    "재킷": 305, "자켓": 305, "블레이저": 305, "무스탕": 305, "라이더": 305,
    "코트": 306, "더플코트": 306, "베스트": 307, "조끼": 307,
    "데님 팬츠": 201, "데님 바지": 201, "청바지": 207, "데님": 201,
    "숏 팬츠": 204, "트레이닝 팬츠": 202, "트레이닝 바지": 202, "트레이닝": 202, "츄리닝": 202, "면바지": 203,
    "반바지": 204, "핫팬츠": 204, "레깅스": 205, "조거 팬츠": 206, "조거": 206, "스커트": 208, "치마": 208,
    "데님 셔츠": 104, "데님 남방": 104, "반팔 셔츠": 104, "반팔 남방": 104,
    "스웨트셔츠": 103, "맨투맨": 103, "후드티": 105, "후드 셔츠": 105, "후드": 105,
    "반소매": 101, "반팔": 101, "긴소매": 102, "긴팔": 102,
    "셔츠": 104, "남방": 104, "니트": 106, "스웨터": 106, "티셔츠": 101, "티": 101
}

def get_or_create_category(db: Session, category_name: str) -> int:
    category = db.query(ProductCategory).filter(ProductCategory.category_name == category_name).first()
    if category: return category.id
    new_category = ProductCategory(category_name=category_name)
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category.id

def classify_product_category(db: Session, item_meta: dict, prod_name: str, search_keyword: str) -> int:
    for key, cat_id in CATEGORY_MAP.items():
        if key in prod_name: return cat_id
    for key, cat_id in CATEGORY_MAP.items():
        if key in search_keyword: return cat_id
    return get_or_create_category(db, item_meta.get("category1", "AI 추천 상품"))

def check_product_has_colors(db: Session, product: Product, color_list: List[str]) -> bool:
    if not color_list: return False
    if any(c in product.product_name for c in color_list): return True
    color_opt = db.query(ProductOption).filter(ProductOption.product_id == product.id, ProductOption.option_name == "색상").first()
    if color_opt and isinstance(color_opt.option_values, list):
        for opt_val in color_opt.option_values:
            if any(c in str(opt_val) for c in color_list): return True
    return False

# 카테고리명을 AI가 이해할 수 있는 '영문 키워드'로만 매핑
IMAGE_KEYWORD_MAP = {
    "반소매 티셔츠": "short sleeve t-shirt", "긴소매 티셔츠": "long sleeve t-shirt", "맨투맨": "sweatshirt",
    "셔츠": "shirt", "후드": "hoodie", "니트": "sweater",
    "데님": "denim pants", "트레이닝": "sweatpants", "코튼": "cotton pants",
    "숏 팬츠": "shorts", "레깅스": "leggings", "조거 팬츠": "jogger pants",
    "청바지": "jeans", "스커트": "skirt",
    "집업": "zip-up hoodie", "슈트": "suit", "가디건": "cardigan",
    "패딩": "puffer jacket", "재킷": "jacket", "코트": "coat", "베스트": "vest",
    "캡": "baseball cap", "베레모": "beret", "페도라": "fedora", "비니": "beanie",
    "스니커즈": "sneakers", "스포츠화": "running shoes", "구두": "leather shoes",
    "부츠": "boots", "샌들": "sandals"
}

def generate_realistic_korean_fashion(category_name: str, target_gender: str, needed: int) -> List[dict]:
    """한국 트렌드에 맞는 데이터와 AI가 실시간으로 그려낸 맞춤형 패션 이미지를 생성합니다."""
    brands = ["무신사 스탠다드", "커버낫", "디스이즈네버댓", "스파오", "탑텐", "지오다노", "에잇세컨즈", "유니클로", "자라", "드로우핏", "인사일런스"]
    
    if target_gender == "남성":
        modifiers = ["오버핏", "레귤러핏", "와이드", "베이직", "캐주얼", "루즈핏", "컴포트", "데일리", "머슬핏"]
        gender_keyword = "korean handsome man" # AI에게 전달할 성별 묘사
    else:
        modifiers = ["오버핏", "크롭", "슬림핏", "와이드", "베이직", "러블리", "캐주얼", "데일리", "빈티지"]
        gender_keyword = "korean beautiful woman"
        
    mock_items = []
    
    # 카테고리에 맞는 영문 키워드 가져오기
    eng_keyword = IMAGE_KEYWORD_MAP.get(category_name, "fashion clothing")
    
    for i in range(needed):
        brand = random.choice(brands)
        modifier = random.choice(modifiers)
        
        prod_name = f"[{brand}] {target_gender} {modifier} {category_name}"
        base_price = random.randint(15, 120) * 1000
        
        # 💡 2. AI에게 그림을 그려달라고 할 프롬프트(명령어)를 작성합니다.
        prompt = f"Korean fashion style, {gender_keyword} wearing {eng_keyword}, full body shot, street background, highly detailed"
        encoded_prompt = quote(prompt) # URL에 넣을 수 있도록 텍스트를 인코딩(변환)
        
        # 💡 3. 무료 실시간 생성 API 호출! seed 값을 난수로 주어 매번 다른 이미지가 나오게 합니다.
        img_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=400&height=500&nologo=true&seed={random.randint(1, 100000)}"
        
        mock_items.append({
            "productId": str(hash(prod_name + str(random.random())))[1:15],
            "title": prod_name,
            "lprice": base_price,
            "image": img_url,
            "link": "https://store.musinsa.com/",
            "mallName": brand,
            "category1": category_name
        })
        
    return mock_items

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
    """자체 DB 무드 태그 및 성별 스마트 매칭 -> 부족하면 자체 생성 로직 -> 프론트엔드 반환"""
    try:
        if exclude_ids is None: exclude_ids = []
        liked_list = [c.strip() for c in liked_colors.replace("/", ",").split(",") if c.strip()] if liked_colors else []
        disliked_list = [c.strip() for c in disliked_colors.replace("/", ",").split(",") if c.strip()] if disliked_colors else []

        search_terms = keyword.split()
        gender_prefix_words = {"남성", "여성", "남자", "여자", "남성용", "여성용"}
        
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
        if not core_terms: core_terms = search_terms

        base_conditions = []
        if exclude_ids: base_conditions.append(~Product.id.in_(exclude_ids))

        if disliked_list:
            for d_color in disliked_list:
                if d_color not in keyword: base_conditions.append(~Product.product_name.ilike(f"%{d_color}%"))

        if gender == "남성":
            base_conditions.append(Product.gender_target != "여성")
            female_keywords = ["여성", "원피스", "스커트", "블라우스", "크롭"]
            for fk in female_keywords:
                if fk not in keyword: base_conditions.append(~Product.product_name.ilike(f"%{fk}%"))
        elif gender == "여성":
            base_conditions.append(Product.gender_target != "남성")
            male_keywords = ["남성용", "남자전용"]
            for mk in male_keywords:
                if mk not in keyword: base_conditions.append(~Product.product_name.ilike(f"%{mk}%"))

        if matched_cat_noun:
            base_conditions.append(or_(Product.product_name.ilike(f"%{matched_cat_noun}%"), Product.brand.ilike(f"%{matched_cat_noun}%")))

        and_core = [or_(Product.product_name.ilike(f"%{term}%"), Product.brand.ilike(f"%{term}%")) for term in core_terms]
        conditions = base_conditions + and_core

        query = db.query(Product).outerjoin(ProductMoodTag, Product.id == ProductMoodTag.product_id)
        query = query.filter(and_(*conditions))
        
        mood_conditions = []
        if emotion:
            emotion_keywords = {
                "joy": ["활동적", "행복", "설렘", "신남"],
                "sadness": ["차분함", "편안함", "시크"],
                "anger": ["활동적", "편안함"],
                "fear": ["편안함", "차분함"],
                "surprise": ["설렘", "활동적"]
            }.get(emotion, [])
            for ek in emotion_keywords: mood_conditions.append(ProductMoodTag.mood_tag.ilike(f"%{ek}%"))
                
        if weather_desc:
            if "비" in weather_desc: mood_conditions.append(ProductMoodTag.weather_tag.ilike("%비%"))
            elif "바람" in weather_desc: mood_conditions.append(ProductMoodTag.weather_tag.ilike("%바람%"))
            elif "맑" in weather_desc or "햇" in weather_desc: mood_conditions.append(ProductMoodTag.weather_tag.ilike("%맑음%"))
            elif "눈" in weather_desc or "추" in weather_desc: mood_conditions.append(ProductMoodTag.weather_tag.ilike("%한파%") | ProductMoodTag.weather_tag.ilike("%쌀쌀%"))
                
        if tour_category: mood_conditions.append(ProductMoodTag.tour_tag.ilike(f"%{tour_category}%"))
            
        local_products = []
        if mood_conditions:
            matched_products = query.filter(or_(*mood_conditions)).limit(display).all()
            for p in matched_products:
                if p not in local_products: local_products.append(p)

        if len(local_products) < display:
            exact_products = db.query(Product).filter(and_(*conditions)).limit(display).all()
            for p in exact_products:
                if p not in local_products: local_products.append(p)

        if len(local_products) < display and len(core_terms) > 1:
            or_core = [or_(Product.product_name.ilike(f"%{term}%"), Product.brand.ilike(f"%{term}%")) for term in core_terms]
            or_query = db.query(Product).filter(and_(*base_conditions), or_(*or_core))
            or_products = or_query.limit(display).all()
            for p_item in or_products:
                if p_item not in local_products: local_products.append(p_item)
        
        if gender in ["남성", "여성"]:
            gender_products = [
                p for p in local_products 
                if p.gender_target == gender or (gender in p.product_name) or ("남자" if gender == "남성" else "여자" in p.product_name)
            ]
            if len(gender_products) >= display: local_products = gender_products
            else: local_products = []
        
        if disliked_list and local_products:
            local_products = [p for p in local_products if not check_product_has_colors(db, p, disliked_list)]

        if liked_list and local_products:
            liked_prods = [p for p in local_products if check_product_has_colors(db, p, liked_list)]
            other_prods = [p for p in local_products if p not in liked_prods]
            local_products = liked_prods + other_prods

        if len(local_products) >= display:
            print(f"[Info] 자체 DB에서 안 보여준 신규 {gender if gender else ''} '{keyword}' 상품을 찾았습니다!")
            return [
                {
                    "id": p.id,
                    "title": p.product_name,
                    "link": f"/product/{p.id}",
                    "image": p.image_url[0] if isinstance(p.image_url, list) and len(p.image_url) > 0 else p.image_url,
                    "lprice": p.discount_price
                } for p in local_products[:display]
            ]
            
        print(f"[Info] DB에 새로운 '{keyword}' 상품이 부족하여 고품질 자체 생성기로 신규 데이터를 만듭니다...")
        
        target_gender = gender if gender in ["남성", "여성"] else ("여성" if "여성" in keyword or "여자" in keyword else ("남성" if "남성" in keyword or "남자" in keyword else random.choice(["남성", "여성"])))
        base_cat = matched_cat_noun if matched_cat_noun else "패션 아이템"
        
        mock_items = generate_realistic_korean_fashion(base_cat, target_gender, display)
        new_products = []

        for item in mock_items:
            shop_pid = item["productId"]
            existing_p = db.query(Product).filter(Product.shop_product_id == shop_pid).first()
            if not existing_p:
                prod_name = item["title"]

                if disliked_list:
                    skip_color = False
                    for d_color in disliked_list:
                        if d_color in prod_name:
                            skip_color = True
                            break
                    if skip_color: continue
                
                matched_cat_id = classify_product_category(db, item, prod_name, keyword)

                new_p = Product(
                    category_id=matched_cat_id,
                    shop_product_id=shop_pid,
                    product_name=prod_name,
                    original_price=int(item["lprice"]),
                    discount_price=int(item["lprice"]),
                    image_url=[item["image"]],
                    purchase_link=item["link"],
                    brand=item["mallName"],
                    gender_target=target_gender,
                    inventory=100
                )
                db.add(new_p)
                new_products.append(new_p)
                if len(new_products) >= display: break

        if new_products:
            db.commit()
            print(f"[Success] 자체 생성 완료! {len(new_products)}개의 취향 맞춤 신규 상품을 DB에 영구 저장했습니다.")
            
            def _async_bg_seed():
                if not _bg_seed_lock.acquire(blocking=False): return  
                try:
                    from app.db.database import SessionLocal
                    from app.domains.ai_chat.rag_service import RagsFashionService
                    bg_db = SessionLocal()
                    try:
                        seed_initial_product_options(bg_db)
                        seed_initial_product_mood_tags(bg_db)
                        RagsFashionService().sync_vector_embeddings(bg_db)
                        print("✅ [Background Sync] 이번 수집 상품들에 대한 옵션/태그 동기화 완료!")
                    finally: bg_db.close()
                except Exception as bg_err:
                    print(f"⚠️ [BG Seeding Note]: {bg_err}")
                finally:
                    _bg_seed_lock.release()

            threading.Thread(target=_async_bg_seed, daemon=True).start()

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
            term_or_conditions = [or_(Product.product_name.ilike(f"%{term}%"), Product.brand.ilike(f"%{term}%")) for term in search_terms]
            or_query = db.query(Product).filter(or_(*term_or_conditions))
            
            if exclude_ids: or_query = or_query.filter(~Product.id.in_(exclude_ids))
            if gender == "남성": or_query = or_query.filter(Product.gender_target != "여성")
            elif gender == "여성": or_query = or_query.filter(Product.gender_target != "남성")

            or_prods = or_query.limit(display).all()
            for p_item in or_prods:
                if p_item not in final_products: final_products.append(p_item)

        if not final_products:
            if exclude_ids:
                filtered_query = db.query(Product).filter(~Product.id.in_(exclude_ids))
                if gender == "남성": filtered_query = filtered_query.filter(Product.gender_target != "여성")
                elif gender == "여성": filtered_query = filtered_query.filter(Product.gender_target != "남성")
                final_products = filtered_query.order_by(Product.like_count.desc(), Product.id.desc()).limit(display).all()

            if not final_products:
                pure_fallback = db.query(Product)
                if gender == "남성": pure_fallback = pure_fallback.filter(Product.gender_target != "여성")
                elif gender == "여성": pure_fallback = pure_fallback.filter(Product.gender_target != "남성")
                final_products = pure_fallback.order_by(Product.like_count.desc(), Product.id.desc()).limit(display).all()

        if final_products:
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
        print(f"[Error] 데이터 생성 및 수집 파이프라인 에러: {e}")
        db.rollback()
        return []

def seed_initial_products(db: Session):
    """
    네이버 쇼핑 API 종료 대응: 자체 구축한 고품질 패션 데이터 생성기를 활용하여 
    '중분류' 카테고리별로 리얼한 상품 데이터를 20개씩 안전하게 적재합니다.
    """
    print("🌱 자체 고품질 패션 데이터 생성기로 카테고리별 상품(최소 20개) 적재를 시작합니다...")

    sub_categories = db.query(ProductCategory).filter(ProductCategory.parent_id.isnot(None)).all()
    total_added = 0

    for cat in sub_categories:
        current_count = db.query(Product).filter(Product.category_id == cat.id).count()
        needed = 20 - current_count

        if needed <= 0:
            continue

        target_gender = random.choice(["남성", "여성"])
        print(f"🔍 [{cat.category_name}] 카테고리 {needed}개 부족 -> 고품질 '{target_gender}' 데이터 자체 생성 중...")
        
        items = generate_realistic_korean_fashion(cat.category_name, target_gender, needed)
            
        products_to_save = []
        
        for item in items:
            shop_pid = item["productId"]
            
            if db.query(Product).filter(Product.shop_product_id == shop_pid).first():
                continue
            
            prod_name = item["title"]
            base_price = item["lprice"]
            
            original_price = base_price
            discount_price = base_price
            if random.random() < 0.4:
                discount_rate = random.choice([0.1, 0.2, 0.3, 0.4, 0.5])
                original_price = int(base_price / (1 - discount_rate))
            
            new_p = Product(
                category_id=cat.id,
                shop_product_id=shop_pid,
                product_name=prod_name,
                original_price=original_price,
                discount_price=discount_price,
                image_url=[item["image"]],
                purchase_link=item["link"],
                brand=item["mallName"],
                gender_target=target_gender,
                inventory=random.randint(50, 200)
            )

            if hasattr(new_p, 'created_at'):
                random_days_ago = random.randint(0, 7)
                setattr(new_p, 'created_at', datetime.now() - timedelta(days=random_days_ago))

            products_to_save.append(new_p)

        if products_to_save:
            db.add_all(products_to_save)
            db.commit()
            total_added += len(products_to_save)

    if total_added > 0:
        print(f"✅ 총 {total_added}개의 고품질 자체 생성 상품을 중분류 카테고리별로 채웠습니다!")
        print("⏳ 새로 추가된 상품들의 GPT 맞춤형 옵션 및 4대 무드 태그 생성을 시작합니다...")
        
        seed_initial_product_options(db)
        seed_initial_product_mood_tags(db)
        print("🎉 모든 카테고리 20개 세팅 및 AI 옵션/태그 적재가 완료되었습니다!")
    else:
        print("✅ 모든 중분류 카테고리에 이미 20개 이상의 상품이 존재합니다.")