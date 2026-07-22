import { useEffect, useState } from "react";

import { getUserLikes } from "../services/api";
import { useAuth } from "../store/AuthContext";

/**
 * 로그인 사용자의 좋아요 목록을 한 번만 받아 Set으로 제공합니다.
 * Set.has(productId)는 배열 some()보다 빠르고 ProductCard마다 API를 호출하지 않습니다.
 */
const useLikedProductIds = () => {
  const { user } = useAuth();
  const [likedProductIds, setLikedProductIds] = useState(() => new Set());
  const [likesLoading, setLikesLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadLikes = async () => {
      if (!user?.id) {
        setLikedProductIds(new Set());
        return;
      }

      try {
        setLikesLoading(true);
        const likes = await getUserLikes(user.id);

        if (!cancelled) {
          setLikedProductIds(
            new Set(
              (Array.isArray(likes) ? likes : []).map((like) =>
                Number(like.product_id)
              )
            )
          );
        }
      } catch (error) {
        console.error("좋아요 목록 조회 실패:", error);
        if (!cancelled) setLikedProductIds(new Set());
      } finally {
        if (!cancelled) setLikesLoading(false);
      }
    };

    loadLikes();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { likedProductIds, likesLoading };
};

export default useLikedProductIds;
