/**
 * 파일: src/pages/RecomendList.jsx
 *
 * 역할
 * - AI가 같은 이유로 추천한 상품 묶음을 출력합니다.
 */

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";

import ProductCard from "../components/product/ProductCard";
import useLikedProductIds from "../hooks/useLikedProductIds";
import "../assets/styles/product/ProductListPage.css";

const RecomendList = () => {
  const {
    title,
    reason,
    searchKeyword,
    products,
  } = useSelector(
    (state) => state.recommendation
  );

  const [sortType, setSortType] =
    useState("추천순");
  const { likedProductIds } = useLikedProductIds();

  const sortedProducts = useMemo(() => {
    const copiedProducts = [
      ...(Array.isArray(products)
        ? products
        : []),
    ];

    switch (sortType) {
      case "낮은 가격순":
        return copiedProducts.sort(
          (a, b) =>
            Number(
              a.price ?? a.lprice ?? 0
            ) -
            Number(
              b.price ?? b.lprice ?? 0
            )
        );

      case "높은 가격순":
        return copiedProducts.sort(
          (a, b) =>
            Number(
              b.price ?? b.lprice ?? 0
            ) -
            Number(
              a.price ?? a.lprice ?? 0
            )
        );

      case "신상품순":
        return copiedProducts.sort(
          (a, b) =>
            new Date(
              b.created_at ?? 0
            ) -
            new Date(
              a.created_at ?? 0
            )
        );

      default:
        return copiedProducts;
    }
  }, [products, sortType]);

  return (
    <main className="product-list-page">
      <section className="product-list-header">
        <div>
          <span className="product-list-label">
            MOOD FIT AI
          </span>

          <h1>
            "AI 추천 상품 리스트"
          </h1>

          <p>
            AI 챗봇이 대화를 바탕으로 추천한
            상품입니다. 원하는 상품이 없다면 하단
            AI 챗봇을 통해 추천을 이어갈 수 있습니다.
          </p>
        </div>

        <select
          className="product-sort"
          value={sortType}
          onChange={(event) =>
            setSortType(event.target.value)
          }
        >
          <option>추천순</option>
          <option>낮은 가격순</option>
          <option>높은 가격순</option>
          <option>신상품순</option>
        </select>
      </section>

      {/* 추천 그룹의 공통 설명 */}
      <section className="recommendation-reason-box">
        <span className="recommendation-reason-label">
          AI 추천 이유
        </span>

        <h2>
          {/* {searchKeyword ||
            "현재 상황에 맞는 추천"} */}
        </h2>

        <p>
          {/* {reason || */}
            {"사용자의 기분과 날씨, 선호 스타일을 바탕으로 선택한 상품입니다."}
        </p>

        <span className="recommendation-product-count">
          총 {sortedProducts.length}개의 상품
        </span>
      </section>

      {sortedProducts.length > 0 ? (
        <section className="product-grid">
          {sortedProducts.map(
            (product, index) => {
              const normalizedProduct = {
                ...product,

                id:
                  product.id ??
                  product.product_id ??
                  index,

                product_name:
                  product.product_name ??
                  product.name ??
                  product.title,

                image_url:
                  product.image_url ??
                  product.image,

                price:
                  product.price ??
                  product.lprice ??
                  0,
              };

              return (
                <ProductCard
                  key={
                    normalizedProduct.id ??
                    index
                  }
                  product={normalizedProduct}
                  initialLiked={likedProductIds.has(Number(normalizedProduct.id))}
                />
              );
            }
          )}
        </section>
      ) : (
        <section className="recommendation-empty">
          <h2>추천 상품이 없습니다.</h2>

          <p>
            AI 챗봇과 대화한 뒤 추천 리스트를
            열어주세요.
          </p>
        </section>
      )}
    </main>
  );
};

export default RecomendList;