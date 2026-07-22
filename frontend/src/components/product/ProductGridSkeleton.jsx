import "../../assets/styles/product/ProductGridSkeleton.css";

/** API 응답 대기 중 빈 화면 대신 카드 윤곽을 먼저 보여주는 컴포넌트입니다. */
const ProductGridSkeleton = ({ count = 8 }) => (
  <>
    {Array.from({ length: count }, (_, index) => (
      <article className="product-card-skeleton" key={index} aria-hidden="true">
        <div className="skeleton-block skeleton-image" />
        <div className="skeleton-block skeleton-line short" />
        <div className="skeleton-block skeleton-line" />
        <div className="skeleton-block skeleton-line medium" />
      </article>
    ))}
  </>
);
export default ProductGridSkeleton;
