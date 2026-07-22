import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { getCartItems } from "../services/api";

/**
 * 로그인 사용자의 장바구니 총 수량을 관리하는 훅입니다.
 *
 * - 로그인 상태가 바뀌면 다시 조회합니다.
 * - 페이지가 이동하면 다시 조회합니다.
 * - 다른 컴포넌트에서 cart-updated 이벤트를 발생시키면 다시 조회합니다.
 */
const useCartCount = ({ userId, isLogin, authLoading }) => {
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);

  const fetchCartCount = useCallback(async () => {
    if (authLoading) return;

    if (!isLogin || !userId) {
      setCartCount(0);
      return;
    }

    try {
      const items = await getCartItems(userId);

      if (!Array.isArray(items)) {
        console.error("장바구니 응답이 배열이 아닙니다:", items);
        setCartCount(0);
        return;
      }

      const totalQuantity = items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0),
        0,
      );

      setCartCount(totalQuantity);
    } catch (error) {
      console.error("헤더 장바구니 개수 조회 실패:", error);
      console.error("서버 응답:", error.response?.data);
      setCartCount(0);
    }
  }, [authLoading, isLogin, userId]);

  useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount, location.pathname, location.search]);

  useEffect(() => {
    const handleCartUpdated = () => {
      fetchCartCount();
    };

    window.addEventListener("cart-updated", handleCartUpdated);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
    };
  }, [fetchCartCount]);

  return {
    cartCount,
    resetCartCount: () => setCartCount(0),
    refreshCartCount: fetchCartCount,
  };
};

export default useCartCount;
