import { Star } from "lucide-react";
import MyPageEmptyState from "./MyPageEmptyState";

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("ko-KR");
};

const normalizeReview = (review) => ({
  id: review.id ?? review.review_id,
  productId:
    review.product_id ?? review.productId,
  productName:
    review.product_name ??
    review.productName ??
    "상품 정보",
  brand: review.brand ?? "",
  rating: Number(review.rating ?? 0),
  content: review.content ?? "",
  imageUrl:
    review.image_url ?? review.imageUrl ?? null,
  createdAt:
    review.created_at ?? review.createdAt,
});

const MyReviewList = ({
  reviews = [],
  onNavigate,
}) => {
  const normalizedReviews =
    reviews.map(normalizeReview);

  if (!normalizedReviews.length) {
    return (
      <MyPageEmptyState
        title="작성한 리뷰가 없습니다."
        description="구매한 상품의 경험을 공유해보세요."
      />
    );
  }

  return (
    <div className="mypage-list">
      {normalizedReviews.map((review) => (
        <article
          className="mypage-list-card"
          key={review.id}
        >
          <div className="mypage-list-main">
            <span className="mypage-list-category">
              상품 리뷰
            </span>

            {review.brand && (
              <span className="mypage-review-brand">
                {review.brand}
              </span>
            )}

            <button
              type="button"
              className="mypage-list-title"
              onClick={() =>
                onNavigate(
                  `/moodfit/detail/${review.productId}`
                )
              }
            >
              {review.productName}
            </button>

            <div
              className="mypage-rating"
              aria-label={`${review.rating}점`}
            >
              {Array.from({
                length: 5,
              }).map((_, index) => (
                <Star
                  key={index}
                  size={15}
                  fill={
                    index < review.rating
                      ? "currentColor"
                      : "none"
                  }
                />
              ))}
            </div>

            <p>{review.content}</p>

            {review.imageUrl && (
              <img
                className="mypage-review-image"
                src={review.imageUrl}
                alt="내 리뷰 첨부 이미지"
              />
            )}
          </div>

          <div className="mypage-list-side">
            <time>
              {formatDate(review.createdAt)}
            </time>

            <button
              type="button"
              onClick={() =>
                onNavigate(
                  `/moodfit/detail/${review.productId}`
                )
              }
            >
              상품 보기
            </button>
          </div>
        </article>
      ))}
    </div>
  );
};

export default MyReviewList;
