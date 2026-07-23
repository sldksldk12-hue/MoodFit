


import { useCallback, useEffect, useMemo, useState } from "react";
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
  orderItemId: review.order_item_id ?? review.orderItemId,
  rating: Number(review.rating ?? 0),
  content: review.content ?? "",
  imageUrl: Array.isArray(review.image_url)
    ? review.image_url[0] ?? null
    : review.image_url ?? review.imageUrl ?? null,
  userName:
    review.user_name ??
    review.username ??
    review.writer_name ??
    "구매자",
  createdAt: review.created_at ?? review.createdAt ?? null,
});

const ProductReview = ({ productId, userId }) => {
  /*
   * 요청 결과와 그 결과가 어느 productId/userId에 해당하는지
   * 함께 저장합니다. 이렇게 하면 useEffect 시작과 동시에
   * setState를 호출하지 않아도 로딩 상태를 계산할 수 있습니다.
   */
  const [reviewResult, setReviewResult] = useState({
    productId: null,
    reviews: [],
    error: "",
  });

  const [orderResult, setOrderResult] = useState({
    userId: null,
    orders: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [showWriteForm, setShowWriteForm] = useState(false);

  const normalizedProductId = productId == null ? null : String(productId);
  const normalizedUserId = userId == null ? null : String(userId);

  /* 현재 productId에 해당하는 리뷰만 화면에 사용합니다. */
  const reviews = useMemo(() => {
    if (
      !normalizedProductId ||
      reviewResult.productId !== normalizedProductId
    ) {
      return [];
    }

    return reviewResult.reviews;
  }, [normalizedProductId, reviewResult]);

  /* 현재 userId에 해당하는 주문만 화면에 사용합니다. */
  const orders = useMemo(() => {
    if (!normalizedUserId || orderResult.userId !== normalizedUserId) {
      return [];
    }

    return orderResult.orders;
  }, [normalizedUserId, orderResult]);

  /*
   * 요청한 ID와 저장된 결과의 ID가 다르면 아직 새 데이터를
   * 받지 못한 상태이므로 로딩 중으로 판단합니다.
   */
  const reviewLoading = Boolean(
    normalizedProductId &&
      reviewResult.productId !== normalizedProductId
  );

  const purchaseLoading = Boolean(
    normalizedUserId && orderResult.userId !== normalizedUserId
  );

  const error =
    reviewResult.productId === normalizedProductId
      ? reviewResult.error
      : "";

  /* 리뷰를 다시 불러오는 공통 함수입니다. */
  const refreshReviews = useCallback(async () => {
    if (!normalizedProductId) return [];

    const data = await getProductReviews(productId);
    const normalizedReviews = Array.isArray(data)
      ? data.map(normalizeReview)
      : [];

    setReviewResult({
      productId: normalizedProductId,
      reviews: normalizedReviews,
      error: "",
    });

    return normalizedReviews;
  }, [normalizedProductId, productId]);

  /* 상품이 바뀌면 해당 상품의 리뷰를 조회합니다. */
  useEffect(() => {
    if (!normalizedProductId) return undefined;

    let cancelled = false;

    const loadReviews = async () => {
      try {
        const data = await getProductReviews(productId);
        if (cancelled) return;

        setReviewResult({
          productId: normalizedProductId,
          reviews: Array.isArray(data)
            ? data.map(normalizeReview)
            : [],
          error: "",
        });
      } catch (requestError) {
        console.error("상품 리뷰 조회 실패:", requestError);
        if (cancelled) return;

        setReviewResult({
          productId: normalizedProductId,
          reviews: [],
          error:
            requestError.response?.data?.detail ||
            "리뷰를 불러오지 못했습니다.",
        });
      }
    };

    loadReviews();

    return () => {
      cancelled = true;
    };
  }, [normalizedProductId, productId]);

  /* 로그인한 사용자의 주문 내역을 조회합니다. */
  useEffect(() => {
    if (!normalizedUserId) return undefined;

    let cancelled = false;

    const loadOrders = async () => {
      try {
        const data = await getUserOrders(userId);
        if (cancelled) return;

        setOrderResult({
          userId: normalizedUserId,
          orders: Array.isArray(data) ? data : [],
        });
      } catch (requestError) {
        console.error("리뷰 구매 이력 조회 실패:", requestError);
        if (cancelled) return;

        setOrderResult({
          userId: normalizedUserId,
          orders: [],
        });
      }
    };

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [normalizedUserId, userId]);

  /*
   * 현재 상품을 구매한 주문 상품 중
   * 아직 리뷰를 작성하지 않은 첫 번째 항목을 찾습니다.
   */
  const reviewableOrderItem = useMemo(() => {
    const purchasedItems = orders.flatMap((order) =>
      Array.isArray(order.items) ? order.items : []
    );

    return (
      purchasedItems.find((item) => {
        const itemProductId = item.product_id ?? item.productId;
        const itemId = item.order_item_id ?? item.id;

        if (Number(itemProductId) !== Number(productId)) {
          return false;
        }

        return !reviews.some(
          (review) => Number(review.orderItemId) === Number(itemId)
        );
      }) ?? null
    );
  }, [orders, productId, reviews]);

  const hasPurchasedProduct = useMemo(
    () =>
      orders.some((order) =>
        (order.items ?? []).some(
          (item) =>
            Number(item.product_id ?? item.productId) ===
            Number(productId)
        )
      ),
    [orders, productId]
  );

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;

    return (
      reviews.reduce(
        (sum, review) => sum + Number(review.rating),
        0
      ) / reviews.length
    );
  }, [reviews]);

  const handleOpenReviewWrite = () => {
    if (!userId) {
      alert("로그인 후 리뷰를 작성할 수 있습니다.");
      return;
    }

    if (purchaseLoading) {
      alert("구매 이력을 확인하고 있습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    if (!hasPurchasedProduct) {
      alert("해당 상품의 구매 이력이 있어야 리뷰를 작성할 수 있습니다.");
      return;
    }

    if (!reviewableOrderItem) {
      alert("이미 이 구매 건에 대한 리뷰를 작성했습니다.");
      return;
    }

    setShowWriteForm(true);
  };

  const handleSubmitReview = async (reviewData) => {
    try {
      setSubmitting(true);

      await createReview(reviewData);
      await refreshReviews();

      setShowWriteForm(false);
      alert("리뷰가 등록되었습니다.");
      return true;
    } catch (requestError) {
      console.error("리뷰 작성 실패:", requestError);

      const detail = requestError.response?.data?.detail;

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
          <p className="product-review-eyebrow">PRODUCT REVIEWS</p>
          <h2>상품 후기</h2>
          <span>구매한 고객이 작성한 리뷰입니다.</span>
        </div>

        <button
          type="button"
          className="review-write-button"
          onClick={handleOpenReviewWrite}
          disabled={purchaseLoading}
        >
          {purchaseLoading ? "구매 이력 확인 중" : "리뷰 작성"}
        </button>
      </div>

      <div className="product-review-summary">
        <div>
          <strong>{averageRating.toFixed(1)}</strong>
          <span>/ 5.0</span>
        </div>

        <div className="product-review-summary-stars">
          {Array.from({ length: 5 }).map((_, index) => (
            <span
              key={index}
              className={
                index < Math.round(averageRating) ? "active" : ""
              }
            >
              ★
            </span>
          ))}
        </div>

        <p>
          총 <strong>{reviews.length}</strong>개의 리뷰
        </p>
      </div>

      {showWriteForm && reviewableOrderItem && (
        <ReviewWrite
          key={`review-write-${
            reviewableOrderItem.order_item_id ?? reviewableOrderItem.id
          }`}
          userId={userId}
          productId={productId}
          initialOrderItemId={
            reviewableOrderItem.order_item_id ?? reviewableOrderItem.id
          }
          submitting={submitting}
          onSubmit={handleSubmitReview}
          onCancel={() => setShowWriteForm(false)}
        />
      )}

      {error && <div className="review-status error">{error}</div>}

      {reviewLoading ? (
        <div className="review-status">리뷰를 불러오는 중입니다.</div>
      ) : reviews.length === 0 ? (
        <div className="review-status">아직 작성된 리뷰가 없습니다.</div>
      ) : (
        <div className="product-review-list">
          {reviews.map((review) => (
            <article className="product-review-card" key={review.id}>
              <div className="product-review-card-top">
                <div>
                  <strong>{review.userName}</strong>
                  <div className="review-stars">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span
                        key={index}
                        className={index < review.rating ? "active" : ""}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                <time>
                  {review.createdAt
                    ? new Date(review.createdAt).toLocaleDateString("ko-KR")
                    : ""}
                </time>
              </div>

              <p className="review-content">{review.content}</p>

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