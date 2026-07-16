/**
 * 파일: src/pages/CartPage.jsx
 * 분류: 라우팅 페이지
 *
 * 역할
 * - Redux 장바구니 상품의 수량 변경·삭제·총액 계산을 제공합니다.
 *
 * 사용 기술
 * - Redux useSelector/useDispatch, reduce, React Router
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  decreaseQuantity,
  increaseQuantity,
  removeFromCart,
} from "../store/slices/cartSlice";
import "../assets/styles/pages/cart/CartPage.css";

/**
 * CartPage 컴포넌트
 * 부모에게 받은 props와 전역 상태를 조합해 화면을 렌더링합니다.
 */
const CartPage = () => {
  // Redux Store에 상태 변경 명령(action)을 전달하기 위한 dispatch 함수입니다.
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // 여러 컴포넌트가 공유하는 Redux 상태에서 현재 화면에 필요한 값만 선택합니다.
  const cartItems = useSelector((state) => state.cart.items);

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = totalPrice >= 50000 || totalPrice === 0 ? 0 : 3000;
  const finalPrice = totalPrice + deliveryFee;

  // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
  return (
    <main className="cart-page">
      <section className="cart-container">
        <div className="cart-title">
          <ShoppingBag size={34} />
          <div>
            <h1>장바구니</h1>
            <p>담아둔 상품을 확인하고 주문해보세요.</p>
          </div>
        </div>

        <div className="cart-layout">
          <div className="cart-list">
            {cartItems.length === 0 ? (
              <div className="empty-cart">장바구니가 비어 있습니다.</div>
            ) : (
              cartItems.map((item) => (
                <div className="cart-item" key={item.cartKey}>
                  <div className="cart-img-box">
                    <img src={item.image} alt={item.name} />
                  </div>

                  <div className="cart-info">
                    <h3>{item.name}</h3>
                    <p>{item.option}</p>
                    <strong>{item.price.toLocaleString()}원</strong>
                  </div>

                  <div className="quantity-box">
                    <button type="button" onClick={() => dispatch(decreaseQuantity(item.cartKey))}>
                      <Minus size={16} />
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => dispatch(increaseQuantity(item.cartKey))}>
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="cart-item-total">
                    {(item.price * item.quantity).toLocaleString()}원
                  </div>

                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => dispatch(removeFromCart(item.cartKey))}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))
            )}
          </div>

          <aside className="cart-summary">
            <h2>결제 예정 금액</h2>
            <div className="summary-row"><span>상품 금액</span><strong>{totalPrice.toLocaleString()}원</strong></div>
            <div className="summary-row"><span>배송비</span><strong>{deliveryFee === 0 ? "무료" : `${deliveryFee.toLocaleString()}원`}</strong></div>
            <div className="summary-total"><span>총 결제금액</span><strong>{finalPrice.toLocaleString()}원</strong></div>
            <button className="order-btn" onClick={() => navigate("/moodfit/payment")} disabled={cartItems.length === 0}>
              주문하기
            </button>
          </aside>
        </div>
      </section>
    </main>
  );
};

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default CartPage;
