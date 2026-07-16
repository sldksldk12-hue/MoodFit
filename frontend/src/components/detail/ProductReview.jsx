/**
 * 파일: src/components/detail/ProductReview.jsx
 * 분류: 상품 상세 전용 컴포넌트
 *
 * 역할
 * - 상품 리뷰 목록과 리뷰 작성 UI의 전환을 관리합니다.
 *
 * 사용 기술
 * - useState, 조건부 렌더링
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import { Star, Camera, MessageSquare, ThumbsUp } from "lucide-react";
import "../../assets/styles/detail/ProductReview.css";
import ReviewWrite from "../review/ReviewWrite";
import { useState } from "react";
import Reviews from "../review/Reviews";

/**
 * ProductReview 컴포넌트
 * 부모에게 받은 props와 전역 상태를 조합해 화면을 렌더링합니다.
 */
const ProductReview = () => {
    const saveReview = (reviewData) => {
        console.log(reviewData);
    };
    // isWriteOpen: 이 컴포넌트 안에서만 필요한 화면 상태이므로 useState로 관리합니다.
    const [isWriteOpen, setIsWriteOpen] = useState(false);


    // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
    return (
        <main className="review-page">
            <section className="review-header">
                <div>
                    <h1>상품 리뷰</h1>
                    <p>구매자들의 생생한 후기를 확인해보세요.</p>
                </div>

                <button className="review-write-btn" onClick={() => setIsWriteOpen(true)}>

                    <MessageSquare size={20} />
                    리뷰 작성
                </button>
            </section>
            
            {isWriteOpen && (
                <ReviewWrite
                    onSubmit={(data) => {
                        console.log(data);

                        setIsWriteOpen(false);
                    }}
                />
            ) || <Reviews />}

        </main>
    );
};

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default ProductReview;