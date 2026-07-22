import { useEffect, useMemo, useState } from "react";
import {
  createReview,
  getProductReviews,
  getUserOrders,
} from "../../services/api";

import ReviewWrite from "../review/ReviewWrite";
import "../../assets/styles/detail/ProductReview.css";

const normalizeReview = (review) => ({
  id: review.id ?? review.review_id,
  userId: review.user_id ?? review.userId,
  productId: review.product_id ?? review.productId,
  orderItemId:
    review.order_item_id ?? review.orderItemId,
  rating: Number(review.rating ?? 0),
  content: review.content ?? "",
  imageUrl: review.image_url ?? review.imageUrl ?? null,
  userName:
    review.user_name ??
    review.username ??
    review.writer_name ??
    "구매자",
  createdAt:
    review.created_at ?? review.createdAt ?? null,
});

const ProductReview = ({ productId, userId }) => {
  const [reviews, setReviews] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviewLoading, setReviewLoading] =
    useState(true);
  const [purchaseLoading, setPurchaseLoading] =
    useState(false);
  const [submitting, setSubmitting] =
    useState(false);
  const [showWriteForm, setShowWriteForm] =
    useState(false);
  const [error, setError] = useState("");

  const fetchReviews = async () => {
    if (!productId) return [];

    const data = await getProductReviews(productId);
    const list = Array.isArray(data) ? data : [];
    const normalized = list.map(normalizeReview);

    setReviews(normalized);
    return normalized;
  };

  useEffect(() => {
    let cancelled = false;

    const loadReviews = async () => {
      try {
        setReviewLoading(true);
        setError("");

        const data =
          await getProductReviews(productId);

        if (cancelled) return;

        const list = Array.isArray(data)
          ? data.map(normalizeReview)
          : [];

        setReviews(list);
      } catch (requestError) {
        console.error(
          "상품 리뷰 조회 실패:",
          requestError
        );

        if (!cancelled) {
          setReviews([]);
          setError(
            requestError.response?.data?.detail ||
              "리뷰를 불러오지 못했습니다."
          );
        }
      } finally {
        if (!cancelled) {
          setReviewLoading(false);
        }
      }
    };

    if (productId) {
      loadReviews();
    }

    return () => {
      cancelled = true;
    };
  }, [productId]);

  /*
   * 로그인한 사용자의 주문을 조회해서
   * 이 상품을 실제로 구매한 order_item_id를 찾습니다.
   */
  useEffect(() => {
    if (!userId) {
      setOrders([]);
      return;
    }

    let cancelled = false;

    const loadOrders = async () => {
      try {
        setPurchaseLoading(true);

        const data = await getUserOrders(userId);

        if (!cancelled) {
          setOrders(
            Array.isArray(data) ? data : []
          );
        }
      } catch (requestError) {
        console.error(
          "리뷰 구매 이력 조회 실패:",
          requestError
        );

        if (!cancelled) {
          setOrders([]);
        }
      } finally {
        if (!cancelled) {
          setPurchaseLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  /*
   * 현재 상품의 구매 이력 중 아직 리뷰를 작성하지 않은
   * 주문 상품을 리뷰 작성 대상으로 선택합니다.
   */
  const reviewableOrderItem = useMemo(() => {
    const purchasedItems = orders.flatMap(
      (order) =>
        Array.isArray(order.items)
          ? order.items
          : []
    );

    return (
      purchasedItems.find((item) => {
        const itemProductId =
          item.product_id ?? item.productId;
        const itemId =
          item.order_item_id ?? item.id;

        if (
          Number(itemProductId) !==
          Number(productId)
        ) {
          return false;
        }

        return !reviews.some(
          (review) =>
            Number(review.orderItemId) ===
            Number(itemId)
        );
      }) ?? null
    );
  }, [orders, productId, reviews]);

  const hasPurchasedProduct = useMemo(
    () =>
      orders.some((order) =>
        (order.items ?? []).some(
          (item) =>
            Number(
              item.product_id ??
                item.productId
            ) === Number(productId)
        )
      ),
    [orders, productId]
  );

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;

    return (
      reviews.reduce(
        (sum, review) =>
          sum + Number(review.rating),
        0
      ) / reviews.length
    );
  }, [reviews]);

  const handleOpenReviewWrite = () => {
    if (!userId) {
      alert(
        "로그인 후 리뷰를 작성할 수 있습니다."
      );
      return;
    }

    if (purchaseLoading) {
      alert(
        "구매 이력을 확인하고 있습니다. 잠시 후 다시 시도해주세요."
      );
      return;
    }

    if (!hasPurchasedProduct) {
      alert(
        "해당 상품의 구매 이력이 있어야 리뷰를 작성할 수 있습니다."
      );
      return;
    }

    if (!reviewableOrderItem) {
      alert(
        "이미 이 구매 건에 대한 리뷰를 작성했습니다."
      );
      return;
    }

    setShowWriteForm(true);
  };

  const handleSubmitReview = async (
    reviewData
  ) => {
    try {
      setSubmitting(true);

      await createReview(reviewData);

      await fetchReviews();
      setShowWriteForm(false);

      alert("리뷰가 등록되었습니다.");
      return true;
    } catch (requestError) {
      console.error(
        "리뷰 작성 실패:",
        requestError
      );

      const detail =
        requestError.response?.data?.detail;

      alert(
        typeof detail === "string"
          ? detail
          : "리뷰 등록 중 오류가 발생했습니다."
      );

      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="product-review">
      <div className="product-review-header">
        <div>
          <p className="product-review-eyebrow">
            PRODUCT REVIEWS
          </p>
          <h2>상품 후기</h2>
          <span>
            구매한 고객이 작성한 리뷰입니다.
          </span>
        </div>

        <button
          type="button"
          className="review-write-button"
          onClick={handleOpenReviewWrite}
          disabled={purchaseLoading}
        >
          {purchaseLoading
            ? "구매 이력 확인 중"
            : "리뷰 작성"}
        </button>
      </div>

      <div className="product-review-summary">
        <div>
          <strong>
            {averageRating.toFixed(1)}
          </strong>
          <span>/ 5.0</span>
        </div>

        <div className="product-review-summary-stars">
          {Array.from({ length: 5 }).map(
            (_, index) => (
              <span
                key={index}
                className={
                  index <
                  Math.round(averageRating)
                    ? "active"
                    : ""
                }
              >
                ★
              </span>
            )
          )}
        </div>

        <p>
          총 <strong>{reviews.length}</strong>개의
          리뷰
        </p>
      </div>

      {showWriteForm &&
        reviewableOrderItem && (
          <ReviewWrite
            userId={userId}
            productId={productId}
            initialOrderItemId={
              reviewableOrderItem.order_item_id ??
              reviewableOrderItem.id
            }
            submitting={submitting}
            onSubmit={handleSubmitReview}
            onCancel={() =>
              setShowWriteForm(false)
            }
          />
        )}

      {error && (
        <div className="review-status error">
          {error}
        </div>
      )}

      {reviewLoading ? (
        <div className="review-status">
          리뷰를 불러오는 중입니다.
        </div>
      ) : reviews.length === 0 ? (
        <div className="review-status">
          아직 작성된 리뷰가 없습니다.
        </div>
      ) : (
        <div className="product-review-list">
          {reviews.map((review) => (
            <article
              className="product-review-card"
              key={review.id}
            >
              <div className="product-review-card-top">
                <div>
                  <strong>
                    {review.userName}
                  </strong>
                  <div className="review-stars">
                    {Array.from({
                      length: 5,
                    }).map((_, index) => (
                      <span
                        key={index}
                        className={
                          index <
                          review.rating
                            ? "active"
                            : ""
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                <time>
                  {review.createdAt
                    ? new Date(
                        review.createdAt
                      ).toLocaleDateString(
                        "ko-KR"
                      )
                    : ""}
                </time>
              </div>

              <p className="review-content">
                {review.content}
              </p>

              {review.imageUrl && (
                <img
                  className="product-review-image"
                  src={review.imageUrl}
                  alt="리뷰 첨부 이미지"
                />
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductReview;
