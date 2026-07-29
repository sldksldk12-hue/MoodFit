import { memo } from "react";
import { Heart, ShoppingBag, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import useAddToCart from "../../hooks/useAddToCart";
import useProductLike from "../../hooks/useProductLike";
import { formatPrice } from "../../utils/formatPrice";

import "../../assets/styles/product/ProductCard.css";

const ProductCard = ({ product, onUnlike }) => {
  const navigate = useNavigate();

  const { liked, likeCount, likeLoading, toggleProductLike } = useProductLike({
    productId: product.id,
    initialLikeCount: product.like_count,
  });

  const { cartLoading, addProductToCart } = useAddToCart();

  const handleLike = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const result = await toggleProductLike();
    if (result?.status === "removed") onUnlike?.(product.id);
  };

  const detailPath = `/moodfit/detail/${product.id}`;

  const handleCart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    navigate(detailPath);
  };
  const originalPrice = Number(product.original_price || product.price || 0);
  const salePrice = Number(
    product.discount_price !== undefined && product.discount_price !== null
      ? product.discount_price
      : product.price || product.original_price || 0
  );
  const discountRate = originalPrice > salePrice && originalPrice > 0
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
    : 0;
  const brand = product.brand;

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <Link to={detailPath} className="product-card-image-link">
          <img
            src={product.image_url || "/images/product-placeholder.png"}
            alt={product.product_name}
            className="product-image"
            loading="lazy"
            decoding="async"
            onError={(event) => {
              event.currentTarget.src = "/images/product-placeholder.png";
            }}
          />
        </Link>

        <div className="product-card-badges">
          {discountRate > 0 && <span className="product-sale-badge">-{discountRate}%</span>}
          {product.ai_recommended && (
            <span className="product-ai-badge"><Sparkles size={12} /> AI PICK</span>
          )}
        </div>

        <button
          type="button"
          className={`heart-button ${liked ? "active" : ""}`}
          aria-label={liked ? "찜 취소" : "찜하기"}
          aria-pressed={liked}
          onClick={handleLike}
          disabled={likeLoading}
        >
          <Heart size={18} fill={liked ? "currentColor" : "none"} />
        </button>

        <button
          type="button"
          className="product-quick-cart"
          onClick={handleCart}
          disabled={cartLoading}
        >
          <ShoppingBag size={17} />
          {cartLoading ? "담는 중" : "장바구니"}
        </button>
      </div>

      <div className="product-info">
        <Link to={detailPath} className="product-card-info-link">
          <p className="product-category">{brand}</p>
          <h3>{product.product_name}</h3>
          {product.desc && <p className="product-desc">{product.desc}</p>}
        </Link>

        <div className="product-price-row">
          <div className="product-price-group">
            {discountRate > 0 && <span className="product-original-price">{formatPrice(originalPrice)}</span>}
            <strong>{formatPrice(salePrice)}</strong>
          </div>
          <span className={`like-count ${liked ? "active" : ""}`}>
            <Heart size={13} fill={liked ? "currentColor" : "none"} />
            {likeCount}
          </span>
        </div>
      </div>
    </article>
  );
};

export default memo(ProductCard);
