import { Heart, ShoppingCart, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import "../assets/styles/DetailPage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useState } from "react";
import ProductDescription from "../components/ProductDescription";
import ProductReview from "../components/ProductReview";
import ProductQna from "../components/ProductQna";
import ChatBot from "../components/ChatBot";

const product = {
    id: 1,
    name: "오버핏 블랙 후드티",
    category: "NEW",
    desc: "편안한 꾸안꾸 데일리룩",
    price: 39000,
    image: "/images/product01.jpg",
};

const DetailPage = () => {
    const [tab, setTab] = useState("desc");

    return (
        <>
            <main className="detail-page">
                <section className="detail-container">
                    <div className="detail-image-box">
                        <img src={product.image} alt={product.name} />
                    </div>

                    <div className="detail-info">
                        <span className="detail-category">{product.category}</span>

                        <h1>{product.name}</h1>

                        <p className="detail-desc">{product.desc}</p>

                        <div className="detail-price">
                            {product.price.toLocaleString()}원
                        </div>

                        <div className="detail-option">
                            <label>사이즈</label>
                            <div className="size-buttons">
                                <button>S</button>
                                <button>M</button>
                                <button>L</button>
                                <button>XL</button>
                            </div>
                        </div>

                        <div className="detail-option">
                            <label>수량</label>
                            <select>
                                <option>1개</option>
                                <option>2개</option>
                                <option>3개</option>
                                <option>4개</option>
                            </select>
                        </div>

                        <div className="detail-buttons">
                            <button className="cart-btn">
                                <ShoppingCart size={20} />
                                장바구니
                            </button>

                            <button className="buy-btn">바로 구매</button>

                            <button className="like-btn">
                                <Heart size={22} />
                            </button>
                        </div>

                        <div className="detail-benefits">
                            <div>
                                <Truck size={20} />
                                무료배송
                            </div>
                            <div>
                                <ShieldCheck size={20} />
                                안전결제
                            </div>
                            <div>
                                <RotateCcw size={20} />
                                7일 교환/반품
                            </div>
                        </div>
                    </div>
                </section>

                <section className="detail-additional">
                    <div className="detail-tabs">
                        <button
                            className={`detail-tab ${tab === "desc" ? "active" : ""}`}
                            onClick={() => setTab("desc")}
                        >
                            상품 설명
                        </button>

                        <button
                            className={`detail-tab ${tab === "review" ? "active" : ""}`}
                            onClick={() => setTab("review")}
                        >
                            상품 후기
                        </button>

                        <button
                            className={`detail-tab ${tab === "qna" ? "active" : ""}`}
                            onClick={() => setTab("qna")}
                        >
                            상품 Q&A
                        </button>
                    </div>
                    <div className="detail-tab-contents">
                        {tab === "desc" && <ProductDescription product={product}/>}
                        {tab === "review" && <ProductReview />}
                        {tab === "qna" && <ProductQna />}
                    </div>
                </section>
            </main>
        </>
    );
};

export default DetailPage;