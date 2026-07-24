import {
  Heart,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate, useParams } from "react-router-dom";

import ProductDescription from "../components/detail/ProductDescription";
import ProductReview from "../components/detail/ProductReview";
import ProductQna from "../components/detail/ProductQna";

import { getDetail, addProductHistory } from "../services/api";

import useAddToCart from "../hooks/useAddToCart";
import useProductLike from "../hooks/useProductLike";

import "../assets/styles/detail/DetailPage.css";
import { useAuth } from "../store/AuthContext";


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
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tab, setTab] = useState("desc");
  const [size, setSize] = useState("M");
  const [quantity, setQuantity] =
    useState(1);

  const [product, setProduct] =
    useState(initialProduct);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * 상품 상세 조회
   */
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

        const response =
          await getDetail(id);

        const data = response?.data;

        if (!data) {
          throw new Error(
            "상품 정보를 불러오지 못했습니다."
          );
        }

        setProduct({
          ...initialProduct,
          ...data,

          original_price: Number(
            data.original_price ?? 0
          ),

          discount_price: Number(
            data.discount_price ?? 0
          ),

          inventory: Number(
            data.inventory ?? 0
          ),

          average_rating: Number(
            data.average_rating ?? 0
          ),

          like_count: Number(
            data.like_count ?? 0
          ),

          images: Array.isArray(
            data.images
          )
            ? data.images.filter(Boolean)
            : data.images
              ? [data.images]
              : [],
        });
      } catch (err) {
        console.error(
          "상품 상세 조회 실패:",
          err
        );

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
  /*
   * 최근 본 상품 기록 및 체류 시간(dwell_time) 측정
   *
   * 페이지 진입 시 초기 기록을 저장하고, 유저가 페이지를 벗어날 때(Unmount)
   * 머문 시간(초)을 계산하여 체류 시간(dwell_time)을 DB에 저장합니다.
   */
  useEffect(() => {
    if (!user?.id || !id) return;

    const startTime = Date.now();

    // 페이지 이탈 시점에 머문 시간(초)을 측정하여 딱 1번만 전송
    return () => {
      const dwellSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      addProductHistory(user.id, id, dwellSeconds).catch(() => {});
    };
  }, [user?.id, id]);
  const {
    liked,
    likeCount,
    likeLoading,
    toggleProductLike,
  } = useProductLike({
    productId: product.id,
    initialLikeCount: product.like_count,
  });

  const { cartLoading, addProductToCart } = useAddToCart();

  const handleLike = () => {
    toggleProductLike({ redirectToLogin: true });
  };

  /*
   * 리뷰 등록 직후 ProductReview에서 계산한 평균 평점을 받아
   * 상세페이지 상단 평점을 새로고침 없이 즉시 갱신합니다.
   */
  const handleRatingChange = (averageRating) => {
    setProduct((currentProduct) => ({
      ...currentProduct,
      average_rating: Number(averageRating ?? 0),
    }));
  };

  /*
   * 대표 이미지
   */
  const mainImage = useMemo(() => {
    return (
      product.images[0] ||
      "/images/product-placeholder.png"
    );
  }, [product.images]);

  /*
   * 할인 가격이 있으면 할인 가격,
   * 없으면 원래 가격을 사용합니다.
   */
  const salePrice =
    product.discount_price ||
    product.original_price;

  /*
   * 최대 선택 수량
   */
  const maxQuantity = Math.max(
    1,
    Math.min(
      product.inventory || 1,
      10
    )
  );

  /*
   * 장바구니 DB 저장
   */
  const handleAddCart = async () => {
    const success = await addProductToCart({
      productId: product.id,
      inventory: product.inventory,
      quantity,
      selectedSize: size,
      selectedColor: "기본",
      loginReturnPath: `/moodfit/detail/${product.id}`,
    });

    if (success) {
      alert("장바구니에 상품을 담았습니다.");
    }

    return success;
  };

  /*
   * 바로 구매
   *
   * 장바구니 DB 저장에 성공한 경우에만
   * 장바구니 페이지로 이동합니다.
   */
const handleBuyNow = () => {
  if (!user?.id) {
    navigate("/moodfit/login", {
      state: {
        from: `/moodfit/detail/${product.id}`,
      },
    });
    return;
  }

  if (product.inventory <= 0) {
    alert("품절된 상품입니다.");
    return;
  }

  /*
   * 결제페이지에 필요한 상품 정보를 상세페이지에서 직접 전달합니다.
   * 새 결제 진입마다 새로운 checkoutId가 생성되므로
   * 이전에 결제하지 않은 상품 정보와 섞이지 않습니다.
   */
  const checkoutData = {
    checkoutId: crypto.randomUUID(),
    checkoutType: "direct",
    returnPath: `/moodfit/detail/${product.id}`,
    checkoutItems: [
      {
        source: "direct",
        cartItemId: null,
        productId: product.id,
        name: product.name,
        image: mainImage,
        price: Number(salePrice),
        quantity: Number(quantity),
        inventory: Number(product.inventory ?? 0),
        selectedSize: size,
        selectedColor: "기본",
      },
    ],
  };

  navigate("/moodfit/payment", {
    state: checkoutData,
  });
};

  if (loading) {
    return (
      <main className="detail-page">
        <p className="detail-status">
          상품 정보를 불러오는 중입니다.
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="detail-page">
        <div className="detail-status detail-error">
          <p>{error}</p>

          <button
            type="button"
            onClick={() => navigate(-1)}
          >
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
          <img
            src={mainImage}
            alt={
              product.name ||
              "상품 이미지"
            }
            onError={(event) => {
              event.currentTarget.src =
                "/images/product-placeholder.png";
            }}
          />
        </div>

        <div className="detail-info">
          <span className="detail-category">
            {product.category}
          </span>

          {product.brand && (
            <p className="detail-brand">
              {product.brand}
            </p>
          )}

          <h1>{product.name}</h1>

          <div className="detail-rating">
            평점{" "}
            {product.average_rating.toFixed(
              1
            )}
            {" · "}
            좋아요 {likeCount}
          </div>

          {product.original_price >
            salePrice && (
              <div className="detail-original-price">
                {product.original_price.toLocaleString()}
                원
              </div>
            )}

          <div className="detail-price">
            {salePrice.toLocaleString()}원
          </div>

          <div className="detail-option">
            <label>사이즈</label>

            <div className="size-buttons">
              {["S", "M", "L", "XL"].map(
                (itemSize) => (
                  <button
                    type="button"
                    key={itemSize}
                    className={
                      size === itemSize
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setSize(itemSize)
                    }
                  >
                    {itemSize}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="detail-option">
            <label htmlFor="product-quantity">
              수량
            </label>

            <select
              id="product-quantity"
              value={quantity}
              disabled={
                cartLoading || product.inventory <= 0
              }
              onChange={(event) =>
                setQuantity(
                  Number(
                    event.target.value
                  )
                )
              }
            >
              {Array.from(
                {
                  length: maxQuantity,
                },
                (_, index) => index + 1
              ).map((count) => (
                <option
                  key={count}
                  value={count}
                >
                  {count}개
                </option>
              ))}
            </select>

            <span className="detail-inventory">
              {product.inventory > 0
                ? `재고 ${product.inventory}개`
                : "품절"}
            </span>
          </div>

          <div className="detail-buttons">
            <button
              type="button"
              className="cart-btn"
              onClick={handleAddCart}
              disabled={
                cartLoading || product.inventory <= 0
              }
            >
              <ShoppingCart size={20} />
              장바구니
            </button>

            <button
              type="button"
              className="buy-btn"
              onClick={handleBuyNow}
              disabled={
                cartLoading || product.inventory <= 0
              }
            >
              바로 구매
            </button>

            <button
              type="button"
              className={`like-btn ${liked ? "active" : ""}`}
              aria-label="좋아요"
              onClick={handleLike}
              disabled={likeLoading}
            >
              <Heart
                size={22}
                fill={liked ? "currentColor" : "none"}
              />
            </button>
          </div>

          <div className="detail-benefits">
            <div>
              <Truck size={20} />
              무료배송
            </div>

            <div>
              <ShieldCheck size={20} />
              안전결제
            </div>

            <div>
              <RotateCcw size={20} />
              7일 교환/반품
            </div>
          </div>
        </div>
      </section>

      <section className="detail-additional">
        <div className="detail-tabs">
          <button
            type="button"
            className={`detail-tab ${tab === "desc"
              ? "active"
              : ""
              }`}
            onClick={() =>
              setTab("desc")
            }
          >
            상품 설명
          </button>

          <button
            type="button"
            className={`detail-tab ${tab === "review"
              ? "active"
              : ""
              }`}
            onClick={() =>
              setTab("review")
            }
          >
            상품 후기
          </button>

          <button
            type="button"
            className={`detail-tab ${tab === "qna"
              ? "active"
              : ""
              }`}
            onClick={() =>
              setTab("qna")
            }
          >
            상품 Q&amp;A
          </button>
        </div>

        <div className="detail-tab-contents">
          {tab === "desc" && (
            <ProductDescription
              product={product}
            />
          )}

          {tab === "review" && (
            <ProductReview
              productId={product.id}
              userId={user?.id}
              onRatingChange={handleRatingChange}
            />
          )}

          {tab === "qna" && (
            <ProductQna
              productId={product.id}
              userId={user?.id}
            />
          )}
        </div>
      </section>
    </main>
  );
};

export default DetailPage;