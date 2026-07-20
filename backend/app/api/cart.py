# app/api/cart.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import CartItem, Product
from app.schemas.cart_schema import CartItemCreate, CartItemResponse
from typing import List

router = APIRouter(prefix="/api/cart", tags=["Cart"])

@router.post("/", response_model=CartItemResponse)
def add_to_cart(req: CartItemCreate, db: Session = Depends(get_db)):
    # DB에 존재하는 상품인지 확인
    product = db.query(Product).filter(Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="해당 상품을 찾을 수 없습니다.")

    # 장바구니 내 중복 상품(사이즈, 색상 포함) 확인
    existing_item = db.query(CartItem).filter(
        CartItem.user_id == req.user_id,
        CartItem.product_id == req.product_id,
        CartItem.selected_size == req.selected_size,
        CartItem.selected_color == req.selected_color
    ).first()

    try:
        if existing_item:
            # 완전히 동일한 옵션의 상품이 이미 있다면 수량(quantity)만 증가
            existing_item.quantity += req.quantity
            db.commit()
            db.refresh(existing_item)
            return existing_item
        else:
            # 장바구니에 없는 새로운 상품이거나 옵션이 다르면 새로 DB에 추가
            new_cart_item = CartItem(
                user_id=req.user_id,
                product_id=req.product_id,
                quantity=req.quantity,
                selected_size=req.selected_size,
                selected_color=req.selected_color
            )
            db.add(new_cart_item)
            db.commit()
            db.refresh(new_cart_item)
            return new_cart_item
            
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"장바구니 처리 중 오류가 발생했습니다: {str(e)}")
    
@router.get("/{user_id}", response_model=List[CartItemResponse])
def get_cart_items(user_id: int, db: Session = Depends(get_db)):
    """
    특정 유저의 장바구니 목록을 최신순으로 조회합니다.
    """
    try:
        # filter: 해당 유저의 데이터만 필터링
        # order_by: 담은 일시(created_at) 기준 내림차순(desc) 정렬
        cart_items = db.query(CartItem)\
            .filter(CartItem.user_id == user_id)\
            .order_by(CartItem.created_at.desc())\
            .all()
        
        return cart_items
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"장바구니 목록 조회 중 오류가 발생했습니다: {str(e)}"
        )