import { useMemo, useState } from "react";
import { CloudSun, HeartHandshake, Sparkles } from "lucide-react";
import { useSelector } from "react-redux";

import ProductCard from "../components/product/ProductCard";
import "../assets/styles/product/ProductListPage.css";

const RecomendList = () => {
  const { title, reason, searchKeyword, products } = useSelector((state) => state.recommendation);
  const [sortType, setSortType] = useState("추천순");

  const sortedProducts = useMemo(() => {
    const copied = [...(Array.isArray(products) ? products : [])];
    if (sortType === "낮은 가격순") return copied.sort((a, b) => Number(a.price ?? a.lprice ?? 0) - Number(b.price ?? b.lprice ?? 0));
    if (sortType === "높은 가격순") return copied.sort((a, b) => Number(b.price ?? b.lprice ?? 0) - Number(a.price ?? a.lprice ?? 0));
    if (sortType === "신상품순") return copied.sort((a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0));
    return copied;
  }, [products, sortType]);

  return (
    <main className="product-list-page recommendation-page">
      <nav className="product-breadcrumb"><span>HOME</span><span>/</span><strong>AI RECOMMEND</strong></nav>

      <section className="product-list-header recommendation-header">
        <div>
          <span className="product-list-label">MOODFIT AI CURATION</span>
          <h1>{title || "당신을 위한 스타일 셀렉션"}</h1>
          <p>대화 속 기분, 날씨, 선호 스타일을 읽고 가장 어울리는 상품만 골랐습니다.</p>
        </div>
        <select className="product-sort" value={sortType} onChange={(event) => setSortType(event.target.value)}>
          <option>추천순</option><option>낮은 가격순</option><option>높은 가격순</option><option>신상품순</option>
        </select>
      </section>

      <section className="recommendation-insight-grid">
        <article><Sparkles size={19} /><div><span>AI 추천 포인트</span><strong>{searchKeyword || "현재 대화 맥락"}</strong></div></article>
        <article><CloudSun size={19} /><div><span>상황 분석</span><strong>날씨와 계절감 반영</strong></div></article>
        <article><HeartHandshake size={19} /><div><span>취향 분석</span><strong>사용자 선호 스타일 반영</strong></div></article>
      </section>

      <section className="recommendation-reason-box">
        <span className="recommendation-reason-label">WHY WE PICKED THESE</span>
        <h2>이 상품들을 추천한 이유</h2>
        <p>{reason || "사용자의 기분과 날씨, 선호 스타일을 바탕으로 자연스럽게 활용하기 좋은 상품을 선택했습니다."}</p>
        <span className="recommendation-product-count">총 {sortedProducts.length}개의 추천 상품</span>
      </section>

      {sortedProducts.length > 0 ? (
        <section className="product-grid">
          {sortedProducts.map((product, index) => {
            const normalizedProduct = {
              ...product,
              id: product.id ?? product.product_id ?? index,
              product_name: product.product_name ?? product.name ?? product.title,
              image_url: product.image_url ?? product.image,
              price: product.price ?? product.lprice ?? 0,
              ai_recommended: true,
            };
            return <ProductCard key={normalizedProduct.id ?? index} product={normalizedProduct} />;
          })}
        </section>
      ) : (
        <section className="product-list-empty"><span>EMPTY CURATION</span><h2>아직 추천 상품이 없습니다.</h2><p>AI 챗봇과 대화를 나눈 뒤 추천 리스트를 열어주세요.</p></section>
      )}
    </main>
  );
};

export default RecomendList;
