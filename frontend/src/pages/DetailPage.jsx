import {
  Heart,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import ProductDescription from "../components/detail/ProductDescription";
import ProductReview from "../components/detail/ProductReview";
import ProductQna from "../components/detail/ProductQna";
import { getDetail } from "../services/api";
import { addToCart } from "../store/slices/cartSlice";
import "../assets/styles/detail/DetailPage.css";

const initialProduct = {
  id: null,
  shop_product_id: "",
  category: "",
  brand: "",
  name: "",
  original_price: 0,
  discount_price: 0,
  images: [],
  purchase_link: "",
  gender_target: "",
  inventory: 0,
  average_rating: 0,
  like_count: 0,
};

const DetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [tab, setTab] = useState("desc");
  const [size, setSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(initialProduct);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError("상품 ID가 없습니다.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await getDetail(id);
        const data = response?.data;

        if (!data) {
          throw new Error("상품 정보를 불러오지 못했습니다.");
        }

        setProduct({
          ...initialProduct,
          ...data,
          original_price: Number(data.original_price ?? 0),
          discount_price: Number(data.discount_price ?? 0),
          inventory: Number(data.inventory ?? 0),
          average_rating: Number(data.average_rating ?? 0),
          like_count: Number(data.like_count ?? 0),
          images: Array.isArray(data.images)
            ? data.images.filter(Boolean)
            : data.images
              ? [data.images]
              : [],
        });
      } catch (err) {
        console.error("상품 상세 조회 실패:", err);
        setError(
          err.response?.data?.detail ||
            err.message ||
            "상품 정보를 불러오는 중 오류가 발생했습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const mainImage = useMemo(
    () => product.images[0] || "/images/product-placeholder.png",
    [product.images]
  );

  const salePrice = product.discount_price || product.original_price;
  const maxQuantity = Math.max(1, Math.min(product.inventory || 4, 10));

  const handleAddCart = () => {
    if (!product.id) return;

    if (product.inventory <= 0) {
      alert("품절된 상품입니다.");
      return;
    }

    dispatch(
      addToCart({
        ...product,
        image: mainImage,
        price: salePrice,
        option: `사이즈 ${size}`,
        quantity,
        cartKey: `${product.id}-${size}`,
      })
    );

    alert("장바구니에 상품을 담았습니다.");
  };

  const handleBuyNow = () => {
    if (product.inventory <= 0) {
      alert("품절된 상품입니다.");
      return;
    }

    handleAddCart();
    navigate("/moodfit/cart");
  };

  if (loading) {
    return (
      <main className="detail-page">
        <p className="detail-status">상품 정보를 불러오는 중입니다.</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="detail-page">
        <div className="detail-status detail-error">
          <p>{error}</p>
          <button type="button" onClick={() => navigate(-1)}>
            이전 페이지로
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="detail-page">
      <section className="detail-container">
        <div className="detail-image-box">
          <img src={mainImage} alt={product.name || "상품 이미지"} />
        </div>

        <div className="detail-info">
          <span className="detail-category">{product.category}</span>
          {product.brand && <p className="detail-brand">{product.brand}</p>}
          <h1>{product.name}</h1>

          <div className="detail-rating">
            평점 {product.average_rating.toFixed(1)} · 좋아요 {product.like_count}
          </div>

          {product.original_price > salePrice && (
            <div className="detail-original-price">
              {product.original_price.toLocaleString()}원
            </div>
          )}
          <div className="detail-price">{salePrice.toLocaleString()}원</div>

          <div className="detail-option">
            <label>사이즈</label>
            <div className="size-buttons">
              {["S", "M", "L", "XL"].map((itemSize) => (
                <button
                  type="button"
                  key={itemSize}
                  className={size === itemSize ? "active" : ""}
                  onClick={() => setSize(itemSize)}
                >
                  {itemSize}
                </button>
              ))}
            </div>
          </div>

          <div className="detail-option">
            <label htmlFor="product-quantity">수량</label>
            <select
              id="product-quantity"
              value={quantity}
              disabled={product.inventory <= 0}
              onChange={(event) => setQuantity(Number(event.target.value))}
            >
              {Array.from({ length: maxQuantity }, (_, index) => index + 1).map(
                (count) => (
                  <option key={count} value={count}>
                    {count}개
                  </option>
                )
              )}
            </select>
            <span className="detail-inventory">
              {product.inventory > 0 ? `재고 ${product.inventory}개` : "품절"}
            </span>
          </div>

          <div className="detail-buttons">
            <button
              type="button"
              className="cart-btn"
              onClick={handleAddCart}
              disabled={product.inventory <= 0}
            >
              <ShoppingCart size={20} />
              장바구니
            </button>
            <button
              type="button"
              className="buy-btn"
              onClick={handleBuyNow}
              disabled={product.inventory <= 0}
            >
              바로 구매
            </button>
            <button type="button" className="like-btn" aria-label="좋아요">
              <Heart size={22} />
            </button>
          </div>

          <div className="detail-benefits">
            <div><Truck size={20} />무료배송</div>
            <div><ShieldCheck size={20} />안전결제</div>
            <div><RotateCcw size={20} />7일 교환/반품</div>
          </div>
        </div>
      </section>

      <section className="detail-additional">
        <div className="detail-tabs">
          <button
            type="button"
            className={`detail-tab ${tab === "desc" ? "active" : ""}`}
            onClick={() => setTab("desc")}
          >
            상품 설명
          </button>
          <button
            type="button"
            className={`detail-tab ${tab === "review" ? "active" : ""}`}
            onClick={() => setTab("review")}
          >
            상품 후기
          </button>
          <button
            type="button"
            className={`detail-tab ${tab === "qna" ? "active" : ""}`}
            onClick={() => setTab("qna")}
          >
            상품 Q&A
          </button>
        </div>

        <div className="detail-tab-contents">
          {tab === "desc" && <ProductDescription product={product} />}
          {tab === "review" && <ProductReview productId={product.id} />}
          {tab === "qna" && <ProductQna productId={product.id} />}
        </div>
      </section>
    </main>
  );
};

export default DetailPage;