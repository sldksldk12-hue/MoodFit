/**
 * 파일: src/components/detail/ProductDescription.jsx
 * 분류: 상품 상세 전용 컴포넌트
 *
 * 역할
 * - 상품 상세 페이지의 설명 탭 내용을 분리해 표시합니다.
 *
 * 사용 기술
 * - props 기반 프레젠테이션 컴포넌트
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import "../../assets/styles/detail/ProductDescription.css";

/**
 * ProductDescription 컴포넌트
 * 부모에게 받은 props와 전역 상태를 조합해 화면을 렌더링합니다.
 */
const ProductDescription = ({ product }) => {
  // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
  return (
    <section className="product-description">


      {/* 대표 설명 */}
      <div className="description-header">
        <h2>{product.product_name}</h2>

        <p className="description-text">
          {product.product_description}
        </p>
      </div>

      {/* 상품 이미지 */}
      <div className="description-images">

        {product.detail_images?.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={product.product_name}
           loading="lazy" decoding="async" />
        ))}

      </div>

      {/* 상품 정보 */}
      <div className="product-info-table">

        <table>

          <tbody>

            <tr>
              <th>브랜드</th>
              <td>{product.brand}</td>
            </tr>

            <tr>
              <th>카테고리</th>
              <td>{product.category}</td>
            </tr>

            <tr>
              <th>소재</th>
              <td>{product.material}</td>
            </tr>

            <tr>
              <th>핏</th>
              <td>{product.fit}</td>
            </tr>

            <tr>
              <th>계절</th>
              <td>{product.season}</td>
            </tr>

            <tr>
              <th>제조국</th>
              <td>{product.country}</td>
            </tr>

          </tbody>

        </table>

      </div>

    </section>
  );
};

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default ProductDescription;