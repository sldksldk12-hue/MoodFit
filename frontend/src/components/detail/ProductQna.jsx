/**
 * 파일: src/components/detail/ProductQna.jsx
 * 분류: 상품 상세 전용 컴포넌트
 *
 * 역할
 * - 상품 문의 탭의 UI를 담당합니다.
 *
 * 사용 기술
 * - React 함수형 컴포넌트
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
/**
 * ProductQna 컴포넌트
 * 부모에게 받은 props와 전역 상태를 조합해 화면을 렌더링합니다.
 */
const ProductQna = () => {
    // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
    return (
        <section className="detail-content active">
            <h3>상품 Q&A</h3>
            <div className="qna-item">
                <strong>Q. 세탁기 사용 가능한가요?</strong>
                <p>A. 찬물 단독 세탁을 권장합니다.</p>
            </div>
            <div className="qna-item">
                <strong>Q. 사이즈가 크게 나오나요?</strong>
                <p>A. 오버핏 제품이라 정사이즈보다 여유 있게 착용됩니다.</p>
            </div>
        </section>
    );
};

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default ProductQna;