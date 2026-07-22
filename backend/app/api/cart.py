# app/api/cart.py
import traceback
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import CartItem, Product
from app.schemas.cart_schema import CartItemCreate, CartItemResponse, CartItemQuantityUpdate
from typing import List

router = APIRouter(prefix="/api/cart", tags=["Cart"])

@router.post("/", response_model=CartItemResponse)
def add_to_cart(req: CartItemCreate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="해당 상품을 찾을 수 없습니다.")

    existing_item = db.query(CartItem).filter(
        CartItem.user_id == req.user_id,
        CartItem.product_id == req.product_id,
        CartItem.selected_size == req.selected_size,
        CartItem.selected_color == req.selected_color
    ).first()

    try:
        if existing_item:
            existing_item.quantity += req.quantity
            db.commit()
            db.refresh(existing_item)
            return existing_item
        else:
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
    """특정 유저의 장바구니 목록을 최신순으로 조회합니다."""
    try:
        cart_items = db.query(CartItem)\
            .filter(CartItem.user_id == user_id)\
            .order_by(CartItem.created_at.desc())\
            .all()
        return cart_items
        
    except Exception as e:
        # 터미널에 에러의 정확한 원인(Traceback)을 강제 출력
        print("❌ 장바구니 조회 중 내부 에러 발생:")
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"장바구니 목록 조회 중 오류가 발생했습니다: {str(e)}"
        )

@router.put("/{cart_item_id}", response_model=CartItemResponse)
def update_cart_item_quantity(cart_item_id: int, req: CartItemQuantityUpdate, db: Session = Depends(get_db)):
    if req.quantity < 1:
        raise HTTPException(status_code=400, detail="상품 수량은 1개 이상이어야 합니다.")

    cart_item = db.query(CartItem).filter(CartItem.id == cart_item_id, CartItem.user_id == req.user_id).first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="장바구니 상품을 찾을 수 없습니다.")

    product = db.query(Product).filter(Product.id == cart_item.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="해당 상품을 찾을 수 없습니다.")

    if product.inventory is not None and req.quantity > product.inventory:
        raise HTTPException(status_code=400, detail=f"최대 {product.inventory}개까지 구매할 수 있습니다.")

    try:
        cart_item.quantity = req.quantity
        db.commit()
        db.refresh(cart_item)
        return cart_item

    except Exception as error:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"장바구니 수량 수정 중 오류가 발생했습니다: {str(error)}")
        
@router.delete("/{cart_item_id}")
def delete_cart_item(cart_item_id: int, user_id: int, db: Session = Depends(get_db)):
    cart_item = db.query(CartItem).filter(CartItem.id == cart_item_id, CartItem.user_id == user_id).first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="삭제할 장바구니 상품을 찾을 수 없습니다.")

    try:
        db.delete(cart_item)
        db.commit()
        return {"message": "장바구니 상품이 삭제되었습니다.", "cart_item_id": cart_item_id}

    except Exception as error:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"장바구니 상품 삭제 중 오류가 발생했습니다: {str(error)}")