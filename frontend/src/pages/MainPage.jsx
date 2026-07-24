/**
 * 파일: src/pages/MainPage.jsx
 * 역할: Hero, 할인상품, 오늘의 AI 코디, 신상품, 축제 추천, 베스트셀러를 조합합니다.
 */
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import ChatPage from "../components/chat/ChatPage";
import HeroContent from "../components/main/HeroContent";
import WeatherCard from "../components/main/WeatherCard";
import ProductCard from "../components/product/ProductCard";
import ProductGridSkeleton from "../components/product/ProductGridSkeleton";
import "../assets/styles/global.css";
import "../assets/styles/main/MainPage.css";
import { getFestival, getList } from "../services/api";
import { closeMainChat } from "../store/slices/chatSlice";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const isCreatedWithinOneWeek = (createdAt) => {
  if (!createdAt) return false;

  const createdTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdTime)) return false;

  const elapsed = Date.now() - createdTime;
  return elapsed >= 0 && elapsed <= ONE_WEEK_MS;
};

const hasDiscount = (item) => {
  const originalPrice = Number(item.original_price ?? 0);
  const discountPrice = Number(item.discount_price ?? originalPrice);
  return originalPrice > 0 && discountPrice >= 0 && discountPrice < originalPrice;
};

const getCategoryText = (item) =>
  String(item.category ?? item.category_name ?? "").toLowerCase();

const includesCategory = (item, keywords) => {
  const category = getCategoryText(item);
  return keywords.some((keyword) => category.includes(keyword));
};

const findFirstUnused = (items, usedIds, matcher) =>
  items.find((item) => !usedIds.has(item.id) && matcher(item));

const buildDailyOutfit = (items) => {
  if (!items.length) return [];

  const candidates = [...items].sort((a, b) => {
    const discountGapA = Number(a.original_price ?? 0) - Number(a.discount_price ?? 0);
    const discountGapB = Number(b.original_price ?? 0) - Number(b.discount_price ?? 0);
    return (
      Number(b.like_count ?? 0) - Number(a.like_count ?? 0) ||
      discountGapB - discountGapA
    );
  });

  const usedIds = new Set();
  const slots = [
    {
      label: "상의",
      keywords: ["상의", "티셔츠", "셔츠", "니트", "후드", "맨투맨", "재킷", "아우터"],
    },
    {
      label: "하의",
      keywords: ["하의", "팬츠", "바지", "데님", "스커트", "슬랙스", "쇼츠"],
    },
    {
      label: "신발·포인트",
      keywords: ["신발", "슈즈", "스니커즈", "구두", "샌들", "가방", "액세서리"],
    },
  ];

  return slots
    .map((slot) => {
      const matched =
        findFirstUnused(candidates, usedIds, (item) => includesCategory(item, slot.keywords)) ||
        findFirstUnused(candidates, usedIds, () => true);

      if (!matched) return null;
      usedIds.add(matched.id);
      return { ...slot, product: matched };
    })
    .filter(Boolean);
};

const MainPage = () => {
  const dispatch = useDispatch();
  const isChatOpen = useSelector((state) => state.chat.mainChatOpen);

  const [chatMode, setChatMode] = useState("full");
  const [products, setProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(true);
  const [festivals, setFestivals] = useState([]);
  const [festivalIndex, setFestivalIndex] = useState(0);
  const [festivalLoading, setFestivalLoading] = useState(true);

  const discountProducts = useMemo(
    () =>
      products
        .filter(hasDiscount)
        .sort((a, b) => {
          const originalA = Number(a.original_price ?? 0);
          const saleA = Number(a.discount_price ?? originalA);
          const originalB = Number(b.original_price ?? 0);
          const saleB = Number(b.discount_price ?? originalB);
          const rateA = originalA ? (originalA - saleA) / originalA : 0;
          const rateB = originalB ? (originalB - saleB) / originalB : 0;
          return rateB - rateA;
        }),
    [products]
  );

  const newestProducts = useMemo(
    () =>
      [...products]
        .filter((item) => isCreatedWithinOneWeek(item.created_at))
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
    [products]
  );

  const bestProducts = useMemo(
    () =>
      [...products]
        .filter((item) => Number(item.like_count ?? 0) >= 5)
        .sort(
          (a, b) => Number(b.like_count ?? 0) - Number(a.like_count ?? 0)
        ),
    [products]
  );

  const dailyOutfit = useMemo(() => buildDailyOutfit(products), [products]);

  const weatherSummary = useMemo(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("moodfit_weather") || "null");
      const city = saved?.name ?? "오늘";
      const temperature = saved?.main?.temp;
      const condition = saved?.weather?.[0]?.description;

      if (temperature !== undefined && condition) {
        return `${city} ${Math.round(Number(temperature))}℃, ${condition} 날씨와 활용도를 고려한 조합이에요.`;
      }
    } catch (error) {
      console.error("저장된 날씨 정보 확인 실패:", error);
    }

    return "현재 인기와 상품 구성을 바탕으로 균형 있게 조합한 오늘의 스타일이에요.";
  }, [products]);

  useEffect(() => {
    Promise.allSettled([getList(), getFestival()]).then(([productResult, festivalResult]) => {
      if (productResult.status === "fulfilled") {
        setProducts(Array.isArray(productResult.value) ? productResult.value : []);
      } else {
        console.error("상품 목록 조회 실패:", productResult.reason);
      }
      setProductLoading(false);

      if (festivalResult.status === "fulfilled") {
        const data = festivalResult.value;
        const festivalItems = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.response?.body?.items?.item)
              ? data.response.body.items.item
              : data
                ? [data]
                : [];

        const normalizedFestivals = festivalItems.filter(Boolean).slice(0, 3);
        setFestivals(normalizedFestivals);
        setFestivalIndex(0);
      } else {
        console.error("축제 정보 조회 실패:", festivalResult.reason);
      }
      setFestivalLoading(false);
    });

    const handleScroll = () => {
      setChatMode(window.scrollY > 250 ? "sticky" : "full");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  useEffect(() => {
    if (festivals.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setFestivalIndex((current) => (current + 1) % festivals.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [festivals.length]);

  const activeFestival = festivals[festivalIndex] ?? null;

  const moveFestival = (direction) => {
    if (!festivals.length) return;
    setFestivalIndex((current) =>
      (current + direction + festivals.length) % festivals.length
    );
  };

  return (
    <main>
      {!isChatOpen ? (
        <section className="hero-section">
          <HeroContent />
          <WeatherCard />
        </section>
      ) : (
        <section className="chat-sticky-section">
          <ChatPage
            mode={chatMode}
            closeChat={() => dispatch(closeMainChat())}
          />
        </section>
      )}

      <section className="section" id="sale">
        <div className="section-title">
          <div>
            <span className="section-eyebrow sale">HOT SALE</span>
            <h2>할인 상품</h2>
            <p>지금 가격 혜택이 가장 큰 상품을 모았어요.</p>
          </div>
          <Link to="/moodfit/list?sale=true">전체보기</Link>
        </div>
        <div className="product-grid">
          {productLoading ? (
            <ProductGridSkeleton count={4} />
          ) : discountProducts.length ? (
            discountProducts.slice(0, 4).map((product) => (
              <ProductCard product={product} key={`sale-${product.id}`} />
            ))
          ) : (
            <p className="product-section-empty">현재 진행 중인 할인 상품이 없습니다.</p>
          )}
        </div>
      </section>

      <section className="section ai-outfit-section" id="daily-outfit">
        <div className="ai-outfit-heading">
          <div>
            <span className="section-eyebrow ai"><Sparkles size={13} /> AI DAILY LOOK</span>
            <h2>오늘의 AI 코디</h2>
            <p>날씨와 인기 데이터를 참고해 오늘 입기 좋은 조합을 골랐어요.</p>
          </div>
        </div>

        <div className="ai-outfit-layout">
          <div className="ai-outfit-products">
            {productLoading ? (
              <ProductGridSkeleton count={3} />
            ) : dailyOutfit.length ? (
              dailyOutfit.map(({ label, product }) => (
                <div className="ai-outfit-item" key={`${label}-${product.id}`}>
                  <span className="ai-outfit-slot">{label}</span>
                  <ProductCard product={product} />
                </div>
              ))
            ) : (
              <p className="product-section-empty">추천 코디를 구성할 상품이 부족합니다.</p>
            )}
          </div>

          <aside className="ai-reason-card">
            <span className="ai-reason-icon"><CloudSun size={24} /></span>
            <span className="section-eyebrow ai">AI REASON</span>
            <h3>오늘의 추천 이유</h3>
            <p>{weatherSummary}</p>
          </aside>
        </div>
      </section>

      <section className="section" id="new">
        <div className="section-title">
          <div>
            <span className="section-eyebrow">NEW ARRIVAL</span>
            <h2>신상품</h2>
            <p>최근 7일 이내 새롭게 등록된 상품들이에요.</p>
          </div>
          <Link to="/moodfit/list?collection=new">전체보기</Link>
        </div>
        <div className="product-grid">
          {productLoading ? (
            <ProductGridSkeleton count={4} />
          ) : newestProducts.length ? (
            newestProducts.slice(0, 4).map((product) => (
              <ProductCard product={product} key={product.id} />
            ))
          ) : (
            <p className="product-section-empty">최근 7일 이내 등록된 신상품이 없습니다.</p>
          )}
        </div>
      </section>

      <section className="festival-slider-section" aria-label="이번 주 축제 추천">
        <div className="festival-slider-frame">
          <div className="festival-feature-image">
            {activeFestival?.image_url || activeFestival?.firstimage ? (
              <img
                src={activeFestival.image_url || activeFestival.firstimage}
                alt={activeFestival.title || activeFestival.festival_name || "축제 이미지"}
              />
            ) : (
              <div className="festival-image-placeholder"><CalendarDays size={52} /></div>
            )}

            {festivals.length > 1 && (
              <div className="festival-slider-controls">
                <button
                  type="button"
                  onClick={() => moveFestival(-1)}
                  aria-label="이전 축제"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  onClick={() => moveFestival(1)}
                  aria-label="다음 축제"
                >
                  <ChevronRight size={22} />
                </button>
              </div>
            )}
          </div>

          <div className="festival-feature-content">
            <span className="section-eyebrow festival">WEEKLY FESTIVAL</span>
            <h2>
              {festivalLoading
                ? "이번 주 축제를 불러오는 중..."
                : activeFestival?.title || activeFestival?.festival_name || "이번 주 축제 추천"}
            </h2>
            <p>
              {activeFestival
                ? `${activeFestival.title || activeFestival.festival_name || "축제"}의 분위기와 장소에 어울리는 편안한 축제 코디를 AI에게 추천받아보세요.`
                : "지역 축제와 야외 활동에 어울리는 스타일을 AI가 함께 찾아드려요."}
            </p>

            <div className="festival-meta">
              <span>
                <MapPin size={17} />
                {activeFestival?.address ||
                  activeFestival?.location ||
                  activeFestival?.addr1 ||
                  "지역 정보 확인 중"}
              </span>
            </div>

            <Link
              to={`/moodfit/ailist?festival=${encodeURIComponent(
                activeFestival?.title || activeFestival?.festival_name || "축제"
              )}`}
              className="festival-recommend-link"
            >
              축제 코디 추천받기 <ArrowRight size={18} />
            </Link>

            {festivals.length > 1 && (
              <div className="festival-slider-dots" aria-label="축제 슬라이드 선택">
                {festivals.map((item, index) => (
                  <button
                    type="button"
                    key={`${item.id || item.contentid || item.title || "festival"}-${index}`}
                    className={index === festivalIndex ? "active" : ""}
                    onClick={() => setFestivalIndex(index)}
                    aria-label={`${index + 1}번째 축제 보기`}
                    aria-current={index === festivalIndex ? "true" : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section" id="best">
        <div className="section-title">
          <div>
            <span className="section-eyebrow">MOST LOVED</span>
            <h2>베스트셀러</h2>
            <p>좋아요를 가장 많이 받은 금주의 인기 상품이에요.</p>
          </div>
          <Link to="/moodfit/list?collection=best">전체보기</Link>
        </div>
        <div className="product-grid">
          {productLoading ? (
            <ProductGridSkeleton count={4} />
          ) : bestProducts.length ? (
            bestProducts.slice(0, 4).map((product) => (
              <ProductCard product={product} key={`best-${product.id}`} />
            ))
          ) : (
            <p className="product-section-empty">좋아요 5개 이상인 베스트 상품이 없습니다.</p>
          )}
        </div>
      </section>
    </main>
  );
};

export default MainPage;
