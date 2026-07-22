import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { getCartItems } from "../services/api";

const getTotalQuantity = (items) =>
  items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0,
  );

/**
 * 로그인 사용자의 장바구니 총 수량을 관리하는 훅입니다.
 */
const useCartCount = ({ userId, isLogin, authLoading }) => {
  const location = useLocation();
  const [fetchedCartCount, setFetchedCartCount] = useState(0);

  // 버튼이나 커스텀 이벤트에서 수동으로 다시 조회할 때 사용합니다.
  const fetchCartCount = useCallback(async () => {
    if (authLoading || !isLogin || !userId) return;

    try {
      const items = await getCartItems(userId);

      if (!Array.isArray(items)) {
        console.error("장바구니 응답이 배열이 아닙니다:", items);
        setFetchedCartCount(0);
        return;
      }

      setFetchedCartCount(getTotalQuantity(items));
    } catch (error) {
      console.error("헤더 장바구니 개수 조회 실패:", error);
      console.error("서버 응답:", error.response?.data);
      setFetchedCartCount(0);
    }
  }, [authLoading, isLogin, userId]);

  // 페이지가 바뀌면 서버의 장바구니 상태와 동기화합니다.
  useEffect(() => {
    if (authLoading || !isLogin || !userId) return undefined;

    let isCancelled = false;

    getCartItems(userId)
      .then((items) => {
        if (isCancelled) return;

        if (!Array.isArray(items)) {
          console.error("장바구니 응답이 배열이 아닙니다:", items);
          setFetchedCartCount(0);
          return;
        }

        setFetchedCartCount(getTotalQuantity(items));
      })
      .catch((error) => {
        console.error("헤더 장바구니 개수 조회 실패:", error);
        console.error("서버 응답:", error.response?.data);

        if (!isCancelled) {
          setFetchedCartCount(0);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [
    authLoading,
    isLogin,
    location.pathname,
    location.search,
    userId,
  ]);

  // 장바구니 추가/수정/삭제 이벤트를 구독합니다.
  useEffect(() => {
    if (authLoading || !isLogin || !userId) return undefined;

    const handleCartUpdated = () => {
      void fetchCartCount();
    };

    window.addEventListener("cart-updated", handleCartUpdated);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
    };
  }, [authLoading, fetchCartCount, isLogin, userId]);

  const cartCount =
    authLoading || !isLogin || !userId
      ? 0
      : fetchedCartCount;

  return {
    cartCount,
    resetCartCount: () => setFetchedCartCount(0),
    refreshCartCount: fetchCartCount,
  };
};

export default useCartCount;
