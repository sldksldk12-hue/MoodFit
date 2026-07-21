# backend/app/api/order.py
import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import Order, OrderItem, Product, User, UserAddress

router = APIRouter()

# Pydantic Schemas
class AddressSchema(BaseModel):
    receiver_name: str
    call_number: str
    user_address: str
    zip_code: str
    address_detail: str
    delivery_request: Optional[str] = None

class OrderItemInput(BaseModel):
    product_id: int
    quantity: int
    selected_size: str
    selected_color: Optional[str] = None

class OrderCreateRequest(BaseModel):
    user_id: int
    address_id: Optional[int] = None
    address_info: Optional[AddressSchema] = None
    selected_order: str  # 결제 수단 (예: "신용카드")
    items: List[OrderItemInput]


@router.post("/", status_code=status.HTTP_201_CREATED, summary="주문 생성 (체크아웃)")
def create_order(req: OrderCreateRequest, db: Session = Depends(get_db)):
    """새로운 주문을 생성하고 주문 상세(order_items) 내역을 기록합니다."""
    
    # 1. 유저 존재 검증
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 회원 정보입니다."
        )

    # 2. 배송지 주소 해결 (address_id)
    address_id = req.address_id
    if not address_id:
        if req.address_info:
            # 주소 정보가 직접 입력된 경우 신규 등록
            try:
                new_address = UserAddress(
                    user_id=req.user_id,
                    receiver_name=req.address_info.receiver_name,
                    call_number=req.address_info.call_number,
                    user_address=req.address_info.user_address,
                    zip_code=req.address_info.zip_code,
                    address_detail=req.address_info.address_detail,
                    delivery_request=req.address_info.delivery_request,
                    is_default=0
                )
                db.add(new_address)
                db.commit()
                db.refresh(new_address)
                address_id = new_address.id
            except Exception as addr_err:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"배송지 등록 중 오류가 발생했습니다: {str(addr_err)}"
                )
        else:
            # 주소 정보가 없는 경우 기존 저장된 배송지 중 첫 번째(또는 기본 배송지) 활용
            existing_address = db.query(UserAddress).filter(UserAddress.user_id == req.user_id).order_by(UserAddress.is_default.desc()).first()
            if existing_address:
                address_id = existing_address.id
            else:
                # 등록된 배송지가 아예 없는 경우 가데이터 배송지 자동 생성 (Null 제약 조건 우회)
                try:
                    default_address = UserAddress(
                        user_id=req.user_id,
                        receiver_name=user.user_account[:10],
                        call_number="010-0000-0000",
                        user_address="서울시 중구 태평로",
                        zip_code="04524",
                        address_detail="기본 배송지",
                        is_default=1
                    )
                    db.add(default_address)
                    db.commit()
                    db.refresh(default_address)
                    address_id = default_address.id
                except Exception as default_addr_err:
                    db.rollback()
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"임시 배송지 자동 생성 실패: {str(default_addr_err)}"
                    )

    # 3. 상품 검증 및 총액(total_price) 계산
    total_price = 0
    validated_items = []
    
    for item in req.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"ID가 {item.product_id}인 상품을 찾을 수 없습니다."
            )
        
        item_total = product.discount_price * item.quantity
        total_price += item_total
        validated_items.append({
            "product_id": product.id,
            "quantity": item.quantity,
            "price": product.discount_price,  # 구매 당시 금액 보존
            "selected_size": item.selected_size,
            "selected_color": item.selected_color
        })

    # 4. 주문 마스터 (orders) 레코드 생성
    order_number = f"ORD-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"
    try:
        new_order = Order(
            user_id=req.user_id,
            address_id=address_id,
            order_number=order_number,
            selected_order=req.selected_order,
            total_price=total_price,
            order_status="결제완료"
        )
        db.add(new_order)
        db.commit()
        db.refresh(new_order)
    except Exception as order_err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"주문서 저장 실패: {str(order_err)}"
        )

    # 5. 주문 상세 (order_items) 레코드 일괄 생성
    created_items = []
    try:
        for val_item in validated_items:
            new_order_item = OrderItem(
                order_id=new_order.id,
                product_id=val_item["product_id"],
                quantity=val_item["quantity"],
                price=val_item["price"],
                selected_size=val_item["selected_size"],
                selected_color=val_item["selected_color"]
            )
            db.add(new_order_item)
            created_items.append(new_order_item)
        
        db.commit()
        # ID 조회를 위한 새로고침
        for item in created_items:
            db.refresh(item)
            
    except Exception as item_err:
        db.rollback()
        # 주문 마스터도 지우기 위해 트랜잭션 수동 복구
        db.delete(new_order)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"주문 상세 내역 저장 실패: {str(item_err)}"
        )

    return {
        "status": "success",
        "order_id": new_order.id,
        "order_number": new_order.order_number,
        "total_price": new_order.total_price,
        "selected_order": new_order.selected_order,
        "order_status": new_order.order_status,
        "created_at": new_order.created_at,
        "items": [
            {
                "order_item_id": it.id,
                "product_id": it.product_id,
                "quantity": it.quantity,
                "price": it.price,
                "selected_size": it.selected_size,
                "selected_color": it.selected_color
            } for it in created_items
        ]
    }


@router.get("/user/{user_id}", summary="특정 유저의 주문 내역 조회")
def get_user_orders(user_id: int, db: Session = Depends(get_db)):
    """특정 회원의 모든 주문 정보 및 연관된 주문 상세 내역들을 조회합니다."""
    orders = db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()
    
    result = []
    for order in orders:
        items_data = []
        for item in order.order_items:
            product = item.product
            items_data.append({
                "order_item_id": item.id,
                "product_id": item.product_id,
                "product_name": product.product_name if product else "정보 없음",
                "image_url": product.image_url if product else None,
                "quantity": item.quantity,
                "price": item.price,
                "selected_size": item.selected_size,
                "selected_color": item.selected_color
            })
            
        result.append({
            "order_id": order.id,
            "order_number": order.order_number,
            "selected_order": order.selected_order,
            "total_price": order.total_price,
            "order_status": order.order_status,
            "created_at": order.created_at,
            "items": items_data
        })
        
    return result


@router.get("/{order_id}", summary="단일 주문 상세 내역 조회")
def get_order_detail(order_id: int, db: Session = Depends(get_db)):
    """단일 주문 건에 대한 마스터 정보 및 상세 주문 상품 목록을 조회합니다."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 주문 건을 찾을 수 없습니다."
        )
        
    items_data = []
    for item in order.order_items:
        product = item.product
        items_data.append({
            "order_item_id": item.id,
            "product_id": item.product_id,
            "product_name": product.product_name if product else "정보 없음",
            "image_url": product.image_url if product else None,
            "quantity": item.quantity,
            "price": item.price,
            "selected_size": item.selected_size,
            "selected_color": item.selected_color
        })
        
    return {
        "order_id": order.id,
        "order_number": order.order_number,
        "selected_order": order.selected_order,
        "total_price": order.total_price,
        "order_status": order.order_status,
        "created_at": order.created_at,
        "items": items_data
    }
