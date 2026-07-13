from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import (
    String,
    Integer,
    Numeric,
    Text,
    Float,
    ForeignKey,
    DateTime,
    Index,
    func,
    JSON,
    UniqueConstraint
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class User(Base):
    """회원 정보"""
    __tablename__ = "users"
    __table_args__ = {"comment": "회원 정보"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="회원 일련번호")
    user_account: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, comment="회원 ID")
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, comment="이메일 주소")
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False, comment="암호화된 비밀번호")
    admin_role: Mapped[str] = mapped_column(String(20), nullable=False, default='USER', comment="회원 권한")

    # 선호 설정 정보 (UserPreference 통합)
    gender: Mapped[Optional[str]] = mapped_column(String(10), nullable=True, comment="성별")
    user_height: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 1), nullable=True, comment="키")
    user_weight: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 1), nullable=True, comment="몸무게")
    body_form: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="체형")
    preferred_styles: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="선호하는 스타일")
    liked_colors: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="선호 색상")
    disliked_colors: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="기피 색상")
    pref_updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        onupdate=func.now(),
        nullable=True,
        comment="선호 설정 최근 수정 일시"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False, comment="가입 일시"
    )

    # Relationships
    # 1:N 관계
    addresses: Mapped[List["UserAddress"]] = relationship("UserAddress", back_populates="user", cascade="all, delete-orphan")
    activity_logs: Mapped[List["UserActivityLog"]] = relationship("UserActivityLog", back_populates="user")
    chat_sessions: Mapped[List["ChatSession"]] = relationship("ChatSession", back_populates="user")
    likes: Mapped[List["ProductLike"]] = relationship("ProductLike", back_populates="user", cascade="all, delete-orphan")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    inquiries: Mapped[List["Inquiry"]] = relationship("Inquiry", back_populates="user", cascade="all, delete-orphan")
    reviews: Mapped[List["ProductReview"]] = relationship("ProductReview", back_populates="user", cascade="all, delete-orphan")
    cart_items: Mapped[List["CartItem"]] = relationship("CartItem", back_populates="user", cascade="all, delete-orphan")
    recommendation_sessions: Mapped[List["RecommendationSession"]] = relationship("RecommendationSession", back_populates="user", cascade="all, delete-orphan")





class UserAddress(Base):
    """회원 배송지 주소 목록"""
    __tablename__ = "user_addresses"
    __table_args__ = {"comment": "회원 배송지 주소 목록"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="주소 일련번호")
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="회원 일련번호"
    )
    receiver_name: Mapped[str] = mapped_column(String(10), nullable=False, comment="받는 사람 이름")
    call_number: Mapped[str] = mapped_column(String(20), nullable=False, comment="전화번호")   
    user_address: Mapped[str] = mapped_column(String(255), nullable=False, comment="주소 내용")
    zip_code: Mapped[str] = mapped_column(String(20), nullable=False, comment="우편번호")
    address_detail: Mapped[str] = mapped_column(String(255), nullable=False, comment="상세 주소")
    delivery_request: Mapped[str] = mapped_column(Text, nullable=True, comment="배송시 요청사항")
    is_default: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="기본 배송지 여부 (1: 기본, 0: 일반)")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False, 
        comment="등록 일시"
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="addresses")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="address")


class ProductCategory(Base):
    """상품 카테고리"""
    __tablename__ = "product_categories"
    __table_args__ = {"comment": "상품 카테고리"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="카테고리 ID")
    category_name: Mapped[str] = mapped_column(String(50), nullable=False, comment="카테고리명")
    parent_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("product_categories.id"), nullable=True, comment="상위 카테고리 ID"
    )

    # Relationships
    parent: Mapped[Optional["ProductCategory"]] = relationship(
        "ProductCategory", remote_side=[id], back_populates="subcategories"
    )
    subcategories: Mapped[List["ProductCategory"]] = relationship(
        "ProductCategory", back_populates="parent"
    )
    products: Mapped[List["Product"]] = relationship("Product", back_populates="category")


class Product(Base):
    """상품 마스터"""
    __tablename__ = "products"
    __table_args__ = {"comment": "상품 마스터"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="상품 일련번호")
    category_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("product_categories.id", ondelete="RESTRICT"), nullable=False, comment="카테고리 ID"
    )
    shop_product_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, comment="쇼핑몰 상품 고유 ID")
    product_name: Mapped[str] = mapped_column(String(255), nullable=False, comment="상품명")
    original_price: Mapped[int] = mapped_column(Integer, nullable=False, comment="원가")
    discount_price: Mapped[int] = mapped_column(Integer, nullable=False, comment="판매가")
    image_url: Mapped[str] = mapped_column(String(1024), nullable=False, comment="상품 이미지 URL")
    product_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="상품 상세 설명")
    brand: Mapped[str] = mapped_column(String(100), nullable=False, comment="브랜드명")
    gender_target: Mapped[str] = mapped_column(String(10), nullable=False, comment="추천 대상 성별")
    average_rating: Mapped[Decimal] = mapped_column(
        Numeric(2, 1), nullable=False, default=Decimal("0.0"), comment="평균 별점"
    )
    like_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="좋아요 수")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False, comment="상품 등록 일시"
    )

    # Relationships
    category: Mapped["ProductCategory"] = relationship("ProductCategory", back_populates="products")
    mood_tags: Mapped[List["ProductMoodTag"]] = relationship(
        "ProductMoodTag", back_populates="product", cascade="all, delete-orphan"
    )
    size_infos: Mapped[List["ProductSizeInfo"]] = relationship(
        "ProductSizeInfo", back_populates="product", cascade="all, delete-orphan"
    )
    activity_logs: Mapped[List["UserActivityLog"]] = relationship(
        "UserActivityLog", back_populates="product", cascade="all, delete-orphan"
    )
    likes: Mapped[List["ProductLike"]] = relationship(
        "ProductLike", back_populates="product", cascade="all, delete-orphan"
    )
    order_items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem", back_populates="product"
    )
    inquiries: Mapped[List["Inquiry"]] = relationship(
        "Inquiry", back_populates="product", cascade="all, delete-orphan"
    )
    cart_items: Mapped[List["CartItem"]] = relationship(
        "CartItem", back_populates="product", cascade="all, delete-orphan"
    )
    recommendation_items: Mapped[List["RecommendationItem"]] = relationship(
        "RecommendationItem", back_populates="product", cascade="all, delete-orphan"
    )


class ProductMoodTag(Base):
    """상품 감성 태그"""
    __tablename__ = "product_mood_tags"
    __table_args__ = {"comment": "상품 감성 태그"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="태그 일련번호")
    product_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, comment="상품 일련번호"
    )
    mood_tag: Mapped[str] = mapped_column(String(50), nullable=False, comment="감정 태그")
    weather_tag: Mapped[str] = mapped_column(String(50), nullable=False, comment="날씨 태그")
    season_tag: Mapped[str] = mapped_column(String(50), nullable=False, comment="계절 태그")
    tour_tag: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, comment="관광지 태그 (자연, 역사, 레포츠, 쇼핑, 음식 등)")
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True, default=1.0, comment="태그 매칭 강도 점수")

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="mood_tags")


class ProductSizeInfo(Base):
    """상의 및 하의 통합 상세 실측 치수 테이블"""
    __tablename__ = "product_size_info"
    __table_args__ = (
        Index("idx_product_size_lookup", "product_id", "size_name"),
        {"comment": "상의 및 하의 통합 상세 실측 치수 테이블"}
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="상세 사이즈 일련번호")
    product_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, comment="상품 일련번호"
    )
    size_name: Mapped[str] = mapped_column(String(20), nullable=False, comment="사이즈 표기명 (M, 30인치, Free 등)")
    shoulder_cm: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 1), nullable=True, default=None, comment="어깨 단면 너비(cm)")
    chest_cm: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 1), nullable=True, default=None, comment="가슴 단면 너비(cm)")
    sleeve_cm: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 1), nullable=True, default=None, comment="소매 기장(cm)")
    waist_cm: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 1), nullable=True, default=None, comment="허리 단면 너비(cm)")
    thigh_cm: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 1), nullable=True, default=None, comment="허벅지 단면 너비(cm)")
    rise_cm: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 1), nullable=True, default=None, comment="밑위 길이(cm)")
    total_length_cm: Mapped[Decimal] = mapped_column(Numeric(4, 1), nullable=False, default=Decimal("0.0"), comment="총 기장(cm)")
    size_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, default=None, comment="비정형 확장 치수 메타데이터 (JSON)")

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="size_infos")


class UserActivityLog(Base):
    """행동 로그"""
    __tablename__ = "user_activity_logs"
    __table_args__ = {"comment": "행동 로그"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="로그 일련번호")
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, comment="회원 일련번호"
    )
    product_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, comment="상품 일련번호"
    )
    action_type: Mapped[str] = mapped_column(String(50), nullable=False, comment="행동 유형")
    dwell_time: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=0, comment="체류 시간")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False, comment="기록 일시"
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="activity_logs")
    product: Mapped["Product"] = relationship("Product", back_populates="activity_logs")


class ChatSession(Base):
    """대화 세션"""
    __tablename__ = "chat_sessions"
    __table_args__ = {"comment": "대화 세션"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="세션 일련번호")
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, comment="회원 일련번호"
    )
    session_uuid: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, comment="세션 식별 UUID")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False, comment="세션 생성 일시"
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="chat_sessions")
    messages: Mapped[List["ChatMessage"]] = relationship(
        "ChatMessage", back_populates="session", cascade="all, delete-orphan"
    )
    weather_logs: Mapped[List["WeatherLog"]] = relationship(
        "WeatherLog", back_populates="session", cascade="all, delete-orphan"
    )
    tour_logs: Mapped[List["TourLog"]] = relationship(
        "TourLog", back_populates="session", cascade="all, delete-orphan"
    )
    recommendation_sessions: Mapped[List["RecommendationSession"]] = relationship(
        "RecommendationSession", back_populates="chat_session", cascade="all, delete-orphan"
    )
    ai_call_logs: Mapped[List["AiCallLog"]] = relationship(
        "AiCallLog", back_populates="chat_session", cascade="all, delete-orphan"
    )


class ChatMessage(Base):
    """채팅 메시지"""
    __tablename__ = "chat_messages"
    __table_args__ = {"comment": "채팅 메시지"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="메시지 일련번호")
    session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, comment="세션 일련번호"
    )
    sender_type: Mapped[str] = mapped_column(String(10), nullable=False, comment="발화자 유형")
    message_text: Mapped[str] = mapped_column(Text, nullable=False, comment="메시지 내용")
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        comment="발화 일시"
    )

    # Relationships
    session: Mapped["ChatSession"] = relationship("ChatSession", back_populates="messages")
    emotion_logs: Mapped[List["EmotionLog"]] = relationship(
        "EmotionLog", back_populates="message", cascade="all, delete-orphan"
    )


class EmotionLog(Base):
    """감정 예측 로그"""
    __tablename__ = "emotion_logs"
    __table_args__ = {"comment": "감정 예측 로그"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="감정 로그 일련번호")
    message_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("chat_messages.id", ondelete="CASCADE"), nullable=False, comment="메시지 일련번호"
    )
    predicted_emotion: Mapped[str] = mapped_column(String(50), nullable=False, default='평온', comment="예측 감정")
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True, default=1.0, comment="분류 예측 신뢰도")
    raw_input: Mapped[str] = mapped_column(Text, nullable=False, comment="분석 원본 텍스트")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False, comment="기록 일시"
    )

    # Relationships
    message: Mapped["ChatMessage"] = relationship("ChatMessage", back_populates="emotion_logs")
    recommendation_sessions: Mapped[List["RecommendationSession"]] = relationship(
        "RecommendationSession", back_populates="emotion_log"
    )


class WeatherLog(Base):
    """TPO 환경 인지 날씨 정보"""
    __tablename__ = "weather_logs"
    __table_args__ = {"comment": "TPO 환경 인지 날씨 정보"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="날씨 로그 일련번호")
    session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, comment="세션 일련번호"
    )
    region_name: Mapped[str] = mapped_column(String(100), nullable=False, comment="수집 지역 행정동 명칭")
    temperature: Mapped[Decimal] = mapped_column(Numeric(4, 1), nullable=False, comment="실시간 기온")
    condition_code: Mapped[str] = mapped_column(String(20), nullable=False, comment="날씨 상태 코드")
    extracted_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False, comment="수집 일시"
    )

    # Relationships
    session: Mapped["ChatSession"] = relationship("ChatSession", back_populates="weather_logs")
    recommendation_sessions: Mapped[List["RecommendationSession"]] = relationship(
        "RecommendationSession", back_populates="weather_log"
    )


class TourLog(Base):
    """대화 기반 관광지 추천 로그"""
    __tablename__ = "tour_logs"
    __table_args__ = {"comment": "대화 기반 관광지 추천 로그"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="관광 로그 일련번호")
    session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, comment="세션 일련번호"
    )
    content_id: Mapped[str] = mapped_column(String(50), nullable=False, comment="관광지 콘텐츠 고유 ID")
    title: Mapped[str] = mapped_column(String(255), nullable=False, comment="관광지명")
    content_type: Mapped[str] = mapped_column(String(50), nullable=False, comment="관광 타입 (자연, 역사, 문화, 레포츠, 쇼핑, 음식 등)")
    addr: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, comment="기본 주소 명칭")
    map_x: Mapped[Optional[Decimal]] = mapped_column(Numeric(11, 8), nullable=True, comment="경도 좌표(X)")
    map_y: Mapped[Optional[Decimal]] = mapped_column(Numeric(11, 8), nullable=True, comment="위도 좌표(Y)")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False, comment="기록 일시"
    )

    # Relationships
    session: Mapped["ChatSession"] = relationship("ChatSession", back_populates="tour_logs")
    recommendation_sessions: Mapped[List["RecommendationSession"]] = relationship(
        "RecommendationSession", back_populates="tour_log"
    )


class ProductLike(Base):
    """상품 찜 목록"""
    __tablename__ = "product_likes"
    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_user_product_like"),
        {"comment": "상품 찜 목록"}
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="좋아요 일련번호")
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="회원 일련번호"
    )
    product_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, comment="상품 일련번호"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False, comment="찜 등록 일시"
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="likes")
    product: Mapped["Product"] = relationship("Product", back_populates="likes")


class Order(Base):
    """주문 정보"""
    __tablename__ = "orders"
    __table_args__ = {"comment": "주문 정보"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="주문 일련번호")
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="회원 일련번호"
    )
    address_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("user_addresses.id", ondelete="RESTRICT"), nullable=False, comment="주소 일련번호"
    )    
    order_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, comment="주문 번호 (식별자)")
    selected_order: Mapped[str] = mapped_column(String(20), nullable=False, comment="결제 수단")
    total_price: Mapped[int] = mapped_column(Integer, nullable=False, comment="총 결제 금액")
    order_status: Mapped[str] = mapped_column(String(50), nullable=False, default="결제완료", comment="주문 상태")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False, comment="주문 일시"
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="orders")
    address: Mapped["UserAddress"] = relationship("UserAddress", back_populates="orders")
    order_items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    """주문 상세 내역"""
    __tablename__ = "order_items"
    __table_args__ = {"comment": "주문 상세 내역"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="주문 상세 일련번호")
    order_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, comment="주문 일련번호"
    )
    product_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, comment="상품 일련번호"
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1, comment="구매 수량")
    price: Mapped[int] = mapped_column(Integer, nullable=False, comment="구매 당시 단가")
    selected_size: Mapped[str] = mapped_column(String(20), nullable=False, comment="선택한 사이즈")

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="order_items")
    product: Mapped["Product"] = relationship("Product", back_populates="order_items")
    review: Mapped[Optional["ProductReview"]] = relationship(
        "ProductReview", back_populates="order_item", uselist=False, cascade="all, delete-orphan"
    )


class Inquiry(Base):
    """상품 문의 Q&A"""
    __tablename__ = "inquiries"
    __table_args__ = {"comment": "상품 문의 Q&A"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="문의 일련번호")
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="회원 일련번호"
    )
    product_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, comment="상품 일련번호"
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, comment="문의 제목")
    content: Mapped[str] = mapped_column(Text, nullable=False, comment="문의 내용")
    reply_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="관리자 답변 내용")
    inq_status: Mapped[str] = mapped_column(String(20), nullable=False, default="답변대기", comment="답변 상태")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False, comment="등록 일시"
    )
    replied_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, comment="답변 일시")

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="inquiries")
    product: Mapped["Product"] = relationship("Product", back_populates="inquiries")


class ProductReview(Base):
    """상품 리뷰"""
    __tablename__ = "product_reviews"
    __table_args__ = (
        UniqueConstraint("user_id", "order_item_id", name="uq_user_order_item_review"),
        {"comment": "상품 리뷰"}
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="리뷰 일련번호")
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="회원 일련번호"
    )
    order_item_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("order_items.id", ondelete="CASCADE"), nullable=False, comment="주문 상세 일련번호"
    )
    rating: Mapped[Decimal] = mapped_column(Numeric(2, 1), nullable=False, comment="별점 (0.0~5.0점)")
    content: Mapped[str] = mapped_column(Text, nullable=False, comment="리뷰 내용")
    image_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True, comment="리뷰 이미지 URL")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False, comment="리뷰 작성 일시"
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="reviews")
    order_item: Mapped["OrderItem"] = relationship("OrderItem", back_populates="review")


class CartItem(Base):
    """장바구니 상세 내역"""
    __tablename__ = "cart_items"
    __table_args__ = (
        UniqueConstraint("user_id", "product_id", "selected_size", name="uq_user_product_size"),
        {"comment": "장바구니 상세 내역"}
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="장바구니 상세 일련번호")
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="회원 일련번호"
    )
    product_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, comment="상품 일련번호"
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1, comment="담은 수량")
    selected_size: Mapped[str] = mapped_column(String(20), nullable=False, comment="선택한 사이즈")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False, comment="담은 일시"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False, comment="수정 일시"
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="cart_items")
    product: Mapped["Product"] = relationship("Product", back_populates="cart_items")


class RecommendationSession(Base):
    """추천 세션 마스터"""
    __tablename__ = "recommendation_sessions"
    __table_args__ = {"comment": "추천 세션 마스터"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="추천 세션 일련번호")
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="회원 일련번호"
    )
    weather_log_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("weather_logs.id", ondelete="SET NULL"), nullable=True, comment="날씨 로그 일련번호"
    )
    chat_session_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("chat_sessions.id", ondelete="SET NULL"), nullable=True, comment="대화 세션 일련번호"
    )
    emotion_log_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("emotion_logs.id", ondelete="SET NULL"), nullable=True, comment="감정 로그 일련번호"
    )
    tour_log_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("tour_logs.id", ondelete="SET NULL"), nullable=True, comment="관광 로그 일련번호"
    )
    input_query: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="추천 요청 입력 내용")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False, comment="추천 생성 일시"
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="recommendation_sessions")
    weather_log: Mapped[Optional["WeatherLog"]] = relationship("WeatherLog", back_populates="recommendation_sessions")
    chat_session: Mapped[Optional["ChatSession"]] = relationship("ChatSession", back_populates="recommendation_sessions")
    emotion_log: Mapped[Optional["EmotionLog"]] = relationship("EmotionLog", back_populates="recommendation_sessions")
    tour_log: Mapped[Optional["TourLog"]] = relationship("TourLog", back_populates="recommendation_sessions")
    items: Mapped[List["RecommendationItem"]] = relationship("RecommendationItem", back_populates="recommendation_session", cascade="all, delete-orphan")
    ai_call_logs: Mapped[List["AiCallLog"]] = relationship("AiCallLog", back_populates="recommendation_session", cascade="all, delete-orphan")


class RecommendationItem(Base):
    """추천 아이템 상세"""
    __tablename__ = "recommendation_items"
    __table_args__ = (
        UniqueConstraint("recommendation_session_id", "product_id", name="uq_recommendation_session_product"),
        {"comment": "추천 아이템 상세"}
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="추천 아이템 일련번호")
    recommendation_session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("recommendation_sessions.id", ondelete="CASCADE"), nullable=False, comment="추천 세션 일련번호"
    )
    product_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, comment="상품 일련번호"
    )
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True, comment="추천 매칭 점수")
    recommendation_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="추천 사유")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False, comment="추천 일시"
    )

    # Relationships
    recommendation_session: Mapped["RecommendationSession"] = relationship("RecommendationSession", back_populates="items")
    product: Mapped["Product"] = relationship("Product", back_populates="recommendation_items")


class AiCallLog(Base):
    """AI 호출 및 토큰 사용량 로그"""
    __tablename__ = "ai_call_logs"
    __table_args__ = {"comment": "AI 호출 및 토큰 사용량 로그"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="AI 호출 로그 일련번호")
    recommendation_session_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("recommendation_sessions.id", ondelete="SET NULL"), nullable=True, comment="추천 세션 일련번호"
    )
    chat_session_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("chat_sessions.id", ondelete="SET NULL"), nullable=True, comment="대화 세션 일련번호"
    )
    model_name: Mapped[str] = mapped_column(String(100), nullable=False, comment="사용한 AI 모델명")
    prompt_version: Mapped[str] = mapped_column(String(50), nullable=False, comment="시스템 프롬프트 버전 코드")
    prompt_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, comment="입력 토큰 사용량")
    completion_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, comment="출력 토큰 사용량")
    total_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, comment="총 사용 토큰량")
    latency_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, comment="API 응답 속도")
    log_status: Mapped[str] = mapped_column(String(20), nullable=False, default="SUCCESS", comment="호출 상태")
    failure_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="호출 실패 상세 사유")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False, comment="호출 일시"
    )

    # Relationships
    recommendation_session: Mapped[Optional["RecommendationSession"]] = relationship("RecommendationSession", back_populates="ai_call_logs")
    chat_session: Mapped[Optional["ChatSession"]] = relationship("ChatSession", back_populates="ai_call_logs")

