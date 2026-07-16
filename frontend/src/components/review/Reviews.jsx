/**
 * 파일: src/components/review/Reviews.jsx
 * 분류: 리뷰 기능 컴포넌트
 *
 * 역할
 * - 리뷰 데이터 목록을 반복 렌더링합니다.
 *
 * 사용 기술
 * - Array.map, 조건부 렌더링
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import { Camera, Star, ThumbsUp } from 'lucide-react';
import React from 'react';

/**
 * Reviews 컴포넌트
 * 부모에게 받은 props와 전역 상태를 조합해 화면을 렌더링합니다.
 */
const Reviews = () => {
        const reviews = [
        {
            id: 1,
            user: "사용자1",
            product: "오버핏 블랙 후드티",
            rating: 5,
            content: "핏이 넉넉하고 편해서 데일리로 입기 좋아요.",
            date: "2026.07.12",
        },
        {
            id: 2,
            user: "사용자2",
            product: "와이드 데님 팬츠",
            rating: 4,
            content: "기장이 적당하고 후드티랑 잘 어울립니다.",
            date: "2026.07.10",
        },
    ];
    // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
    return (
        <div>
            
            <section className="review-summary">
                <div className="review-score">
                    <strong>4.8</strong>
                    <div>
                        {[1, 2, 3, 4, 5].map(num => (
                            <Star key={num} size={22} fill="#facc15" color="#facc15" />
                        ))}
                    </div>
                    <p>총 128개의 리뷰</p>
                </div>

                <div className="review-stats">
                    <div><span>5점</span><progress value="85" max="100" /></div>
                    <div><span>4점</span><progress value="10" max="100" /></div>
                    <div><span>3점</span><progress value="3" max="100" /></div>
                    <div><span>2점</span><progress value="1" max="100" /></div>
                    <div><span>1점</span><progress value="1" max="100" /></div>
                </div>
            </section>

            <section className="review-list">
                {reviews.map(review => (
                    <article className="review-card" key={review.id}>
                        <div className="review-top">
                            <div>
                                <h3>{review.product}</h3>
                                <p>{review.user} · {review.date}</p>
                            </div>

                            <div className="review-stars">
                                {[1, 2, 3, 4, 5].map(num => (
                                    <Star
                                        key={num}
                                        size={18}
                                        fill={num <= review.rating ? "#facc15" : "none"}
                                        color="#facc15"
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="review-image-box">
                            <Camera size={34} />
                            <span>리뷰 이미지</span>
                        </div>

                        <p className="review-content">{review.content}</p>

                        <button className="review-like-btn">
                            <ThumbsUp size={17} />
                            도움돼요
                        </button>
                    </article>
                ))}
            </section>
        </div>
    );
};

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default Reviews;