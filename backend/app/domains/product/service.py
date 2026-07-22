import os
import requests
from urllib.parse import quote
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from app.models.models import Product, ProductCategory, ProductOption

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


import json
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

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
   - `material`: 소재 (예: "나일론 100%, 고어텍스 방수 원단", "면 100%, 20수 싱글원단", "데님, 면 98% 스판 2%")
   - `fit`: 핏 (예: "오버핏", "레귤러 핏", "슬림 핏", "와이드 핏", "크롭 핏")
   - `season`: 계절 (예: "봄 / 가을", "여름", "겨울", "사계절")
   - `country`: 제조국 (예: "대한민국", "베트남", "중국", "인도네시아")

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
        return result_json
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

# 커스텀 카테고리 매핑 사전 정의
CATEGORY_MAP = {
    # 상의
    "반소매": 101, "반팔": 101, "긴소매": 102, "긴팔": 102, "맨투맨": 103, "스웨트셔츠": 103,
    "셔츠": 104, "남방": 104, "후드": 105, "니트": 106, "스웨터": 106,
    # 하의
    "데님": 201, "청바지": 207, "트레이닝": 202, "츄리닝": 202, "코튼": 203, "면바지": 203,
    "숏 팬츠": 204, "반바지": 204, "핫팬츠": 204, "레깅스": 205, "조거": 206, "스커트": 208, "치마": 208,
    # 아우터
    "집업": 301, "슈트": 302, "수트": 302, "카디건": 303, "가디건": 303,
    "패딩": 304, "다운": 304, "재킷": 305, "자켓": 305, "블레이저": 305, "코트": 306, "베스트": 307, "조끼": 307,
    # 악세사리/신발
    "캡": 401, "야구모": 401, "베레모": 402, "페도라": 403, "비니": 404,
    "스니커즈": 405, "단화": 405, "스포츠화": 406, "런닝화": 406, "운동화": 406,
    "구두": 407, "로퍼": 407, "힐": 407, "부츠": 408, "워커": 408, "샌들": 409, "슬리퍼": 409
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
    
def get_or_fetch_products(db: Session, keyword: str, display: int = 3):
    """자체 DB 검색 -> 부족하면 네이버 API 수집 -> DB 영구 저장 -> 프론트엔드 반환"""
    try:
        search_terms = keyword.split()
        conditions = [
            or_(Product.product_name.ilike(f"%{term}%"), Product.brand.ilike(f"%{term}%")) 
            for term in search_terms
        ]
        
        local_products = db.query(Product).filter(and_(*conditions)).limit(display).all()
        
        if len(local_products) >= display:
            print(f"🟢 자체 DB에서 '{keyword}' 상품을 찾았습니다! (API 호출 안함)")
            return [
                {
                    "id": p.id,
                    "title": p.product_name,
                    "link": f"/product/{p.id}",
                    "image": p.image_url[0] if isinstance(p.image_url, list) and len(p.image_url) > 0 else p.image_url,
                    "lprice": p.discount_price
                } for p in local_products
            ]
            
        print(f"🟡 자체 DB에 '{keyword}' 상품이 없어 네이버에서 수집을 시작합니다...")
        client_id = os.getenv("NAVER_CLIENT_ID")
        client_secret = os.getenv("NAVER_CLIENT_SECRET")
        url = f"https://openapi.naver.com/v1/search/shop.json?query={quote(keyword)}&display={display}"
        headers = {"X-Naver-Client-Id": client_id, "X-Naver-Client-Secret": client_secret}
        
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            items = response.json().get("items", [])
            new_products = []
            
            for item in items:
                shop_pid = item.get("productId", str(hash(item["link"])))
                existing_p = db.query(Product).filter(Product.shop_product_id == shop_pid).first()
                if not existing_p:
                    matched_cat_id = None
                    prod_name = item["title"].replace("<b>", "").replace("</b>", "")
                    
                    for key, cat_id in CATEGORY_MAP.items():
                        if key in prod_name:
                            matched_cat_id = cat_id
                            break
                            
                    if not matched_cat_id:
                        for key, cat_id in CATEGORY_MAP.items():
                            if key in keyword:
                                matched_cat_id = cat_id
                                break
                    
                    if not matched_cat_id:
                        matched_cat_id = get_or_create_category(db, item.get("category1", "AI 추천 상품"))
                    
                    new_p = Product(
                        category_id=matched_cat_id,
                        shop_product_id=shop_pid,
                        product_name=prod_name,
                        original_price=int(item["lprice"]),
                        discount_price=int(item["lprice"]),
                        image_url=[item["image"]],
                        purchase_link=item["link"],
                        brand=item.get("mallName", "제휴 쇼핑몰"),
                        gender_target="공용",
                        inventory=100
                    )
                    db.add(new_p)
                    new_products.append(new_p)
            
            if new_products:
                db.commit()
                print(f"🟢 수집 완료! {len(new_products)}개의 상품을 자체 DB에 영구 저장했습니다.")
                # 새로 수집된 상품들에 대해 즉시 GPT 1:1 맞춤 옵션 자동 생성
                seed_initial_product_options(db)
            
            final_products = db.query(Product).filter(and_(*conditions)).limit(display).all()
            if not final_products and new_products:
                final_products = new_products[:display]
            
            return [
                {
                    "id": p.id,
                    "title": p.product_name,
                    "link": f"/product/{p.id}",
                    "image": p.image_url[0] if isinstance(p.image_url, list) and len(p.image_url) > 0 else p.image_url,
                    "lprice": p.discount_price
                } for p in final_products
            ]
        else:
            return []
            
    except Exception as e:
        print(f"❌ 데이터 자동 수집 파이프라인 에러: {e}")
        db.rollback()
        return []
