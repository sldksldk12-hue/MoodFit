from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Product, ProductCategory

router = APIRouter()

@router.get("/{product_id}")
async def get_product_detail(product_id: int, db: Session = Depends(get_db)):
    """특정 상품의 상세 정보를 조회합니다."""
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="해당 상품을 찾을 수 없습니다.")
        
        category_name = "미분류"
        if product.category_id:
            category = db.query(ProductCategory).filter(ProductCategory.id == product.category_id).first()
            if category:
                category_name = category.category_name
        
        # product_content Null 데이터 처리 및 UI 렌더링용 포맷팅
        fallback_content = (
            f"<div style='padding: 20px; background-color: #f9f9f9; border-radius: 8px;'>"
            f"<h3 style='color: #333;'><b>{product.brand}</b> 추천 아이템</h3>"
            f"<p style='color: #666; font-size: 15px;'>현재 선택하신 <b>[{product.product_name}]</b>의 상세 설명 이미지가 외부 쇼핑몰에서 제공되지 않았습니다.</p>"
            f"<p style='color: #666; font-size: 14px;'>상품에 대한 추가적인 정보나 사이즈 문의는 Q&A 게시판을 이용해 주세요.</p>"
            f"</div>"
        )
        safe_content = product.product_content if product.product_content else fallback_content
        
        options_data = []
        if not product.options:
            from app.domains.product.service import seed_initial_product_options
            seed_initial_product_options(db)
            db.refresh(product)

        if product.options:
            for opt in product.options:
                options_data.append({
                    "id": opt.id,
                    "option_name": opt.option_name,
                    "option_values": opt.option_values,
                    "is_required": opt.is_required
                })
        
        return {
            "status": "success",
            "data": {
                "id": product.id,
                "shop_product_id": product.shop_product_id,
                "category": category_name,
                "brand": product.brand,
                "name": product.product_name,
                "original_price": product.original_price,
                "discount_price": product.discount_price,
                "images": product.image_url if isinstance(product.image_url, list) else [product.image_url],
                "purchase_link": product.purchase_link,
                "product_content": safe_content,  # UI에 직접 삽입 가능한 안전한 데이터 추가
                "gender_target": product.gender_target,
                "inventory": product.inventory,
                "average_rating": float(product.average_rating),
                "like_count": product.like_count,
                "options": options_data,
            }
        }
    except Exception as e:
        print(f"❌ 상품 상세 조회 중 에러 발생: {e}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="서버 내부 오류가 발생했습니다.")


@router.get("/")
async def get_product_list(db: Session = Depends(get_db)):
    """전체 상품 목록을 조회합니다."""
    try:
        products = db.query(Product).order_by(Product.id.desc()).all()
        result = []

        for product in products:
            category_name = "미분류"
            if product.category_id:
                category = db.query(ProductCategory).filter(ProductCategory.id == product.category_id).first()
                if category:
                    category_name = category.category_name

            result.append({
                "id": product.id,
                "shop_product_id": product.shop_product_id,
                "category": category_name,
                "brand": product.brand,
                "name": product.product_name,
                "product_name": product.product_name,
                "original_price": product.original_price,
                "discount_price": product.discount_price,
                "price": product.discount_price or product.original_price,
                "images": product.image_url if isinstance(product.image_url, list) else [product.image_url],
                "image_url": product.image_url[0] if isinstance(product.image_url, list) and product.image_url else product.image_url,
                "purchase_link": product.purchase_link,
                "gender_target": product.gender_target,
                "inventory": product.inventory,
                "average_rating": float(product.average_rating or 0),
                "like_count": product.like_count or 0,
                "created_at": product.created_at, 
            })
        return result

    except Exception as error:
        print("❌ 상품 목록 조회 중 에러:", error)
        raise HTTPException(status_code=500, detail="상품 목록을 불러오는 중 오류가 발생했습니다.")