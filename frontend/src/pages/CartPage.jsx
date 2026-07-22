/**
 * 파일: src/pages/CartPage.jsx
 *
 * 역할
 * - 로그인 사용자의 장바구니를 DB에서 조회합니다.
 * - 장바구니 상품의 상세 정보를 추가로 불러옵니다.
 * - 상품 수량 변경과 삭제를 백엔드 DB에 반영합니다.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  deleteCartItem,
  getCartItems,
  getDetail,
  updateCartItemQuantity,
} from "../services/api";

import { useAuth } from "../store/AuthContext";

import "../assets/styles/pages/cart/CartPage.css";

const CartPage = () => {
  const navigate = useNavigate();

  /*
   * AuthContext에서 현재 로그인 사용자 정보를 가져옵니다.
   *
   * user:
   * - 로그인한 사용자 정보
   * - user.id로 현재 사용자 번호를 사용할 수 있습니다.
   *
   * isLogin:
   * - 로그인 상태이면 true
   *
   * authLoading:
   * - 앱이 처음 실행되었을 때 토큰을 확인하는 중인지 나타냅니다.
   */
  const {
    user,
    isLogin,
    loading: authLoading,
  } = useAuth();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // localStorage가 아니라 AuthContext의 사용자 ID를 사용합니다.
  const userId = user?.id;

  /*
   * 로그인 사용자 장바구니 조회
   */
  useEffect(() => {
    const fetchCartItems = async () => {
      /*
       * AuthContext가 토큰을 확인하는 중이면
       * 장바구니 API를 아직 호출하지 않습니다.
       */
      if (authLoading) {
        return;
      }

      /*
       * 로그인하지 않았거나 사용자 ID가 없으면
       * 장바구니를 조회하지 않습니다.
       */
      if (!isLogin || !userId) {
        setCartItems([]);
        setLoading(false);
        setError("로그인이 필요한 페이지입니다.");
        return;
      }

      try {
        setLoading(true);
        setError("");

        /*
         * 장바구니 DB 데이터를 가져옵니다.
         *
         * 반환 예시:
         * [
         *   {
         *     id: 1,
         *     user_id: 2,
         *     product_id: 10,
         *     quantity: 1,
         *     selected_size: "M",
         *     selected_color: "기본"
         *   }
         * ]
         */
        const cartResponse = await getCartItems(userId);

        /*
         * 장바구니에는 product_id만 들어 있으므로
         * 각 상품의 상세 API를 추가로 호출합니다.
         */
        const itemsWithProduct = await Promise.all(
          cartResponse.map(async (cartItem) => {
            const detailResponse = await getDetail(
              cartItem.product_id
            );

            const product = detailResponse.data;

            return {
              cartItemId: cartItem.id,
              productId: cartItem.product_id,

              quantity:
                Number(cartItem.quantity) || 1,

              selectedSize:
                cartItem.selected_size || "미선택",

              selectedColor:
                cartItem.selected_color || "미선택",

              name:
                product.name || "상품명 없음",

              image: Array.isArray(product.images)
                ? product.images[0]
                : product.images,

              price: Number(
                product.discount_price ??
                  product.original_price ??
                  0
              ),

              inventory: Number(
                product.inventory ?? 0
              ),
            };
          })
        );

        setCartItems(itemsWithProduct);
      } catch (err) {
        console.error("장바구니 조회 실패:", err);
        console.error(
          "장바구니 조회 서버 응답:",
          err.response?.data
        );

        setError(
          err.response?.data?.detail ||
            "장바구니 정보를 불러오지 못했습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCartItems();
  }, [authLoading, isLogin, userId]);

  /*
   * 상품 금액 합계
   */
  const totalPrice = useMemo(() => {
    return cartItems.reduce(
      (sum, item) =>
        sum + item.price * item.quantity,
      0
    );
  }, [cartItems]);

  /*
   * 5만 원 이상이면 무료 배송
   */
  const deliveryFee =
    totalPrice === 0 || totalPrice >= 50000
      ? 0
      : 3000;

  /*
   * 최종 결제 금액
   */
  const finalPrice =
    totalPrice + deliveryFee;

  /*
   * 장바구니 수량 변경
   */
  const changeQuantity = async (
    item,
    nextQuantity
  ) => {
    if (!userId) {
      alert("로그인이 필요한 기능입니다.");
      navigate("/moodfit/login");
      return;
    }

    // 최소 수량은 1개입니다.
    if (nextQuantity < 1) {
      return;
    }

    // 재고보다 많은 수량을 선택할 수 없습니다.
    if (
      item.inventory > 0 &&
      nextQuantity > item.inventory
    ) {
      alert(
        `최대 ${item.inventory}개까지 구매할 수 있습니다.`
      );
      return;
    }

    try {
      /*
       * DB 장바구니 수량 수정
       */
      await updateCartItemQuantity(
        item.cartItemId,
        userId,
        nextQuantity
      );

      /*
       * 백엔드 수정 성공 후
       * 프론트 화면의 수량도 변경합니다.
       */
      setCartItems((previousItems) =>
        previousItems.map((cartItem) =>
          cartItem.cartItemId ===
          item.cartItemId
            ? {
                ...cartItem,
                quantity: nextQuantity,
              }
            : cartItem
        )
      );
    } catch (err) {
      console.error("수량 변경 실패:", err);
      console.error(
        "수량 변경 서버 응답:",
        err.response?.data
      );

      alert(
        err.response?.data?.detail ||
          "수량을 변경하지 못했습니다."
      );
    }
  };

  /*
   * 장바구니 상품 삭제
   */
  const removeItem = async (item) => {
    if (!userId) {
      alert("로그인이 필요한 기능입니다.");
      navigate("/moodfit/login");
      return;
    }

    const shouldDelete = window.confirm(
      `${item.name} 상품을 장바구니에서 삭제할까요?`
    );

    if (!shouldDelete) {
      return;
    }

    try {
      /*
       * DB 장바구니 상품 삭제
       */
      await deleteCartItem(
        item.cartItemId,
        userId
      );

      /*
       * 백엔드 삭제 성공 후
       * 화면에서도 해당 상품을 제거합니다.
       */
      setCartItems((previousItems) =>
        previousItems.filter(
          (cartItem) =>
            cartItem.cartItemId !==
            item.cartItemId
        )
      );
    } catch (err) {
      console.error("장바구니 삭제 실패:", err);
      console.error(
        "장바구니 삭제 서버 응답:",
        err.response?.data
      );

      alert(
        err.response?.data?.detail ||
          "상품을 삭제하지 못했습니다."
      );
    }
  };

  /*
   * 인증 상태 확인 중
   */
  if (authLoading) {
    return (
      <main className="cart-page">
        <section className="cart-container">
          <div className="empty-cart">
            로그인 정보를 확인하는 중입니다.
          </div>
        </section>
      </main>
    );
  }

  /*
   * 로그인하지 않은 상태
   */
  if (!isLogin) {
    return (
      <main className="cart-page">
        <section className="cart-container">
          <div className="empty-cart">
            <p>로그인이 필요한 페이지입니다.</p>

            <button
              type="button"
              onClick={() =>
                navigate("/moodfit/login", {
                  state: {
                    from: {
                      pathname: "/moodfit/cart",
                    },
                  },
                })
              }
            >
              로그인하러 가기
            </button>
          </div>
        </section>
      </main>
    );
  }

  /*
   * 장바구니 조회 중
   */
  if (loading) {
    return (
      <main className="cart-page">
        <section className="cart-container">
          <div className="empty-cart">
            장바구니를 불러오는 중입니다.
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <section className="cart-container">
        <div className="cart-title">
          <ShoppingBag size={34} />

          <div>
            <h1>장바구니</h1>
            <p>
              담아둔 상품을 확인하고
              주문해보세요.
            </p>
          </div>
        </div>

        {error && (
          <div className="empty-cart">
            {error}
          </div>
        )}

        {!error && (
          <div className="cart-layout">
            <div className="cart-list">
              {cartItems.length === 0 ? (
                <div className="empty-cart">
                  장바구니가 비어 있습니다.
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    className="cart-item"
                    key={item.cartItemId}
                  >
                    <div className="cart-img-box">
                      <img
                        src={
                          item.image ||
                          "/images/product-placeholder.png"
                        }
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                        onError={(event) => {
                          event.currentTarget.src =
                            "/images/product-placeholder.png";
                        }}
                      />
                    </div>

                    <div className="cart-info">
                      <h3>{item.name}</h3>

                      <p>
                        색상:{" "}
                        {item.selectedColor}
                        {" / "}
                        사이즈:{" "}
                        {item.selectedSize}
                      </p>

                      <strong>
                        {item.price.toLocaleString()}
                        원
                      </strong>
                    </div>

                    <div className="quantity-box">
                      <button
                        type="button"
                        aria-label="수량 줄이기"
                        disabled={
                          item.quantity <= 1
                        }
                        onClick={() =>
                          changeQuantity(
                            item,
                            item.quantity - 1
                          )
                        }
                      >
                        <Minus size={16} />
                      </button>

                      <span>
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        aria-label="수량 늘리기"
                        disabled={
                          item.inventory > 0 &&
                          item.quantity >=
                            item.inventory
                        }
                        onClick={() =>
                          changeQuantity(
                            item,
                            item.quantity + 1
                          )
                        }
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="cart-item-total">
                      {(
                        item.price *
                        item.quantity
                      ).toLocaleString()}
                      원
                    </div>

                    <button
                      type="button"
                      className="delete-btn"
                      aria-label={`${item.name} 삭제`}
                      onClick={() =>
                        removeItem(item)
                      }
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <aside className="cart-summary">
              <h2>결제 예정 금액</h2>

              <div className="summary-row">
                <span>상품 금액</span>

                <strong>
                  {totalPrice.toLocaleString()}
                  원
                </strong>
              </div>

              <div className="summary-row">
                <span>배송비</span>

                <strong>
                  {deliveryFee === 0
                    ? "무료"
                    : `${deliveryFee.toLocaleString()}원`}
                </strong>
              </div>

              <div className="summary-total">
                <span>총 결제금액</span>

                <strong>
                  {finalPrice.toLocaleString()}
                  원
                </strong>
              </div>

              <button
                type="button"
                className="order-btn"
                disabled={
                  cartItems.length === 0
                }
                onClick={() =>
                  navigate(
                    "/moodfit/payment",
                    {
                      state: {
                        cartItems,
                        totalPrice,
                        deliveryFee,
                        finalPrice,
                      },
                    }
                  )
                }
              >
                주문하기
              </button>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
};

export default CartPage;