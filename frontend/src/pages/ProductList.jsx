import { Heart, ShoppingCart } from "lucide-react";
import "../assets/styles/ProductListPage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {  useSearchParams } from "react-router-dom";
import ChatBot from "../components/ChatBot";

const products = [
    {
        id: 1,
        name: "오버핏 블랙 후드티",
        category: "상의",
        price: 39000,
        image: "/images/product01.jpg",
    },
    {
        id: 2,
        name: "와이드 데님 팬츠",
        category: "하의",
        price: 49000,
        image: "/images/product02.jpg",
    },
    {
        id: 3,
        name: "라이트 바람막이 자켓",
        category: "아우터",
        price: 69000,
        image: "/images/product03.jpg",
    },
    {
        id: 4,
        name: "캐주얼 샌들",
        category: "신발",
        price: 29000,
        image: "/images/product04.jpg",
    },
];

const ProductList = () => {
    const [searchParams] = useSearchParams();

    const category = searchParams.get("category");
    const filteredProducts = products.filter(product =>
    product.name.includes(category) || product.category === category
);

    console.log(category);   // 상의
    return (
        <>
            <main className="product-list-page">
                <section className="product-list-header">
                    <div>
                        <span className="product-list-label">MOOD FIT</span>
                        <h1>{category} 리스트</h1>
                        <p>AI가 선택한 코디 상품들을 확인해보세요.</p>
                    </div>

                    <select className="product-sort">
                        <option>추천순</option>
                        <option>낮은 가격순</option>
                        <option>높은 가격순</option>
                        <option>신상품순</option>
                    </select>
                </section>

                <section className="product-filter">
                    <button className="active">전체</button>
                    <button className="active">신상품</button>
                    <button className="active">할인중</button>
                </section>

                <section className="product-grid">
                    {filteredProducts.map((product) => (
                        <article className="product-card" key={product.id}>
                            <div className="product-image-box">
                                <img src={product.image} alt={product.name} />

                                <button className="product-like-btn">
                                    <Heart size={20} />
                                </button>
                            </div>

                            <div className="product-info">
                                <span className="product-category">
                                    {product.category}
                                </span>

                                <h3>{product.name}</h3>


                                <div className="product-bottom">
                                    <strong>
                                        {product.price.toLocaleString()}원
                                    </strong>

                                    <button className="product-cart-btn">
                                        <ShoppingCart size={18} />
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </section>
            </main>
        </>
    );
};

export default ProductList
    ;