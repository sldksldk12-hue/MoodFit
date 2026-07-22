import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { addCartItem } from "../services/api";
import { useAuth } from "../store/AuthContext";

/**
 * 상품을 장바구니에 저장할 때 반복되는 인증, 재고, 로딩 및 오류 처리를 담당합니다.
 */
const useAddToCart = () => {
  const navigate = useNavigate();
  const { user, isLogin, loading: authLoading } = useAuth();
  const [cartLoading, setCartLoading] = useState(false);

  const addProductToCart = async ({
    productId,
    inventory,
    quantity = 1,
    selectedSize = "기본",
    selectedColor = "기본",
    loginReturnPath,
  }) => {
    if (!productId) {
      alert("상품 정보가 올바르지 않습니다.");
      return false;
    }

    if (Number(inventory ?? 0) <= 0) {
      alert("품절된 상품입니다.");
      return false;
    }

    if (authLoading) {
      alert("로그인 정보를 확인하고 있습니다.");
      return false;
    }

    if (!isLogin || !user?.id) {
      alert("로그인이 필요한 기능입니다.");

      navigate("/moodfit/login", {
        state: {
          from: {
            pathname: loginReturnPath ?? window.location.pathname,
            search: window.location.search,
          },
        },
      });

      return false;
    }

    if (cartLoading) return false;

    try {
      setCartLoading(true);

      await addCartItem({
        user_id: Number(user.id),
        product_id: Number(productId),
        quantity: Number(quantity),
        selected_size: selectedSize,
        selected_color: selectedColor,
      });

      return true;
    } catch (error) {
      console.error("장바구니 저장 실패:", error);
      console.error("장바구니 서버 응답:", error.response?.data);

      alert(
        error.response?.data?.detail ??
          "장바구니에 상품을 담지 못했습니다."
      );

      return false;
    } finally {
      setCartLoading(false);
    }
  };

  return {
    cartLoading,
    addProductToCart,
  };
};

export default useAddToCart;
