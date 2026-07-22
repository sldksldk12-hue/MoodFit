import "../../../assets/styles/product/ProductListPage.css";

/**
 * 실제 데이터가 도착하기 전 카드 형태를 먼저 보여줘 빈 화면 체감을 줄입니다.
 */
const ProductGridSkeleton = ({ count = 8 }) => (
  <section className="product-grid" aria-label="상품 불러오는 중">
    {Array.from({ length: count }, (_, index) => (
      <article className="product-card product-skeleton" key={index}>
        <div className="skeleton-block skeleton-image" />
        <div className="skeleton-content">
          <div className="skeleton-block skeleton-category" />
          <div className="skeleton-block skeleton-title" />
          <div className="skeleton-block skeleton-description" />
          <div className="skeleton-block skeleton-price" />
        </div>
      </article>
    ))}
  </section>
);

export default ProductGridSkeleton;
