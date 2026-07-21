import { useEffect, useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";

import { getUserLikes, toggleLike } from "../../services/api";
import { useAuth } from "../../store/AuthContext";

import "../../assets/styles/product/ProductCard.css";

const ProductCard = ({ product }) => {
  const { user } = useAuth();

  // 현재 사용자가 이 상품을 찜했는지 여부
  const [liked, setLiked] = useState(false);

  // 카드에 표시할 좋아요 개수
  const [likeCount, setLikeCount] = useState(
    Number(product.like_count ?? 0)
  );

  // 좋아요 처리 중 중복 클릭 방지
  const [likeLoading, setLikeLoading] = useState(false);

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

  useEffect(() => {
    const checkLikedProduct = async () => {
      // 로그인하지 않은 경우 찜 상태를 false로 초기화
      if (!user?.id) {
        setLiked(false);
        return;
      }

      try {
        // 기존 백엔드 API에서 사용자의 전체 찜 목록을 받아옴
        const likes = await getUserLikes(user.id);

        // 응답 배열에서 현재 상품의 product_id가 존재하는지 확인
        const isLiked = likes.some(
          (like) => Number(like.product_id) === Number(product.id)
        );

        setLiked(isLiked);
      } catch (error) {
        console.error("찜 상태 조회 실패:", error);
        setLiked(false);
      }
    };

    checkLikedProduct();
  }, [user?.id, product.id]);

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

  const handleCart = (event) => {
    // 장바구니 버튼 클릭 시 상세페이지로 이동하지 않도록 방지
    event.preventDefault();
    event.stopPropagation();

    // TODO: 장바구니 추가 기능 연결
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
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;