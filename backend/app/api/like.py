# app/api/like.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.models import ProductLike, Product
from app.schemas.like_schema import ProductLikeCreate, ProductLikeResponse

router = APIRouter(prefix="/api/likes", tags=["Likes"])

@router.post("/", response_model=dict)
def toggle_like(req: ProductLikeCreate, db: Session = Depends(get_db)):
    """
    상품 찜하기(Like) 상태를 토글(Toggle)합니다.
    """
    # 존재하는 상품인지 검증
    product = db.query(Product).filter(Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="상품을 찾을 수 없습니다.")

    # 유저의 기존 찜 내역 검색
    existing_like = db.query(ProductLike).filter(
        ProductLike.user_id == req.user_id,
        ProductLike.product_id == req.product_id
    ).first()

    try:
        if existing_like:
            # 이미 찜한 상태라면 삭제 (취소)
            db.delete(existing_like)
            product.like_count -= 1
            if product.like_count < 0:
                product = 0
            db.commit()
            return {"message": "찜하기가 취소되었습니다.", "status": "removed"}
        else:
            # 찜 내역이 없다면 새로 추가
            new_like = ProductLike(user_id=req.user_id, product_id=req.product_id)
            db.add(new_like)
            product.like_count += 1
            db.commit()
            return {"message": "상품을 찜했습니다.", "status": "added"}
            
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"찜하기 처리 중 오류가 발생했습니다: {str(e)}")

@router.get("/{user_id}", response_model=List[ProductLikeResponse])
def get_user_likes(user_id: int, db: Session = Depends(get_db)):
    """
    특정 유저가 찜한 상품 목록을 최신순으로 조회합니다.
    """
    try:
        likes = db.query(ProductLike)\
            .filter(ProductLike.user_id == user_id)\
            .order_by(ProductLike.created_at.desc())\
            .all()
        return likes
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"찜 목록 조회 중 오류가 발생했습니다: {str(e)}")