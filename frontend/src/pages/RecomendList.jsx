import { useEffect, useMemo, useRef, useState } from "react";
import { CloudSun, HeartHandshake, Sparkles, Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";

import ProductCard from "../components/product/ProductCard";
import "../assets/styles/product/ProductListPage.css";
import { chatStart } from "../services/api";
import { clearRecommendation, setRecommendationGroup } from "../store/slices/recommendationSlice";
import { useAuth } from "../store/AuthContext";

const RecomendList = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const festivalParam = searchParams.get("festival");
  const { title, reason, searchKeyword, products } = useSelector((state) => state.recommendation);
  const [sortType, setSortType] = useState("추천순");
  const [loading, setLoading] = useState(false);
  const fetchedFestivalRef = useRef("");

  useEffect(() => {
    if (festivalParam && fetchedFestivalRef.current !== festivalParam) {
      fetchedFestivalRef.current = festivalParam;
      const currentUserId = user?.id ? Number(user.id) : 1;
      const prompt = `${festivalParam} 축제에 가려고 하는데, 분위기와 장소에 어울리는 추천 코디를 알려줘`;
      
      // 🌟 신규 축제 요청 시 이전 축제 데이터 잔상 즉시 제거!
      dispatch(clearRecommendation());
      dispatch(
        setRecommendationGroup({
          title: `${festivalParam} 맞춤 코디 추천`,
          reason: "",
          searchKeyword: festivalParam,
          products: [],
        })
      );
      setLoading(true);

      chatStart({ userId: currentUserId, message: prompt })
        .then((data) => {
          if (data && !data.error) {
            dispatch(
              setRecommendationGroup({
                title: `${festivalParam} 맞춤 코디 추천`,
                reason: data.summary_reason || data.ai_response,
                searchKeyword: data.search_keyword,
                products: data.products || [],
              })
            );
          }
        })
        .catch((err) => console.error("축제 코디 추천 로딩 에러:", err))
        .finally(() => setLoading(false));
    }
  }, [festivalParam, dispatch, user?.id]);

  const sortedProducts = useMemo(() => {
    const copied = [...(Array.isArray(products) ? products : [])];
    if (sortType === "낮은 가격순") return copied.sort((a, b) => Number(a.lprice) - Number(b.lprice));
    if (sortType === "높은 가격순") return copied.sort((a, b) => Number(b.lprice) - Number(a.lprice));
    return copied;
  }, [products, sortType]);

  return (
    <main className="product-list-page recommendation-page">
      <nav className="product-breadcrumb"><span>HOME</span><span>/</span><strong>AI RECOMMEND</strong></nav>

      <section className="product-list-header recommendation-header">
        <div>
          <span className="product-list-label">MOODFIT AI CURATION</span>
          <h1>{title || (festivalParam ? `${festivalParam} 맞춤 코디` : "당신을 위한 스타일 셀렉션")}</h1>
          <p>대화 속 기분, 날씨, 선호 스타일을 읽고 가장 어울리는 상품만 골랐습니다.</p>
        </div>
        <select className="product-sort" value={sortType} onChange={(event) => setSortType(event.target.value)}>
          <option>추천순</option><option>낮은 가격순</option><option>높은 가격순</option>
        </select>
      </section>

      <section className="recommendation-insight-grid">
        <article><Sparkles size={19} /><div><span>AI 추천 포인트</span><strong>{searchKeyword || festivalParam || "현재 대화 맥락"}</strong></div></article>
        <article><CloudSun size={19} /><div><span>상황 분석</span><strong>날씨와 계절감 반영</strong></div></article>
        <article><HeartHandshake size={19} /><div><span>취향 분석</span><strong>사용자 선호 스타일 반영</strong></div></article>
      </section>

      <section className="recommendation-reason-box">
        <span className="recommendation-reason-label">WHY WE PICKED THESE</span>
        <h2>이 상품들을 추천한 이유</h2>
        <p>{reason || "사용자의 기분과 날씨, 선호 스타일을 바탕으로 자연스럽게 활용하기 좋은 상품을 선택했습니다."}</p>
        <span className="recommendation-product-count">총 {sortedProducts.length}개의 추천 상품</span>
      </section>

      {loading ? (
        <section className="product-list-empty">
          <Loader2 className="animate-spin" size={40} style={{ margin: "2rem auto", display: "block", color: "#6366f1" }} />
          <h2>AI가 {festivalParam || "축제"} 맞춤 코디를 추천 중입니다...</h2>
          <p>날씨, 장소 분위기, 인기 스타일에 딱 맞는 옷을 찾고 있습니다.</p>
        </section>
      ) : sortedProducts.length > 0 ? (
        <section className="product-grid">
          {sortedProducts.map((product, index) => {
            const normalizedProduct = {
              ...product,
              id: product.id,
              product_name: product.title,
              image_url: product.image,
              original_price: Number(product.lprice),
              discount_price: Number(product.lprice),
              inventory: 1,
              like_count: 0,
              brand: "MOODFIT AI PICK",
              ai_recommended: true,
            };
            return <ProductCard key={normalizedProduct.id || index} product={normalizedProduct} />;
          })}
        </section>
      ) : (
        <section className="product-list-empty"><span>EMPTY CURATION</span><h2>아직 추천 상품이 없습니다.</h2><p>AI 챗봇과 대화를 나눈 뒤 추천 리스트를 열어주세요.</p></section>
      )}
    </main>
  );
};

export default RecomendList;
