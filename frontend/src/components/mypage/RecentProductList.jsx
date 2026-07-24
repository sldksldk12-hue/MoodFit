import MyPageEmptyState from "./MyPageEmptyState";
import "../../assets/styles/pages/mypage/MyPage.css"

const RecentProductList = ({
  products = [],
  onNavigate,
  limit,
}) => {
  if (!products.length) {
    return (
      <MyPageEmptyState
        title="최근 본 상품이 없습니다."
        description="관심 있는 상품을 둘러보세요."
      />
    );
  }

  // limit이 전달되면 해당 개수만 표시하고,
  // 전달되지 않으면 전체 상품을 표시합니다.
  const visibleProducts =
    typeof limit === "number"
      ? products.slice(0, limit)
      : products;

  return (
    <div className="recent-product-grid">
      {visibleProducts.map((product) => {
        const productId = product.product_id;
        const productName = product.product_name;
        const productImage = product.image_url;
        const productPrice = product.discount_price;

        return (
          <button
            type="button"
            className="recent-product-card"
            key={productId}
            onClick={() =>
              onNavigate(
                `/moodfit/detail/${productId}`
              )
            }
          >
            <div className="recent-product-image">
              {productImage ? (
                <img
                  src={productImage}
                  alt={productName}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.src =
                      "/images/product-placeholder.png";
                  }}
                />
              ) : (
                <div className="recent-product-image-placeholder">
                  이미지 없음
                </div>
              )}
            </div>

            <div className="recent-product-info">
              {product.brand && (
                <span className="recent-product-brand">
                  {product.brand}
                </span>
              )}

              <h3>{productName}</h3>

              <strong>
                {Number(
                  productPrice
                ).toLocaleString()}
                원
              </strong>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default RecentProductList;