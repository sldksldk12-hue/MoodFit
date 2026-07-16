/**
 * 파일: src/components/review/ReviewWrite.jsx
 * 분류: 리뷰 기능 컴포넌트
 *
 * 역할
 * - 별점·본문·이미지를 조합해 리뷰 작성 폼을 구성합니다.
 *
 * 사용 기술
 * - 폼 상태 관리, 하위 컴포넌트 조합
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import { useState } from "react";
import RatingStars from "../review/RatingStars";
import ReviewTextarea from "../review/ReviewTextarea";
import ReviewImageUpload from "../review/ReviewImageUpload";
import "../../assets/styles/review/ReviewWrite.css";

/**
 * ReviewWrite 컴포넌트
 * 부모에게 받은 props와 전역 상태를 조합해 화면을 렌더링합니다.
 */
const ReviewWrite = ({ onSubmit }) => {
    // rating: 이 컴포넌트 안에서만 필요한 화면 상태이므로 useState로 관리합니다.
    const [rating, setRating] = useState(5);
    // content: 이 컴포넌트 안에서만 필요한 화면 상태이므로 useState로 관리합니다.
    const [content, setContent] = useState("");
    // image: 이 컴포넌트 안에서만 필요한 화면 상태이므로 useState로 관리합니다.
    const [image, setImage] = useState(null);

    // submitReview: 사용자 이벤트 또는 데이터 처리 과정을 한 함수로 분리해 JSX를 단순하게 유지합니다.
    const submitReview = (e) => {
        e.preventDefault();

        if (content.trim() === "") {
            alert("리뷰를 작성해주세요.");
            return;
        }

        const reviewData = {
            rating,
            content,
            image,
        };

        onSubmit?.(reviewData);

        alert("리뷰가 등록되었습니다.");
    };

    // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
    return (
        <form className="review-write" onSubmit={submitReview}>
            <h2>리뷰 작성</h2>

            <RatingStars
                rating={rating}
                setRating={setRating}
            />

            <ReviewTextarea
                content={content}
                setContent={setContent}
            />

            <ReviewImageUpload
                image={image}
                setImage={setImage}
            />

            <button type="submit" className="review-submit-btn">
                리뷰 등록
            </button>
        </form>
    );
};

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default ReviewWrite;