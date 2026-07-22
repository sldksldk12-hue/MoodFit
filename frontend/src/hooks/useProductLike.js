import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getUserLikes, toggleLike } from "../services/api";
import { useAuth } from "../store/AuthContext";

/**
 * 상품 좋아요 상태와 토글 로직을 공통으로 관리합니다.
 * ProductCard와 DetailPage처럼 같은 상품을 표시하는 화면끼리는
 * product-like-changed 이벤트를 통해 즉시 상태를 동기화합니다.
 */
const useProductLike = ({ productId, initialLikeCount = 0 }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [liked, setLiked] = useState(false);
  const [likeState, setLikeState] = useState({
    productId,
    count: Number(initialLikeCount ?? 0),
  });
  const [likeLoading, setLikeLoading] = useState(false);

  const likeCount =
    Number(likeState.productId) === Number(productId)
      ? likeState.count
      : Number(initialLikeCount ?? 0);

  const setCurrentLikeCount = useCallback((nextCount) => {
    setLikeState({
      productId,
      count: Number(nextCount ?? 0),
    });
  }, [productId]);

  useEffect(() => {
    const handleLikeChanged = (event) => {
      const detail = event.detail ?? {};

      if (Number(detail.productId) !== Number(productId)) return;

      setLiked(Boolean(detail.liked));
      setCurrentLikeCount(detail.likeCount);
    };

    window.addEventListener("product-like-changed", handleLikeChanged);

    return () => {
      window.removeEventListener("product-like-changed", handleLikeChanged);
    };
  }, [productId, setCurrentLikeCount]);

  useEffect(() => {
    const fetchLikedState = async () => {
      if (!user?.id || !productId) {
        setLiked(false);
        return;
      }

      try {
        const likes = await getUserLikes(user.id);
        const isLiked = likes.some(
          (item) => Number(item.product_id) === Number(productId)
        );

        setLiked(isLiked);
      } catch (error) {
        console.error("찜 상태 조회 실패:", error);
        setLiked(false);
      }
    };

    fetchLikedState();
  }, [user?.id, productId]);

  const toggleProductLike = async ({ redirectToLogin = false } = {}) => {
    if (!user?.id) {
      alert("로그인이 필요합니다.");

      if (redirectToLogin) {
        navigate("/moodfit/login", {
          state: {
            from: {
              pathname: window.location.pathname,
              search: window.location.search,
            },
          },
        });
      }

      return false;
    }

    if (!productId || likeLoading) return false;

    try {
      setLikeLoading(true);

      const result = await toggleLike(user.id, productId);
      const nextLiked = result.status === "added";
      const nextLikeCount = nextLiked
        ? likeCount + 1
        : Math.max(0, likeCount - 1);

      setLiked(nextLiked);
      setCurrentLikeCount(nextLikeCount);

      window.dispatchEvent(
        new CustomEvent("product-like-changed", {
          detail: {
            productId,
            liked: nextLiked,
            likeCount: nextLikeCount,
          },
        })
      );

      return true;
    } catch (error) {
      console.error("찜하기 처리 실패:", error);
      alert(
        error.response?.data?.detail ??
          "찜하기 처리 중 오류가 발생했습니다."
      );
      return false;
    } finally {
      setLikeLoading(false);
    }
  };

  return {
    liked,
    likeCount,
    likeLoading,
    toggleProductLike,
  };
};

export default useProductLike;
