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
                "gender_target": product.gender_target,
                "inventory": product.inventory,
                "average_rating": float(product.average_rating),
                "like_count": product.like_count,
            }
        }
    except Exception as e:
        print(f"❌ 상품 상세 조회 중 에러 발생: {e}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="서버 내부 오류가 발생했습니다.")