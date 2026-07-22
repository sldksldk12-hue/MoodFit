/**
 * 파일: src/pages/PaymentPage.jsx
 * 분류: 라우팅 페이지
 *
 * 역할
 * - 주문 상품과 결제수단을 관리하고 결제 요약을 표시합니다.
 *
 * 사용 기술
 * - useState, Redux 장바구니, reduce
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import { CreditCard, MapPin, ShoppingBag, Truck } from "lucide-react";
import "../assets/styles/pages/payment/PaymentPage.css";
import { useState } from "react";

/**
 * PaymentPage 컴포넌트
 * 부모에게 받은 props와 전역 상태를 조합해 화면을 렌더링합니다.
 */
const PaymentPage = () => {
    // paymentMethod: 이 컴포넌트 안에서만 필요한 화면 상태이므로 useState로 관리합니다.
    const [paymentMethod, setPaymentMethod] = useState("card");
    const orderItems = [
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
            name: "와이드 데님 팬츠",
            option: "데님 / M",
            price: 49000,
            quantity: 1,
            image: "/images/product03.jpg",
        },
    ];

    const productTotal = orderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    const deliveryFee = productTotal >= 50000 ? 0 : 3000;
    const finalPrice = productTotal + deliveryFee;

    // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
    return (
        <main className="payment-page">
            <section className="payment-container">
                <h1>주문 / 결제</h1>

                <div className="payment-layout">
                    <div className="payment-left">
                        <section className="payment-box">
                            <h2>
                                <ShoppingBag size={22} />
                                주문 상품
                            </h2>

                            {orderItems.map(item => (
                                <div className="payment-item" key={item.id}>
                                    <img src={item.image} alt={item.name}  loading="lazy" decoding="async" />

                                    <div>
                                        <h3>{item.name}</h3>
                                        <p>{item.option}</p>
                                        <span>
                                            {item.quantity}개 / {item.price.toLocaleString()}원
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </section>

                        <section className="payment-box">
                            <h2>
                                <MapPin size={22} />
                                배송지 정보
                            </h2>

                            <div className="payment-form">
                                <input placeholder="받는 사람" />
                                <input placeholder="연락처" />
                                <input placeholder="우편번호" />
                                <input placeholder="주소" />
                                <input placeholder="상세 주소" />
                                <textarea placeholder="배송 요청사항" />
                            </div>
                        </section>

                        <section className="payment-box">
                            <h2>
                                <CreditCard size={22} />
                                결제 수단
                            </h2>

                            <div className="payment-methods">
                                <button type="button" className={paymentMethod === "card" ? "selected" : ""} onClick={() => setPaymentMethod("card")}>
                                    신용/체크카드
                                </button>
                                <button type="button" className={paymentMethod === "kakao" ? "selected" : ""} onClick={() => setPaymentMethod("kakao")}>
                                    카카오페이
                                </button>
                                <button type="button" className={paymentMethod === "toss" ? "selected" : ""} onClick={() => setPaymentMethod("toss")}>
                                    토스페이
                                </button>
                                <button type="button" className={paymentMethod === "bank" ? "selected" : ""} onClick={() => setPaymentMethod("bank")}>
                                    무통장입금
                                </button>
                            </div>
                        </section>
                    </div>

                    <aside className="payment-summary">
                        <h2>결제 금액</h2>

                        <div className="summary-row">
                            <span>상품 금액</span>
                            <strong>{productTotal.toLocaleString()}원</strong>
                        </div>

                        <div className="summary-row">
                            <span>배송비</span>
                            <strong>
                                {deliveryFee === 0
                                    ? "무료"
                                    : `${deliveryFee.toLocaleString()}원`}
                            </strong>
                        </div>

                        <div className="summary-delivery">
                            <Truck size={18} />
                            50,000원 이상 구매 시 무료배송
                        </div>

                        <div className="summary-total">
                            <span>총 결제금액</span>
                            <strong>{finalPrice.toLocaleString()}원</strong>
                        </div>

                        <button type="button" className="payment-submit">
                            결제하기
                        </button>
                    </aside>
                </div>
            </section>
        </main>
    );
};

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default PaymentPage;