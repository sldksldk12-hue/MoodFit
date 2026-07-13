import { CreditCard, MapPin, ShoppingBag, Truck } from "lucide-react";
import "../assets/styles/PaymentPage.css";
import { useState } from "react";

const PaymentPage = () => {
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
                                    <img src={item.image} alt={item.name} />

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

export default PaymentPage;