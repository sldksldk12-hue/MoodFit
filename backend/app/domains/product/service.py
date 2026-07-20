import os
import requests
from urllib.parse import quote
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from app.models.models import Product, ProductCategory

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
