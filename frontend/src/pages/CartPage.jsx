import { useState } from "react";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import "../assets/styles/CartPage.css";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

const initialCartItems = [
  {
    id: 1,
    name: "오버핏 블랙 후드티",
    option: "블랙 / L",
    price: 39000,
    quantity: 1,
    image: "/images/product01.jpg",
  },
  {
    id: 2,
    name: "베이지 트렌치코트",
    option: "베이지 / M",
    price: 89000,
    quantity: 1,
    image: "/images/product02.jpg",
  },
];

const CartPage = () => {
  const [cartItems, setCartItems] = useState(initialCartItems);
  const navigate = useNavigate();

  const increaseQuantity = (id) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseQuantity = (id) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  const deleteItem = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const deliveryFee = totalPrice >= 50000 || totalPrice === 0 ? 0 : 3000;
  const finalPrice = totalPrice + deliveryFee;

  return (<>
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
              <div className="empty-cart">
                장바구니가 비어 있습니다.
              </div>
            ) : (
              cartItems.map(item => (
                <div className="cart-item" key={item.id}>
                  <div className="cart-img-box">
                    <img src={item.image} alt={item.name} />
                  </div>

                  <div className="cart-info">
                    <h3>{item.name}</h3>
                    <p>{item.option}</p>
                    <strong>{item.price.toLocaleString()}원</strong>
                  </div>

                  <div className="quantity-box">
                    <button onClick={() => decreaseQuantity(item.id)}>
                      <Minus size={16} />
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => increaseQuantity(item.id)}>
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="cart-item-total">
                    {(item.price * item.quantity).toLocaleString()}원
                  </div>

                  <button
                    className="delete-btn"
                    onClick={() => deleteItem(item.id)}
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
              <strong>{totalPrice.toLocaleString()}원</strong>
            </div>

            <div className="summary-row">
              <span>배송비</span>
              <strong>
                {deliveryFee === 0 ? "무료" : `${deliveryFee.toLocaleString()}원`}
              </strong>
            </div>

            <div className="summary-total">
              <span>총 결제금액</span>
              <strong>{finalPrice.toLocaleString()}원</strong>
            </div>

            <button className="order-btn" onClick={() => navigate("/moodfit/payment")}>
              주문하기
            </button>
          </aside>
        </div>
      </section>
    </main>
  </>

  );
};

export default CartPage;