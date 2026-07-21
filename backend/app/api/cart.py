# app/api/cart.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import CartItem, Product
from app.schemas.cart_schema import CartItemCreate, CartItemResponse,CartItemQuantityUpdate
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
@router.put("/{cart_item_id}", response_model=CartItemResponse)
def update_cart_item_quantity(
    cart_item_id: int,
    req: CartItemQuantityUpdate,
    db: Session = Depends(get_db),
):
    """
    장바구니 상품의 수량을 수정합니다.

    cart_item_id:
    - 장바구니 행의 ID

    req.user_id:
    - 현재 로그인한 사용자 ID

    req.quantity:
    - 변경할 수량
    """

    # 수량은 1개 이상이어야 합니다.
    if req.quantity < 1:
        raise HTTPException(
            status_code=400,
            detail="상품 수량은 1개 이상이어야 합니다.",
        )

    # 장바구니 ID와 사용자 ID가 모두 일치하는 항목 조회
    cart_item = (
        db.query(CartItem)
        .filter(
            CartItem.id == cart_item_id,
            CartItem.user_id == req.user_id,
        )
        .first()
    )

    if not cart_item:
        raise HTTPException(
            status_code=404,
            detail="장바구니 상품을 찾을 수 없습니다.",
        )

    # 해당 상품의 재고를 확인하기 위해 상품 조회
    product = (
        db.query(Product)
        .filter(Product.id == cart_item.product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="해당 상품을 찾을 수 없습니다.",
        )

    # 재고보다 많은 수량으로 변경하지 못하도록 검사
    if (
        product.inventory is not None
        and req.quantity > product.inventory
    ):
        raise HTTPException(
            status_code=400,
            detail=f"최대 {product.inventory}개까지 구매할 수 있습니다.",
        )

    try:
        cart_item.quantity = req.quantity

        db.commit()
        db.refresh(cart_item)

        return cart_item

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"장바구니 수량 수정 중 오류가 발생했습니다: {str(error)}",
        )
# 장바구니 상품 삭제
@router.delete("/{cart_item_id}")
def delete_cart_item(
    cart_item_id: int,
    user_id: int,
    db: Session = Depends(get_db),
):
    """
    장바구니 상품 하나를 삭제합니다.

    요청 예시:
    DELETE /api/cart/3?user_id=2
    """

    # 장바구니 ID와 사용자 ID가 모두 일치하는 항목 조회
    cart_item = (
        db.query(CartItem)
        .filter(
            CartItem.id == cart_item_id,
            CartItem.user_id == user_id,
        )
        .first()
    )

    if not cart_item:
        raise HTTPException(
            status_code=404,
            detail="삭제할 장바구니 상품을 찾을 수 없습니다.",
        )

    try:
        db.delete(cart_item)
        db.commit()

        return {
            "message": "장바구니 상품이 삭제되었습니다.",
            "cart_item_id": cart_item_id,
        }

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"장바구니 상품 삭제 중 오류가 발생했습니다: {str(error)}",
        )