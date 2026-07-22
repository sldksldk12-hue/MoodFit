# app/api/review.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.db.database import get_db
from app.models.models import ProductReview, OrderItem, Order, Product
from app.schemas.review_schema import ReviewCreate, ReviewResponse

router = APIRouter(prefix="/api/reviews", tags=["Review"])

@router.post("/", response_model=ReviewResponse)
def create_review(req: ReviewCreate, db: Session = Depends(get_db)):
    """
    상품에 대한 새로운 리뷰를 작성합니다. (실제 구매자만 작성 가능)
    """
    # 구매 내역(권한) 검증
    # order_items와 orders를 조인하여, 요청한 user_id가 실제로 해당 상품을 구매했는지 확인
    order_item = db.query(OrderItem).join(Order).filter(
        OrderItem.id == req.order_item_id,
        OrderItem.product_id == req.product_id,
        Order.user_id == req.user_id
    ).first()

    if not order_item:
        raise HTTPException(status_code=403, detail="해당 상품의 구매 내역이 존재하지 않아 리뷰를 작성할 수 없습니다.")

    # 중복 작성 방지 (동일한 주문 상세 건에 대한 리뷰 여부 확인)
    existing_review = db.query(ProductReview).filter(
        ProductReview.user_id == req.user_id,
        ProductReview.order_item_id == req.order_item_id
    ).first()

    if existing_review:
        raise HTTPException(status_code=400, detail="이미 이 주문 건에 대한 리뷰를 작성하셨습니다.")

    try:
        # 리뷰 데이터 저장
        new_review = ProductReview(
            user_id=req.user_id,
            product_id=req.product_id,
            order_item_id=req.order_item_id,
            rating=req.rating,
            content=req.content,
            image_url=req.image_url
        )
        db.add(new_review)
        db.flush()  # DB에 임시 반영하여 평균 별점 계산에 포함되도록 처리

        # 해당 상품의 평균 별점(average_rating) 실시간 동기화
        avg_rating = db.query(func.avg(ProductReview.rating)).filter(
            ProductReview.product_id == req.product_id
        ).scalar()
        
        product = db.query(Product).filter(Product.id == req.product_id).first()
        if product and avg_rating is not None:
            product.average_rating = round(avg_rating, 1)

        db.commit()
        db.refresh(new_review)
        return new_review

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"리뷰 등록 중 오류가 발생했습니다: {str(e)}")


@router.get("/product/{product_id}", response_model=List[ReviewResponse])
def get_product_reviews(product_id: int, db: Session = Depends(get_db)):
    """
    특정 상품에 작성된 모든 리뷰 목록을 최신순으로 조회합니다.
    """
    try:
        reviews = db.query(ProductReview)\
            .filter(ProductReview.product_id == product_id)\
            .order_by(ProductReview.created_at.desc())\
            .all()
        return reviews
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"리뷰 목록 조회 중 오류가 발생했습니다: {str(e)}")