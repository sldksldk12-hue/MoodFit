import { memo } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import useAddToCart from "../../hooks/useAddToCart";
import useProductLike from "../../hooks/useProductLike";
import { formatPrice } from "../../utils/formatPrice";

import "../../assets/styles/product/ProductCard.css";

const ProductCard = ({ product, onUnlike }) => {
  const navigate = useNavigate();

  const {
    liked,
    likeCount,
    likeLoading,
    toggleProductLike,
  } = useProductLike({
    productId: product.id,
    initialLikeCount: product.like_count,
  });

  const { cartLoading, addProductToCart } = useAddToCart();

  const handleLike = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const result = await toggleProductLike();
    if (result?.status === "removed") {
      onUnlike?.(product.id);
    } 
  };

  const handleCart = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const success = await addProductToCart({
      productId: product.id,
      inventory: product.inventory ?? 1,
      quantity: 1,
      selectedSize: "기본",
      selectedColor: "기본",
    });

    if (!success) return;

    const moveToCart = window.confirm(
      `${product.product_name} 상품을 장바구니에 담았습니다.\n장바구니로 이동할까요?`
    );

    if (moveToCart) {
      navigate("/moodfit/cart");
    }
  };

  const detailPath = `/moodfit/detail/${product.id}`;
  const linkStyle = {
    color: "inherit",
    textDecoration: "none",
  };

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <Link
          to={detailPath}
          className="product-card-image-link"
          style={linkStyle}
        >
          <img
            src={product.image_url || null}
            alt={product.product_name}
            className="product-image"
            loading="lazy"
            decoding="async"
          />
        </Link>

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
      </div>

      <div className="product-info">
        <Link
          to={detailPath}
          className="product-card-info-link"
          style={linkStyle}
        >
          <p className="product-category">{product.category}</p>
          <h3>{product.product_name}{product.category_id}</h3>
          <p className="product-desc">{product.desc}</p>
        </Link>

        <div className="product-bottom">
          <Link
            to={detailPath}
            className="product-card-price-link"
            style={linkStyle}
          >
            <strong>{formatPrice(product.price)}</strong>
          </Link>

          <span className={`like-count ${liked ? "active" : ""}`}>
            <Heart size={14} fill={liked ? "currentColor" : "none"} />
            {likeCount}
          </span>

          <button
            type="button"
            className="cart-mini"
            onClick={handleCart}
            disabled={cartLoading}
            aria-label={
              cartLoading
                ? "장바구니에 담는 중"
                : `${product.product_name} 장바구니에 담기`
            }
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </article>
  );
};

// 같은 props라면 카드 전체가 불필요하게 다시 렌더링되지 않습니다.
export default memo(ProductCard);
