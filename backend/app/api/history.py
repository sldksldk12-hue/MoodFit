# app/api/history.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.db.database import get_db
from app.models.models import UserActivityLog, Product
from app.schemas.history_schema import HistoryCreate, HistoryResponse

router = APIRouter(prefix="/api/history", tags=["History"])

@router.post("/", response_model=dict)
def add_to_history(req: HistoryCreate, db: Session = Depends(get_db)):
    """
    유저가 상품을 조회했을 때 '최근 본 상품' 기록을 저장합니다.
    """
    # 상품 존재 여부 확인
    product = db.query(Product).filter(Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="상품을 찾을 수 없습니다.")

    # 조회 기록 추가 (action_type을 'VIEW'로 고정하여 저장)
    try:
        new_log = UserActivityLog(
            user_id=req.user_id,
            product_id=req.product_id,
            action_type="VIEW"
        )
        db.add(new_log)
        db.commit()
        return {"message": "최근 본 상품에 기록되었습니다.", "status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"기록 저장 중 오류 발생: {str(e)}")


@router.get("/{user_id}", response_model=List[HistoryResponse])
def get_user_history(user_id: int, db: Session = Depends(get_db)):
    """
    특정 유저의 '최근 본 상품' 목록을 최신순으로 조회합니다. (중복 상품 제거)
    """
    try:
        # 서브쿼리 작성: 유저의 'VIEW' 기록 중 상품별로 가장 최근 시간(max)을 구함
        subquery = db.query(
            UserActivityLog.product_id,
            func.max(UserActivityLog.created_at).label("latest_view")
        ).filter(
            UserActivityLog.user_id == user_id,
            UserActivityLog.action_type == "VIEW"
        ).group_by(UserActivityLog.product_id).subquery()

        # 상품(Product) 테이블과 조인하여 상세 정보 결합 후 최신순(desc) 정렬
        results = db.query(Product, subquery.c.latest_view)\
            .join(subquery, Product.id == subquery.c.product_id)\
            .order_by(subquery.c.latest_view.desc())\
            .limit(20)\
            .all()

        history_list = []
        for product, viewed_at in results:
            # JSON 형태의 이미지 데이터에서 첫 번째 이미지 추출 방어 로직
            img_url = None
            if isinstance(product.image_url, list) and product.image_url:
                img_url = product.image_url[0]
            elif isinstance(product.image_url, str):
                img_url = product.image_url

            history_list.append({
                "product_id": product.id,
                "product_name": product.product_name,
                "brand": product.brand,
                "discount_price": product.discount_price,
                "image_url": img_url,
                "viewed_at": viewed_at
            })
            
        return history_list
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"최근 본 상품 조회 중 오류 발생: {str(e)}")