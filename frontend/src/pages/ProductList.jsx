/**
 * 파일: src/pages/ProductList.jsx
 * 분류: 라우팅 페이지
 *
 * 역할
 * - 백엔드 상품 목록을 조회하고 카테고리·정렬 조건에 맞춰 출력합니다.
 *
 * 사용 기술
 * - Axios API, useEffect/useMemo, URLSearchParams
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import { Heart, ShoppingCart } from "lucide-react";
import "../assets/styles/product/ProductListPage.css";
import {  useSearchParams } from "react-router-dom";

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

/**
 * ProductList 컴포넌트
 * 부모에게 받은 props와 전역 상태를 조합해 화면을 렌더링합니다.
 */
const ProductList = () => {
    const [searchParams] = useSearchParams();

    const category = searchParams.get("category");
    const filteredProducts = products.filter(product =>
    product.name.includes(category) || product.category === category
);

    console.log(category);   // 상의
    // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
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

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default ProductList
    ;