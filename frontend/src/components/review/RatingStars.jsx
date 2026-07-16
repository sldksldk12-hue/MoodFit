/**
 * 파일: src/components/review/RatingStars.jsx
 * 분류: 리뷰 기능 컴포넌트
 *
 * 역할
 * - 사용자가 별점을 선택하거나 기존 별점을 표시할 수 있는 재사용 컴포넌트입니다.
 *
 * 사용 기술
 * - 배열 렌더링, 이벤트 처리, 접근성 속성
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import { Star } from "lucide-react";

/**
 * RatingStars 컴포넌트
 * 부모에게 받은 props와 전역 상태를 조합해 화면을 렌더링합니다.
 */
const RatingStars = ({ rating, setRating }) => {
    // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
    return (
        <div className="rating-box">
            {[1, 2, 3, 4, 5].map(num => (
                <Star
                    key={num}
                    size={32}
                    className={num <= rating ? "star active" : "star"}
                    onClick={() => setRating(num)}
                />
            ))}
        </div>
    );
};

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default RatingStars;