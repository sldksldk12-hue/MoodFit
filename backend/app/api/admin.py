"""MoodFit 관리자 전용 API.

기존 API 파일을 수정하지 않고 관리자 기능만 별도 라우터로 제공합니다.
"""
from datetime import datetime, timedelta
from typing import Literal, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.api.auth import verify_token
from app.db.database import get_db
from app.domains.product.service import CATEGORY_MAP, generate_gpt_product_mood_tags
from app.models.models import (
    Inquiry,
    Order,
    OrderItem,
    Product,
    ProductCategory,
    ProductMoodTag,
    ProductReview,
    User,
)

router = APIRouter(prefix="/api/admin", tags=["Admin"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/moodfit/login")


class ProductTagPayload(BaseModel):
    mood_tag: str = Field(default="#편안함", min_length=1, max_length=50)
    weather_tag: str = Field(default="#맑음", min_length=1, max_length=50)
    season_tag: str = Field(default="#사계절", min_length=1, max_length=50)
    tour_tag: Optional[str] = Field(default="#카페/도심", max_length=50)


class ProductAnalysisRequest(BaseModel):
    product_name: str = Field(min_length=1, max_length=255)
    brand: str = Field(default="", max_length=100)
    product_content: Optional[str] = None


class ProductCreate(BaseModel):
    product_name: str = Field(min_length=1, max_length=255)
    category_id: int
    original_price: int = Field(ge=0)
    discount_price: int = Field(ge=0)
    inventory: int = Field(default=0, ge=0)
    brand: str = Field(min_length=1, max_length=100)
    gender_target: Literal["남성", "여성", "공용"] = "공용"
    image_urls: list[str] = Field(min_length=1)
    purchase_link: Optional[str] = Field(default=None, max_length=1024)
    product_content: Optional[str] = None
    tags: ProductTagPayload


class ProductUpdate(BaseModel):
    product_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    category_id: Optional[int] = None
    original_price: Optional[int] = Field(default=None, ge=0)
    discount_price: Optional[int] = Field(default=None, ge=0)
    inventory: Optional[int] = Field(default=None, ge=0)
    brand: Optional[str] = Field(default=None, min_length=1, max_length=100)
    gender_target: Optional[str] = Field(default=None, min_length=1, max_length=10)
    image_urls: Optional[list[str]] = None
    product_content: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    order_status: Literal[
        "결제완료", "상품준비중", "배송중", "배송완료", "주문취소", "환불완료"
    ]


class InquiryReply(BaseModel):
    reply_content: str = Field(min_length=1, max_length=3000)


class UserRoleUpdate(BaseModel):
    admin_role: Literal["USER", "ADMIN"]


def require_admin(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="유효하지 않거나 만료된 토큰입니다.")

    user = db.query(User).filter(User.id == payload.get("id")).first()
    if not user:
        raise HTTPException(status_code=404, detail="관리자 계정을 찾을 수 없습니다.")
    if user.admin_role != "ADMIN":
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")
    return user


def product_to_dict(product: Product) -> dict:
    raw_images = product.image_url
    if isinstance(raw_images, list):
        image_urls = [str(item).strip() for item in raw_images if item and str(item).strip()]
    elif isinstance(raw_images, dict):
        image = raw_images.get("url") or raw_images.get("image_url")
        image_urls = [image] if image else []
    elif raw_images:
        image_urls = [str(raw_images).strip()]
    else:
        image_urls = []

    image = image_urls[0] if image_urls else None

    return {
        "id": product.id,
        "product_name": product.product_name,
        "category_id": product.category_id,
        "category_name": product.category.category_name if product.category else None,
        "brand": product.brand,
        "original_price": product.original_price,
        "discount_price": product.discount_price,
        "inventory": product.inventory,
        "like_count": product.like_count,
        "average_rating": float(product.average_rating or 0),
        "image_url": image,
        "image_urls": image_urls,
        "gender_target": product.gender_target,
        "product_content": product.product_content,
        "tags": [{
            "mood_tag": tag.mood_tag,
            "weather_tag": tag.weather_tag,
            "season_tag": tag.season_tag,
            "tour_tag": tag.tour_tag,
        } for tag in product.mood_tags],
        "created_at": product.created_at,
    }


@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    today = datetime.now().date()
    today_start = datetime.combine(today, datetime.min.time())
    week_start = today_start - timedelta(days=6)

    total_sales = db.query(func.coalesce(func.sum(Order.total_price), 0)).filter(
        Order.order_status.notin_(["주문취소", "환불완료"])
    ).scalar()
    today_orders = db.query(func.count(Order.id)).filter(Order.created_at >= today_start).scalar()
    user_count = db.query(func.count(User.id)).scalar()
    waiting_inquiries = db.query(func.count(Inquiry.id)).filter(
        Inquiry.inq_status == "답변대기"
    ).scalar()
    low_stock = db.query(func.count(Product.id)).filter(Product.inventory <= 5).scalar()
    review_count = db.query(func.count(ProductReview.id)).scalar()

    daily_rows = (
        db.query(
            func.date(Order.created_at).label("day"),
            func.coalesce(func.sum(Order.total_price), 0).label("sales"),
            func.count(Order.id).label("orders"),
        )
        .filter(Order.created_at >= week_start)
        .filter(Order.order_status.notin_(["주문취소", "환불완료"]))
        .group_by(func.date(Order.created_at))
        .all()
    )
    daily_map = {str(row.day): row for row in daily_rows}
    daily_sales = []
    for offset in range(7):
        day = week_start.date() + timedelta(days=offset)
        row = daily_map.get(str(day))
        daily_sales.append({
            "date": str(day),
            "sales": int(row.sales) if row else 0,
            "orders": int(row.orders) if row else 0,
        })

    recent_orders = (
        db.query(Order)
        .options(joinedload(Order.user))
        .order_by(Order.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "kpi": {
            "total_sales": int(total_sales or 0),
            "today_orders": int(today_orders or 0),
            "user_count": int(user_count or 0),
            "waiting_inquiries": int(waiting_inquiries or 0),
            "low_stock": int(low_stock or 0),
            "review_count": int(review_count or 0),
        },
        "daily_sales": daily_sales,
        "recent_orders": [
            {
                "id": order.id,
                "order_number": order.order_number,
                "user_account": order.user.user_account if order.user else "탈퇴회원",
                "total_price": order.total_price,
                "order_status": order.order_status,
                "created_at": order.created_at,
            }
            for order in recent_orders
        ],
    }


@router.get("/categories")
def get_categories(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    categories = db.query(ProductCategory).order_by(ProductCategory.category_name).all()
    return [{"id": item.id, "category_name": item.category_name, "parent_id": item.parent_id} for item in categories]


def _recommend_category(db: Session, product_name: str) -> ProductCategory:
    normalized = product_name.lower().strip()
    for keyword, category_id in CATEGORY_MAP.items():
        if keyword.lower() in normalized:
            category = db.query(ProductCategory).filter(ProductCategory.id == category_id).first()
            if category:
                return category

    # 정확히 매칭되는 키워드가 없으면 첫 번째 하위 카테고리를 안전한 기본값으로 사용합니다.
    category = (
        db.query(ProductCategory)
        .filter(ProductCategory.parent_id.isnot(None))
        .order_by(ProductCategory.id)
        .first()
    )
    if not category:
        raise HTTPException(status_code=400, detail="등록 가능한 상품 카테고리가 없습니다.")
    return category


@router.post("/products/analyze")
def analyze_product(
    req: ProductAnalysisRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    category = _recommend_category(db, req.product_name)
    tags = generate_gpt_product_mood_tags(
        product_name=req.product_name,
        category_name=category.category_name,
        brand=req.brand or "브랜드 미정",
    )
    ai_used = bool(tags)
    tags = tags or {
        "mood_tag": "#편안함",
        "weather_tag": "#맑음",
        "season_tag": "#사계절",
        "tour_tag": "#카페/도심",
    }
    return {
        "category_id": category.id,
        "category_name": category.category_name,
        "tags": tags,
        "ai_used": ai_used,
    }


@router.post("/products", status_code=status.HTTP_201_CREATED)
def create_product(
    req: ProductCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    category = db.query(ProductCategory).filter(ProductCategory.id == req.category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="존재하지 않는 카테고리입니다.")

    image_urls = [url.strip() for url in req.image_urls if url and url.strip()]
    if not image_urls:
        raise HTTPException(status_code=400, detail="상품 이미지 URL을 1개 이상 입력하세요.")
    if req.discount_price > req.original_price and req.original_price > 0:
        raise HTTPException(status_code=400, detail="판매가는 원가보다 높을 수 없습니다.")

    product = Product(
        shop_product_id=f"admin-{uuid4().hex}",
        product_name=req.product_name.strip(),
        category_id=req.category_id,
        original_price=req.original_price,
        discount_price=req.discount_price,
        image_url=image_urls,
        purchase_link=req.purchase_link or None,
        product_content=req.product_content or None,
        brand=req.brand.strip(),
        gender_target=req.gender_target,
        inventory=req.inventory,
        average_rating=0,
        like_count=0,
    )
    try:
        db.add(product)
        db.flush()
        db.add(ProductMoodTag(
            product_id=product.id,
            mood_tag=req.tags.mood_tag.strip(),
            weather_tag=req.tags.weather_tag.strip(),
            season_tag=req.tags.season_tag.strip(),
            tour_tag=req.tags.tour_tag.strip() if req.tags.tour_tag else None,
        ))
        db.commit()
        product = (
            db.query(Product)
            .options(joinedload(Product.category), joinedload(Product.mood_tags))
            .filter(Product.id == product.id)
            .first()
        )
        return product_to_dict(product)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"상품 등록 실패: {exc}")


@router.get("/products")
def get_products(
    q: str = "",
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    low_stock_only: bool = False,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = db.query(Product).options(joinedload(Product.category), joinedload(Product.mood_tags))
    if q.strip():
        pattern = f"%{q.strip()}%"
        query = query.filter(or_(Product.product_name.ilike(pattern), Product.brand.ilike(pattern)))
    if low_stock_only:
        query = query.filter(Product.inventory <= 5)

    total = query.count()
    products = query.order_by(Product.created_at.desc()).offset((page - 1) * size).limit(size).all()
    return {"items": [product_to_dict(item) for item in products], "total": total, "page": page, "size": size}


@router.patch("/products/{product_id}")
def update_product(
    product_id: int,
    req: ProductUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="상품을 찾을 수 없습니다.")

    data = req.model_dump(exclude_unset=True)
    if "category_id" in data and data["category_id"] is not None:
        category = db.query(ProductCategory).filter(ProductCategory.id == data["category_id"]).first()
        if not category:
            raise HTTPException(status_code=400, detail="존재하지 않는 카테고리입니다.")

    if "image_urls" in data:
        image_urls = [url.strip() for url in (data.pop("image_urls") or []) if url and url.strip()]
        if not image_urls:
            raise HTTPException(status_code=400, detail="상품 이미지 URL을 1개 이상 입력하세요.")
        product.image_url = image_urls

    for key, value in data.items():
        setattr(product, key, value)

    try:
        db.commit()
        db.refresh(product)
        return product_to_dict(product)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"상품 수정 실패: {exc}")


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="상품을 찾을 수 없습니다.")
    has_order = db.query(OrderItem.id).filter(OrderItem.product_id == product_id).first()
    if has_order:
        raise HTTPException(status_code=409, detail="주문 이력이 있는 상품은 삭제할 수 없습니다. 재고를 0으로 변경하세요.")
    try:
        db.delete(product)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"상품 삭제 실패: {exc}")


@router.get("/orders")
def get_orders(
    q: str = "",
    order_status: str = "",
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = db.query(Order).options(joinedload(Order.user), joinedload(Order.order_items))
    if q.strip():
        pattern = f"%{q.strip()}%"
        query = query.join(User).filter(or_(Order.order_number.ilike(pattern), User.user_account.ilike(pattern)))
    if order_status:
        query = query.filter(Order.order_status == order_status)
    total = query.count()
    orders = query.order_by(Order.created_at.desc()).offset((page - 1) * size).limit(size).all()
    return {
        "items": [{
            "id": order.id,
            "order_number": order.order_number,
            "user_id": order.user_id,
            "user_account": order.user.user_account if order.user else "탈퇴회원",
            "selected_order": order.selected_order,
            "total_price": order.total_price,
            "order_status": order.order_status,
            "item_count": sum(item.quantity for item in order.order_items),
            "created_at": order.created_at,
        } for order in orders],
        "total": total, "page": page, "size": size,
    }


@router.patch("/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    req: OrderStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다.")
    order.order_status = req.order_status
    db.commit()
    return {"id": order.id, "order_status": order.order_status}


@router.get("/inquiries")
def get_inquiries(
    q: str = "",
    inq_status: str = "",
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = db.query(Inquiry).options(joinedload(Inquiry.user), joinedload(Inquiry.product))
    if q.strip():
        pattern = f"%{q.strip()}%"
        query = query.filter(or_(Inquiry.title.ilike(pattern), Inquiry.content.ilike(pattern)))
    if inq_status:
        query = query.filter(Inquiry.inq_status == inq_status)
    items = query.order_by(Inquiry.created_at.desc()).all()
    return [{
        "id": item.id,
        "user_account": item.user.user_account if item.user else "탈퇴회원",
        "product_id": item.product_id,
        "product_name": item.product.product_name if item.product else "삭제된 상품",
        "title": item.title,
        "content": item.content,
        "reply_content": item.reply_content,
        "inq_status": item.inq_status,
        "created_at": item.created_at,
        "replied_at": item.replied_at,
    } for item in items]


@router.patch("/inquiries/{inquiry_id}/reply")
def reply_inquiry(
    inquiry_id: int,
    req: InquiryReply,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    inquiry = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    if not inquiry:
        raise HTTPException(status_code=404, detail="문의를 찾을 수 없습니다.")
    inquiry.reply_content = req.reply_content.strip()
    inquiry.inq_status = "답변완료"
    inquiry.replied_at = datetime.now()
    db.commit()
    return {"id": inquiry.id, "inq_status": inquiry.inq_status, "reply_content": inquiry.reply_content}


@router.get("/users")
def get_users(
    q: str = "",
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = db.query(User)
    if q.strip():
        pattern = f"%{q.strip()}%"
        query = query.filter(or_(User.user_account.ilike(pattern), User.email.ilike(pattern)))
    users = query.order_by(User.created_at.desc()).all()
    return [{
        "id": user.id,
        "user_account": user.user_account,
        "email": user.email,
        "admin_role": user.admin_role,
        "created_at": user.created_at,
        "order_count": len(user.orders),
        "review_count": len(user.reviews),
    } for user in users]


@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    req: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="회원을 찾을 수 없습니다.")
    if user.id == current_admin.id and req.admin_role != "ADMIN":
        raise HTTPException(status_code=400, detail="현재 로그인한 관리자의 권한은 해제할 수 없습니다.")
    user.admin_role = req.admin_role
    db.commit()
    return {"id": user.id, "admin_role": user.admin_role}


@router.get("/reviews")
def get_reviews(
    q: str = "",
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = db.query(ProductReview).options(joinedload(ProductReview.user))
    if q.strip():
        pattern = f"%{q.strip()}%"
        query = query.filter(ProductReview.content.ilike(pattern))
    reviews = query.order_by(ProductReview.created_at.desc()).all()
    product_ids = {item.product_id for item in reviews}
    products = db.query(Product).filter(Product.id.in_(product_ids)).all() if product_ids else []
    product_map = {item.id: item.product_name for item in products}
    return [{
        "id": review.id,
        "user_account": review.user.user_account if review.user else "탈퇴회원",
        "product_id": review.product_id,
        "product_name": product_map.get(review.product_id, "삭제된 상품"),
        "rating": float(review.rating),
        "content": review.content,
        "image_url": review.image_url,
        "created_at": review.created_at,
    } for review in reviews]


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    review = db.query(ProductReview).filter(ProductReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="리뷰를 찾을 수 없습니다.")
    product_id = review.product_id
    db.delete(review)
    db.flush()
    average = db.query(func.avg(ProductReview.rating)).filter(ProductReview.product_id == product_id).scalar()
    product = db.query(Product).filter(Product.id == product_id).first()
    if product:
        product.average_rating = round(float(average or 0), 1)
    db.commit()
