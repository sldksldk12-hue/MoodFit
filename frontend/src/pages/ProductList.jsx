/**
 * URL의 group/category/query 값을 이용해 상품 목록을 출력합니다.
 * 기존 API 구조는 유지하고 UI 상태만 프론트에서 처리합니다.
 */
import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "react-router-dom";

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

const ProductList = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [sortType, setSortType] = useState("추천순");
  const [loading, setLoading] = useState(true);

  const group = searchParams.get("group") || "전체 상품";
  const category = searchParams.get("category") || "";
  const query = searchParams.get("query")?.trim() || "";
  const collection = searchParams.get("collection") || "";
  const saleOnly = searchParams.get("sale") === "true";

  const categoryIds = useMemo(
    () => category.split(",").map((item) => item.trim()).filter(Boolean),
    [category]
  );

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
    if (collection === "new") {
      setSortType("신상품순");
    } else if (collection === "best") {
      setSortType("좋아요순");
    } else if (saleOnly) {
      setSortType("할인율순");
    }
  }, [collection, saleOnly]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    const filtered = products.filter((product) => {
      const categoryMatched =
        categoryIds.length === 0 ||
        categoryIds.includes(String(product.category_id));

      if (!categoryMatched) return false;

      if (saleOnly) {
        const originalPrice = Number(product.original_price ?? 0);
        const discountPrice = Number(product.discount_price ?? originalPrice);
        if (!(originalPrice > 0 && discountPrice >= 0 && discountPrice < originalPrice)) {
          return false;
        }
      }

      if (
        collection === "new" &&
        !isCreatedWithinOneWeek(product.created_at)
      ) {
        return false;
      }

      if (
        collection === "best" &&
        Number(product.like_count ?? 0) < 5
      ) {
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
  }, [products, categoryIds, query, collection, saleOnly, sortType]);

  const collectionTitle =
    saleOnly
      ? "할인 상품"
      : collection === "new"
        ? "이번 주 신상품"
        : collection === "best"
          ? "베스트 셀러"
          : group;

  const collectionDescription =
    saleOnly
      ? "정상가보다 할인된 상품만 모았습니다."
      : collection === "new"
        ? "최근 7일 이내 등록된 상품만 모았습니다."
        : collection === "best"
          ? "좋아요 5개 이상을 받은 인기 상품만 모았습니다."
          : "기분과 취향에 맞는 오늘의 스타일을 발견해보세요.";

  return (
    <main className="product-list-page">
      <nav className="product-breadcrumb" aria-label="현재 위치">
        <span>HOME</span><span>/</span><strong>{group}</strong>
      </nav>

      <section className="product-list-header">
        <div>
          <span className="product-list-label">MOODFIT COLLECTION</span>
          <h1>{query ? `“${query}” 검색 결과` : collectionTitle}</h1>
          <p>{query ? "검색어와 가장 가까운 스타일을 모았습니다." : collectionDescription}</p>
        </div>
      </section>

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
