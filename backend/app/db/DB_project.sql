CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '회원 일련번호',
    user_account VARCHAR(50) NOT NULL UNIQUE COMMENT '회원 ID',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '이메일 주소',
    password_hash VARCHAR(255) NOT NULL COMMENT '암호화된 비밀번호',
    admin_role VARCHAR(20) NOT NULL DEFAULT 'USER' COMMENT '회원 권한 (USER: 일반 회원, ADMIN: 최고 관리자)',
    
    -- 선호 설정 정보 (user_preferences 통합)
    gender VARCHAR(10) NULL COMMENT '성별',
    user_height DECIMAL(5,1) NULL COMMENT '키',
    user_weight DECIMAL(5,1) NULL COMMENT '몸무게',
    body_form TEXT NULL COMMENT '체형',
    preferred_styles TEXT NULL COMMENT '선호하는 스타일',
    liked_colors TEXT NULL COMMENT '선호 색상',
    disliked_colors TEXT NULL COMMENT '기피 색상',
    pref_updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '선호 설정 최근 수정 일시',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '가입 일시'
) COMMENT = '회원 정보 및 선호 설정';

CREATE TABLE user_addresses (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '주소 일련번호',
    user_id INT NOT NULL COMMENT '회원 일련번호',
    receiver_name VARCHAR(10) NOT NULL COMMENT '받는 사람 이름',
    call_number VARCHAR(20) NOT NULL COMMENT '전화번호',
    user_address VARCHAR(255) NOT NULL COMMENT '주소 내용',
    zip_code VARCHAR(20) NOT NULL COMMENT '우편번호',
    address_detail VARCHAR(255) NOT NULL COMMENT '상세 주소',
    delivery_request TEXT NULL COMMENT '배송시 요청사항',
    is_default TINYINT(1) DEFAULT 0 COMMENT '기본 배송지 여부 (1: 기본, 0: 일반)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '등록 일시',
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) COMMENT = '회원 배송지 주소 목록';

CREATE TABLE product_categories (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '카테고리 ID',
    category_name VARCHAR(50) NOT NULL COMMENT '카테고리명',
    parent_id INT NULL COMMENT '상위 카테고리 ID',
    FOREIGN KEY (parent_id) REFERENCES product_categories (id)
) COMMENT = '상품 카테고리';

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '상품 일련번호',
    category_id INT NULL COMMENT '카테고리 ID',
    shop_product_id VARCHAR(100) NOT NULL UNIQUE COMMENT '쇼핑몰 상품 고유 ID',
    product_name VARCHAR(255) NOT NULL COMMENT '상품명',
    inventory INT NOT NULL DEFAULT 0 COMMENT '재고 수량',
    original_price INT NOT NULL COMMENT '원가',
    discount_price INT NOT NULL COMMENT '판매가',
    image_url JSON NOT NULL COMMENT '상품 이미지 URL',
    purchase_link VARCHAR(1024) NULL COMMENT '외부 구매 페이지 링크',
    product_content TEXT NULL COMMENT '상품 상세 설명',
    brand VARCHAR(100) NOT NULL COMMENT '브랜드명',
    gender_target VARCHAR(10) NOT NULL COMMENT '추천 대상 성별',
    average_rating DECIMAL(2, 1) NOT NULL DEFAULT 0.0 COMMENT '평균 별점',
    like_count INT NOT NULL DEFAULT 0 COMMENT '좋아요 수',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '상품 등록 일시',
    FOREIGN KEY (category_id) REFERENCES product_categories (id) ON DELETE SET NULL
) COMMENT = '상품 마스터';

CREATE TABLE product_mood_tags (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '태그 일련번호',
    product_id INT NOT NULL COMMENT '상품 일련번호',
    mood_tag VARCHAR(50) NOT NULL COMMENT '감정 태그',
    weather_tag VARCHAR(50) NOT NULL COMMENT '날씨 태그',
    season_tag VARCHAR(50) NOT NULL COMMENT '계절 태그',
    tour_tag VARCHAR(50) NULL COMMENT '관광지 태그 (자연, 역사, 레포츠, 쇼핑, 음식 등)',
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) COMMENT = '상품 감성 태그';

CREATE TABLE product_options (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '옵션 일련번호',
    product_id INT NOT NULL COMMENT '상품 일련번호',
    option_name VARCHAR(50) NOT NULL COMMENT '옵션명 (예: 색상, 사이즈, 추가구성)',
    option_values JSON NOT NULL COMMENT '옵션값 리스트 및 실측 치수 스펙',
    is_required TINYINT(1) NOT NULL DEFAULT 1 COMMENT '필수 선택 여부 (1: 필수, 0: 선택)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '등록 일시',
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) COMMENT = '상품 옵션 및 실측 치수 통합 테이블';

CREATE TABLE user_activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '로그 일련번호',
    user_id INT NULL COMMENT '회원 일련번호',
    product_id INT NOT NULL COMMENT '상품 일련번호',
    action_type VARCHAR(50) NOT NULL COMMENT '행동 유형',
    dwell_time INT DEFAULT 0 COMMENT '체류 시간',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '기록 일시',
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) COMMENT = '행동 로그';

CREATE TABLE chat_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '세션 일련번호',
    user_id INT NULL COMMENT '회원 일련번호',
    session_uuid VARCHAR(64) NOT NULL UNIQUE COMMENT '세션 식별 UUID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '세션 생성 일시',
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) COMMENT = '대화 세션';

CREATE TABLE chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '메시지 일련번호',
    session_id INT NOT NULL COMMENT '세션 일련번호',
    sender_type VARCHAR(10) NOT NULL COMMENT '발화자 유형',
    message_text TEXT NOT NULL COMMENT '메시지 내용',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '발화 일시',
    FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE
) COMMENT = '채팅 메시지';

CREATE TABLE emotion_logs (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '감정 로그 일련번호',
    message_id INT NOT NULL COMMENT '메시지 일련번호',
    predicted_emotion VARCHAR(50) NOT NULL DEFAULT '평온' COMMENT '예측 감정',
    confidence FLOAT DEFAULT 1.0 COMMENT '분류 예측 신뢰도',
    raw_input TEXT NOT NULL COMMENT '분석 원본 텍스트',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '기록 일시',
    FOREIGN KEY (message_id) REFERENCES chat_messages (id) ON DELETE CASCADE
) COMMENT = '감정 예측 로그';

CREATE TABLE weather_logs (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '날씨 로그 일련번호',
    session_id INT NOT NULL COMMENT '세션 일련번호',
    region_name VARCHAR(100) NOT NULL COMMENT '수집 지역 행정동 명칭',
    temperature DECIMAL(4,1) NOT NULL COMMENT '실시간 기온',
    condition_code VARCHAR(20) NOT NULL COMMENT '날씨 상태 코드',
    extracted_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '수집 일시',
    FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE
) COMMENT = 'TPO 환경 인지 날씨 정보';

CREATE TABLE tour_logs (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '관광 로그 일련번호',
    session_id INT NOT NULL COMMENT '세션 일련번호',
    content_id VARCHAR(50) NOT NULL COMMENT '관광지 콘텐츠 고유 ID',
    title VARCHAR(255) NOT NULL COMMENT '관광지명',
    content_type VARCHAR(50) NOT NULL COMMENT '관광 타입 (자연, 역사, 문화, 레포츠, 쇼핑, 음식 등)',
    addr VARCHAR(255) NULL COMMENT '기본 주소 명칭',
    map_x DECIMAL(11,8) NULL COMMENT '경도 좌표(X)',
    map_y DECIMAL(11,8) NULL COMMENT '위도 좌표(Y)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '기록 일시',
    FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE
) COMMENT = '대화 기반 관광지 추천 로그';

CREATE TABLE product_likes (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '좋아요 일련번호',
    user_id INT NOT NULL COMMENT '회원 일련번호',
    product_id INT NOT NULL COMMENT '상품 일련번호',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '찜 등록 일시',
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_product_like (user_id, product_id)
) COMMENT = '상품 찜 목록';

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '주문 일련번호',
    user_id INT NOT NULL COMMENT '회원 일련번호',
    address_id INT NOT NULL COMMENT '주소 일련번호',
    order_number VARCHAR(100) NOT NULL UNIQUE COMMENT '주문 번호 (식별자)',
    selected_order VARCHAR(20) NOT NULL COMMENT '결제 수단',
    total_price INT NOT NULL COMMENT '총 결제 금액',
    order_status VARCHAR(50) NOT NULL DEFAULT '결제완료' COMMENT '주문 상태',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '주문 일시',
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (address_id) REFERENCES user_addresses (id) ON DELETE RESTRICT
) COMMENT = '주문 정보';

CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '주문 상세 일련번호',
    order_id INT NOT NULL COMMENT '주문 일련번호',
    product_id INT NOT NULL COMMENT '상품 일련번호',
    quantity INT NOT NULL DEFAULT 1 COMMENT '구매 수량',
    price INT NOT NULL COMMENT '구매 당시 단가',
    selected_size VARCHAR(100) NOT NULL COMMENT '선택한 사이즈',
    selected_color VARCHAR(100) NULL COMMENT '선택한 색상',
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
) COMMENT = '주문 상세 내역';

CREATE TABLE inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '문의 일련번호',
    user_id INT NOT NULL COMMENT '회원 일련번호',
    product_id INT NOT NULL COMMENT '상품 일련번호',
    title VARCHAR(255) NOT NULL COMMENT '문의 제목',
    content TEXT NOT NULL COMMENT '문의 내용',
    reply_content TEXT NULL COMMENT '관리자 답변 내용',
    inq_status VARCHAR(20) NOT NULL DEFAULT '답변대기' COMMENT '답변 상태 (답변대기/답변완료)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '등록 일시',
    replied_at DATETIME NULL COMMENT '답변 일시',
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) COMMENT = '상품 문의 Q&A';

CREATE TABLE product_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '리뷰 일련번호',
    user_id INT NOT NULL COMMENT '회원 일련번호',
    product_id INT NOT NULL COMMENT '상품 일련번호',
    order_item_id INT NOT NULL COMMENT '주문 상세 일련번호',
    rating DECIMAL(2, 1) NOT NULL COMMENT '별점 (0.0~5.0점)',
    content TEXT NOT NULL COMMENT '리뷰 내용',
    image_url JSON NULL COMMENT '리뷰 이미지 URL',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '리뷰 작성 일시',
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (order_item_id) REFERENCES order_items (id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_order_item_review (user_id, order_item_id)
) COMMENT = '상품 리뷰';

CREATE TABLE cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '장바구니 상세 일련번호',
    user_id INT NOT NULL COMMENT '회원 일련번호',
    product_id INT NOT NULL COMMENT '상품 일련번호',
    quantity INT NOT NULL DEFAULT 1 COMMENT '담은 수량',
    selected_size VARCHAR(100) NOT NULL COMMENT '선택한 사이즈',
    selected_color VARCHAR(100) NULL COMMENT '선택한 색상',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '담은 일시',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 일시',
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_product_size_color (user_id, product_id, selected_size, selected_color)
) COMMENT = '장바구니 상세 내역';

CREATE TABLE recommendation_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '추천 세션 일련번호',
    user_id INT NOT NULL COMMENT '회원 일련번호',
    chat_session_id INT NULL COMMENT '대화 세션 일련번호',
    weather_log_id INT NULL COMMENT '날씨 로그 일련번호',
    emotion_log_id INT NULL COMMENT '감정 로그 일련번호',
    tour_log_id INT NULL COMMENT '관광 로그 일련번호',
    input_query TEXT NULL COMMENT '추천 요청 입력 내용 (검색어 또는 프롬프트 입력값)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '추천 생성 일시',
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (chat_session_id) REFERENCES chat_sessions (id) ON DELETE SET NULL,
    FOREIGN KEY (weather_log_id) REFERENCES weather_logs (id) ON DELETE SET NULL,
    FOREIGN KEY (emotion_log_id) REFERENCES emotion_logs (id) ON DELETE SET NULL,
    FOREIGN KEY (tour_log_id) REFERENCES tour_logs (id) ON DELETE SET NULL
) COMMENT = '추천 세션 마스터';

CREATE TABLE recommendation_items (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '추천 아이템 일련번호',
    recommendation_session_id INT NOT NULL COMMENT '추천 세션 일련번호',
    product_id INT NOT NULL COMMENT '상품 일련번호',
    score FLOAT NULL COMMENT '추천 매칭 점수',
    recommendation_reason TEXT NULL COMMENT '추천 사유',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '추천 일시',
    FOREIGN KEY (recommendation_session_id) REFERENCES recommendation_sessions (id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    UNIQUE KEY uq_recommendation_session_product (recommendation_session_id, product_id)
) COMMENT = '추천 아이템 상세';

CREATE TABLE ai_call_logs (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'AI 호출 로그 일련번호',
    recommendation_session_id INT NULL COMMENT '추천 세션 일련번호',
    chat_session_id INT NULL COMMENT '대화 세션 일련번호',
    model_name VARCHAR(100) NOT NULL COMMENT '사용한 AI 모델명 (예: gpt-4o, claude-3-5-sonnet)',
    prompt_version VARCHAR(50) NOT NULL COMMENT '시스템 프롬프트 버전 코드 (예: v1.0.2)',
    prompt_tokens INT NULL COMMENT '입력(질문) 토큰 사용량',
    completion_tokens INT NULL COMMENT '출력(답변) 토큰 사용량',
    total_tokens INT NULL COMMENT '총 사용 토큰량',
    latency_ms INT NULL COMMENT 'API 응답 속도 (밀리초 단위)',
    log_status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS' COMMENT '호출 상태 (SUCCESS / FAILURE)',
    failure_reason TEXT NULL COMMENT 'API 에러 코드 및 호출 실패 상세 사유',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '호출 일시',
    FOREIGN KEY (recommendation_session_id) REFERENCES recommendation_sessions (id) ON DELETE SET NULL,
    FOREIGN KEY (chat_session_id) REFERENCES chat_sessions (id) ON DELETE SET NULL
) COMMENT = 'AI 호출 및 토큰 사용량 로그';

