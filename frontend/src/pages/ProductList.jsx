/**
 * 파일: src/pages/ProductList.jsx
 * 역할: URL의 group과 category 값을 이용해 상품 목록을 출력합니다.
 */

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ProductCard from "../components/product/ProductCard";
import ProductGridSkeleton from "../components/product/ProductGridSkeleton";
import { getList } from "../services/api";
import "../assets/styles/product/ProductListPage.css";

const ProductList = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [sortType, setSortType] = useState("추천순");
  const [loading, setLoading] = useState(true);

  // Header가 화면에 보여줄 한글 이름을 group으로 전달합니다.
  const group = searchParams.get("group") || "상품";

  // 예: "101,102,103,104,105,106"
  const category = searchParams.get("category") || "";
  const query = searchParams.get("query")?.trim() || "";

  // 쉼표 문자열을 ["101", "102", ...] 배열로 변환합니다.
  const categoryIds = useMemo(
    () => category.split(",").map((id) => id.trim()).filter(Boolean),
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

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.toLowerCase();

    const filtered = products.filter((product) => {
      // 카테고리 필터
      const categoryMatched =
        categoryIds.length === 0 ||
        categoryIds.includes(
          String(product.category_id)
        );

      if (!categoryMatched) {
        return false;
      }

      // 검색어가 없으면 카테고리 조건만 적용
      if (!normalizedQuery) {
        return true;
      }

      const searchableText = [
        product.product_name,
        product.name,
        product.brand_name,
        product.brand,
        product.category_name,
        product.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });

    const copied = [...filtered];

    switch (sortType) {
      case "낮은 가격순":
        return copied.sort(
          (a, b) =>
            Number(
              a.discount_price ?? a.price ?? 0
            ) -
            Number(
              b.discount_price ?? b.price ?? 0
            )
        );

      case "높은 가격순":
        return copied.sort(
          (a, b) =>
            Number(
              b.discount_price ?? b.price ?? 0
            ) -
            Number(
              a.discount_price ?? a.price ?? 0
            )
        );

      case "신상품순":
        return copied.sort(
          (a, b) =>
            new Date(b.created_at ?? 0) -
            new Date(a.created_at ?? 0)
        );

      default:
        return copied;
    }
  }, [
    products,
    categoryIds,
    query,
    sortType,
  ]);

  return (
    <main className="product-list-page">
      <section className="product-list-header">
        <div>
          <span className="product-list-label">MOOD FIT</span>
          <h1>
            {query
              ? `"${query}" 검색 결과`
              : `${group} 리스트`}
          </h1>

          <p>
            {query
              ? `${filteredProducts.length}개의 상품을 찾았습니다.`
              : "AI가 선택한 코디 상품들을 확인해보세요."}
          </p>
        </div>

        <select
          className="product-sort"
          value={sortType}
          onChange={(event) => setSortType(event.target.value)}
        >
          <option>추천순</option>
          <option>낮은 가격순</option>
          <option>높은 가격순</option>
          <option>신상품순</option>
        </select>
      </section>

      {loading ? (
        <ProductGridSkeleton count={8} />
      ) : filteredProducts.length > 0 ? (
        <section className="product-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      ) : (
        <p className="product-list-message">
          해당 카테고리의 상품이 없습니다.
        </p>
      )}
    </main>
  );
};

export default ProductList;