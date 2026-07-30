/**
 * URL의 group/category/query 값을 이용해 상품 목록을 출력합니다.
 * 백엔드의 실제 DB 카테고리 구조를 프론트엔드 UI에 완벽히 동기화했습니다.
 */
import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom"; // 💡 네비게이션을 위해 추가

import ProductCard from "../components/product/ProductCard";
import ProductGridSkeleton from "../components/product/ProductGridSkeleton";
import { getList } from "../services/api";
import "../assets/styles/product/ProductListPage.css";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const isCreatedWithinOneWeek = (createdAt) => {
  if (!createdAt) return false;

  const createdTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdTime)) return false;

  const elapsed = Date.now() - createdTime;
  return elapsed >= 0 && elapsed <= ONE_WEEK_MS;
};

// 실제 데이터베이스 구조를 반영한 그룹별 카테고리 맵핑
const CATEGORY_GROUPING = {
  "상의": [
    { id: "100", name: "상의" }, // 화면 탭에서는 '전체'로 출력할 용도
    { id: "101", name: "반소매 티셔츠" },
    { id: "102", name: "긴소매 티셔츠" },
    { id: "103", name: "맨투맨" },
    { id: "104", name: "셔츠" },
    { id: "105", name: "후드" },
    { id: "106", name: "니트" }
  ],
  "하의": [
    { id: "200", name: "하의" },
    { id: "201", name: "데님" },
    { id: "202", name: "트레이닝" },
    { id: "203", name: "코튼" },
    { id: "204", name: "숏 팬츠" },
    { id: "205", name: "레깅스" },
    { id: "206", name: "조거 팬츠" },
    { id: "207", name: "청바지" },
    { id: "208", name: "스커트" }
  ],
  "아우터": [
    { id: "300", name: "아우터" },
    { id: "301", name: "집업" },
    { id: "302", name: "슈트" },
    { id: "303", name: "가디건" },
    { id: "304", name: "패딩" },
    { id: "305", name: "재킷" },
    { id: "306", name: "코트" },
    { id: "307", name: "베스트" }
  ],
  "악세사리/신발": [
    { id: "400", name: "악세사리/신발" },
    { id: "401", name: "캡" },
    { id: "402", name: "베레모" },
    { id: "403", name: "페도라" },
    { id: "404", name: "비니" },
    { id: "405", name: "스니커즈" },
    { id: "406", name: "스포츠화" },
    { id: "407", name: "구두" },
    { id: "408", name: "부츠" },
    { id: "409", name: "샌들" },
    { id: "410", name: "가방/잡화" }
  ]
};

// ID로 단일 카테고리 이름을 찾기 위한 평탄화 작업 (기존 CATEGORY_MAP 대체)
const CATEGORY_MAP = Object.values(CATEGORY_GROUPING)
  .flat()
  .reduce((acc, curr) => {
    acc[curr.id] = curr.name;
    return acc;
  }, {});

const ProductList = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [sortType, setSortType] = useState("추천순");
  const [loading, setLoading] = useState(true);

  const group = searchParams.get("group") || "전체 상품";
  const category = searchParams.get("category") || "";
  const query = searchParams.get("query")?.trim() || "";
  const collection = searchParams.get("collection") || "";
  const sortParam = searchParams.get("sort") || "";
  const saleOnly = searchParams.get("sale") === "true";
  const isBestCollection = collection === "best" || sortParam === "best";
  const isNewCollection = collection === "new" || sortParam === "new";

  const categoryIds = useMemo(
    () => category.split(",").map((item) => item.trim()).filter(Boolean),
    [category]
  );

  // 현재 선택된 그룹(대분류)의 중분류 목록 추출
  const subCategories = CATEGORY_GROUPING[group] || [];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getList();
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("상품 목록 조회 실패:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (isNewCollection) {
      setSortType("신상품순");
    } else if (isBestCollection) {
      setSortType("좋아요순");
    } else if (saleOnly) {
      setSortType("할인율순");
    }
  }, [isNewCollection, isBestCollection, saleOnly]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    const filtered = products.filter((product) => {
      
      // 필터링 로직 수정 (대분류 선택 시 하위 카테고리 상품 모두 포함)
      let categoryMatched = false;

      if (categoryIds.length === 0) {
        if (group === "전체 상품" || !CATEGORY_GROUPING[group]) {
          categoryMatched = true; // 그룹이 지정되지 않은 경우 모두 보여줌
        } else {
          // 해당 그룹(예: 상의)에 속한 모든 하위 ID 배열을 추출하여 필터링
          const groupIds = CATEGORY_GROUPING[group].map(c => c.id);
          categoryMatched = groupIds.includes(String(product.category_id));
        }
      } else {
        // 특정 중분류 탭을 눌렀을 경우 해당 ID만 필터링
        categoryMatched = categoryIds.includes(String(product.category_id));
      }

      if (!categoryMatched) return false;

      if (saleOnly) {
        const originalPrice = Number(product.original_price ?? 0);
        const discountPrice = Number(product.discount_price ?? originalPrice);
        if (!(originalPrice > 0 && discountPrice >= 0 && discountPrice < originalPrice)) {
          return false;
        }
      }

      if (isNewCollection && !isCreatedWithinOneWeek(product.created_at)) {
        return false;
      }

      if (!normalizedQuery) return true;

      return [
        product.product_name,
        product.name,
        product.brand_name,
        product.brand,
        product.category_name,
        product.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });

    const copied = [...filtered];
    if (sortType === "낮은 가격순") {
      return copied.sort((a, b) => Number(a.discount_price) - Number(b.discount_price));
    }
    if (sortType === "높은 가격순") {
      return copied.sort((a, b) => Number(b.discount_price) - Number(a.discount_price));
    }
    if (sortType === "신상품순") {
      return copied.sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime()
      );
    }
    if (sortType === "좋아요순") {
      return copied.sort(
        (a, b) =>
          Number(b.like_count ?? 0) -
          Number(a.like_count ?? 0)
      );
    }
    if (sortType === "할인율순") {
      return copied.sort((a, b) => {
        const originalA = Number(a.original_price ?? 0);
        const saleA = Number(a.discount_price ?? originalA);
        const originalB = Number(b.original_price ?? 0);
        const saleB = Number(b.discount_price ?? originalB);
        const rateA = originalA > 0 ? (originalA - saleA) / originalA : 0;
        const rateB = originalB > 0 ? (originalB - saleB) / originalB : 0;
        return rateB - rateA;
      });
    }
    return copied;
  }, [products, categoryIds, query, collection, saleOnly, sortType, group]);

  const displayTitle = category && CATEGORY_MAP[category]
    ? CATEGORY_MAP[category]
    : saleOnly
      ? "할인 상품"
      : isNewCollection
        ? "이번 주 신상품"
        : isBestCollection
          ? "베스트 셀러"
          : group;

  const displayLabel = category ? group : "MOODFIT COLLECTION";

  const collectionDescription =
    saleOnly
      ? "정상가보다 할인된 상품만 모았습니다."
      : isNewCollection
        ? "최근 7일 이내 등록된 상품만 모았습니다."
        : isBestCollection
          ? "가장 많은 좋아요와 인기를 받은 상품 모음입니다."
          : "기분과 취향에 맞는 오늘의 스타일을 발견해보세요.";

  return (
    <main className="product-list-page">
      <nav className="product-breadcrumb" aria-label="현재 위치">
        <span>HOME</span><span>/</span><strong>{group}</strong>
      </nav>

      <section className="product-list-header">
        <div>
          <span className="product-list-label">{query ? "SEARCH" : displayLabel}</span>
          <h1>{query ? `“${query}” 검색 결과` : displayTitle}</h1>
          <p>{query ? "검색어와 가장 가까운 스타일을 모았습니다." : collectionDescription}</p>
        </div>
      </section>

      {/* 중분류 카테고리 탭 출력 UI */}
      {subCategories.length > 0 && !query && !saleOnly && !isNewCollection && !isBestCollection && (
        <section style={{ display: 'flex', gap: '8px', margin: '20px 0', flexWrap: 'wrap' }}>
          {subCategories.map((sub) => {
            // 대분류 이름과 중분류 이름이 같으면(예: id 100번) '전체'라고 화면에 표시합니다.
            const displayName = sub.name === group ? "전체" : sub.name;
            const isActive = category === sub.id || (category === "" && sub.name === group);
            
            return (
              <button
                key={sub.id}
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  if (sub.name === group) {
                    newParams.delete("category"); // '전체'를 누르면 파라미터 삭제
                  } else {
                    newParams.set("category", sub.id); // 다른 중분류 누르면 파라미터 셋팅
                  }
                  navigate(`?${newParams.toString()}`);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: `1px solid ${isActive ? '#000' : '#ddd'}`,
                  backgroundColor: isActive ? '#000' : '#fff',
                  color: isActive ? '#fff' : '#666',
                  cursor: 'pointer',
                  fontWeight: isActive ? 'bold' : 'normal',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {displayName}
              </button>
            );
          })}
        </section>
      )}

      <section className="product-list-toolbar" aria-label="상품 목록 도구">
        <div className="product-result-count">
          <SlidersHorizontal size={16} />
          <strong>{filteredProducts.length}</strong> products
        </div>
        <label className="product-sort-label">
          <span>정렬</span>
          <select className="product-sort" value={sortType} onChange={(event) => setSortType(event.target.value)}>
            <option>추천순</option>
            <option>낮은 가격순</option>
            <option>높은 가격순</option>
            <option>신상품순</option>
            <option>좋아요순</option>
            {saleOnly && <option>할인율순</option>}
          </select>
        </label>
      </section>

      {loading ? (
        <ProductGridSkeleton count={8} />
      ) : filteredProducts.length > 0 ? (
        <section className="product-grid">
          {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
        </section>
      ) : (
        <section className="product-list-empty">
          <span>NO RESULT</span>
          <h2>
            {saleOnly
              ? "현재 진행 중인 할인 상품이 없습니다."
              : collection === "new"
                ? "최근 7일 이내 등록된 상품이 없습니다."
                : collection === "best"
                  ? "좋아요 5개 이상인 상품이 없습니다."
                  : "조건에 맞는 상품이 없습니다."}
          </h2>
          <p>
            {saleOnly
              ? "관리자가 상품 가격을 할인 설정하면 이 목록에 표시됩니다."
              : collection
                ? "상품이 등록되거나 좋아요가 늘어나면 이 목록에 표시됩니다."
                : "검색어 또는 카테고리를 변경해 다시 확인해보세요."}
          </p>
        </section>
      )}
    </main>
  );
};

export default ProductList;