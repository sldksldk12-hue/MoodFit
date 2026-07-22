import { memo, useEffect, useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import {
  addCartItem,
  toggleLike,
} from "../../services/api";
import { useAuth } from "../../store/AuthContext";

import "../../assets/styles/product/ProductCard.css";

const ProductCard = ({ product, initialLiked = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // 현재 사용자가 이 상품을 찜했는지 여부
  const [liked, setLiked] = useState(Boolean(initialLiked));

  // 카드에 표시할 좋아요 개수
  const [likeCount, setLikeCount] = useState(
    Number(product.like_count ?? 0)
  );

  // 좋아요 처리 중 중복 클릭 방지
  const [likeLoading, setLikeLoading] = useState(false);

  // 장바구니 추가 요청 중 중복 클릭 방지
  const [cartLoading, setCartLoading] = useState(false);

  // 상품이 바뀌면 서버에서 받은 좋아요 개수로 다시 맞춤
  useEffect(() => {
    setLikeCount(Number(product.like_count ?? 0));
  }, [product.id, product.like_count]);


  // 같은 상품이 여러 영역에 표시될 때 찜 상태와 개수를 즉시 동기화
  useEffect(() => {
    const handleProductLikeChanged = (event) => {
      const { productId, liked: nextLiked, likeCount: nextLikeCount } =
        event.detail ?? {};

      if (Number(productId) !== Number(product.id)) {
        return;
      }

      setLiked(Boolean(nextLiked));
      setLikeCount(Number(nextLikeCount ?? 0));
    };

    window.addEventListener(
      "product-like-changed",
      handleProductLikeChanged
    );

    return () => {
      window.removeEventListener(
        "product-like-changed",
        handleProductLikeChanged
      );
    };
  }, [product.id]);

  // 부모 페이지가 한 번만 조회한 좋아요 상태를 카드에 반영합니다.
  useEffect(() => {
    setLiked(Boolean(initialLiked));
  }, [initialLiked]);

  const handleLike = async (event) => {
    // Link의 상세페이지 이동을 막고 좋아요만 처리
    event.preventDefault();
    event.stopPropagation();

    if (!user?.id) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (likeLoading) {
      return;
    }

    try {
      setLikeLoading(true);

      const result = await toggleLike(user.id, product.id);

      const nextLiked = result.status === "added";
      const nextLikeCount = nextLiked
        ? likeCount + 1
        : Math.max(0, likeCount - 1);

      setLiked(nextLiked);
      setLikeCount(nextLikeCount);

      // 현재 카드뿐 아니라 같은 상품을 표시하는 다른 ProductCard도 즉시 갱신
      window.dispatchEvent(
        new CustomEvent("product-like-changed", {
          detail: {
            productId: product.id,
            liked: nextLiked,
            likeCount: nextLikeCount,
          },
        })
      );
    } catch (error) {
      console.error("찜하기 처리 실패:", error);

      const message =
        error.response?.data?.detail ??
        "찜하기 처리 중 오류가 발생했습니다.";

      alert(message);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleCart = async (event) => {
    // 장바구니 버튼 클릭 시 상세페이지로 이동하지 않도록 방지
    event.preventDefault();
    event.stopPropagation();

    // 로그인하지 않은 사용자는 로그인 페이지로 이동
    if (!user?.id) {
      alert("로그인이 필요한 기능입니다.");

      navigate("/moodfit/login", {
        state: {
          from: {
            pathname: window.location.pathname,
            search: window.location.search,
          },
        },
      });

      return;
    }

    // 재고가 0인 상품은 장바구니에 담지 않음
    if (Number(product.inventory ?? 1) <= 0) {
      alert("품절된 상품입니다.");
      return;
    }

    // 요청 중 버튼을 다시 누르는 것을 방지
    if (cartLoading) {
      return;
    }

    try {
      setCartLoading(true);

      /*
       * ProductCard에는 색상과 사이즈 선택 UI가 없으므로
       * 기본 옵션과 수량 1개로 장바구니에 추가합니다.
       *
       * 상세한 옵션 선택이 필요한 상품은 상세페이지에서
       * 색상과 사이즈를 고른 뒤 장바구니에 넣도록 구성하는 것이 좋습니다.
       */
      await addCartItem({
        user_id: user.id,
        product_id: product.id,
        quantity: 1,
        selected_size: "기본",
        selected_color: "기본",
      });

      // Header 등에서 장바구니 개수를 다시 조회할 수 있도록 알림
      window.dispatchEvent(
        new CustomEvent("cart-updated", {
          detail: {
            userId: user.id,
            productId: product.id,
          },
        })
      );

      const moveToCart = window.confirm(
        `${product.product_name} 상품을 장바구니에 담았습니다.\n장바구니로 이동할까요?`
      );

      if (moveToCart) {
        navigate("/moodfit/cart");
      }
    } catch (error) {
      console.error("장바구니 추가 실패:", error);
      console.error(
        "장바구니 추가 서버 응답:",
        error.response?.data
      );

      alert(
        error.response?.data?.detail ??
          "장바구니에 상품을 담지 못했습니다."
      );
    } finally {
      setCartLoading(false);
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
        {/* 상품 이미지를 누르면 상세페이지로 이동 */}
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

        {/* 하트 버튼은 Link 밖에 두어 버튼 중첩을 방지 */}
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
        {/* 상품 설명 영역을 누르면 상세페이지로 이동 */}
        <Link
          to={detailPath}
          className="product-card-info-link"
          style={linkStyle}
        >
          <p className="product-category">{product.category}</p>
          <h3>{product.product_name}</h3>
          <p className="product-desc">{product.desc}</p>
        </Link>

        <div className="product-bottom">
          {/* 가격을 눌러도 상세페이지로 이동 */}
          <Link
            to={detailPath}
            className="product-card-price-link"
            style={linkStyle}
          >
            <strong>
              {Number(product.price ?? 0).toLocaleString()}원
            </strong>
          </Link>

          <span className={`like-count ${liked ? "active" : ""}`}>
            <Heart
              size={14}
              fill={liked ? "currentColor" : "none"}
            />
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

// 상품 객체와 initialLiked가 같으면 불필요한 카드 재렌더링을 건너뜁니다.
export default memo(ProductCard);