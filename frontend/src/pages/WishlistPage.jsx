import { Heart, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ProductCard from "../components/product/ProductCard";
import ProductGridSkeleton from "../components/product/ProductGridSkeleton";
import {
  getList,
  getUserLikes,
} from "../services/api";
import { useAuth } from "../store/AuthContext";

import "../assets/styles/pages/mypage/WishlistPage.css";

const WishlistPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [likedProducts, setLikedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = Number(user?.id);
  const handleUnlike = (productId) => {
    setLikedProducts((prev) =>
      prev.filter((item) => item.id !== productId)
    );
  };

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const fetchWishlist = async () => {
      try {
        const likes = await getUserLikes(userId);
        const products = await getList();

        const likedIds = new Set(
          (likes ?? []).map((like) => Number(like.product_id))
        );

        const filteredProducts = (products ?? []).filter((product) =>
          likedIds.has(Number(product.id))
        );

        if (!cancelled) {
          setLikedProducts(filteredProducts);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setLikedProducts([]);
          setError(
            err.response?.data?.detail ??
            "찜 목록을 불러오지 못했습니다."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchWishlist();

    return () => {
      cancelled = true;
    };
  }, [userId]);
  if (!userId) {
    return null;
  }

  return (
    <main className="wishlist-page">
      <section className="wishlist-container">
        <header className="wishlist-header">
          <div>
            <span>MY WISHLIST</span>
            <h1>찜 목록</h1>
            <p>
              좋아요한 상품을 한눈에 확인해보세요.
            </p>
          </div>

          <div className="wishlist-count">
            <Heart
              size={18}
              fill="currentColor"
            />
            {likedProducts.length}개
          </div>
        </header>

        {error && (
          <div className="wishlist-error">
            {error}
          </div>
        )}

        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : likedProducts.length > 0 ? (
          <section className="wishlist-grid">
            {likedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onUnlike={handleUnlike}

              />
            ))}
          </section>
        ) : (
          <section className="wishlist-empty">
            <Heart size={52} />

            <h2>아직 좋아요한 상품이 없습니다.</h2>

            <p>
              마음에 드는 상품의 하트 버튼을 눌러
              저장해보세요.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/moodfit/list")
              }
            >
              <ShoppingBag size={18} />
              상품 보러 가기
            </button>
          </section>
        )}
      </section>
    </main>
  );
};

export default WishlistPage;