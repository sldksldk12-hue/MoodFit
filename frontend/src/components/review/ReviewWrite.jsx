import { useEffect, useState } from "react";
import RatingStars from "./RatingStars";
import "../../assets/styles/review/ReviewWrite.css";

const ReviewWrite = ({
  userId,
  productId,
  initialOrderItemId = "",
  submitting = false,
  onSubmit,
  onCancel,
}) => {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [orderItemId, setOrderItemId] =
    useState(initialOrderItemId);
  const [imageUrl, setImageUrl] =
    useState("");

  useEffect(() => {
    setOrderItemId(initialOrderItemId || "");
  }, [initialOrderItemId]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!userId || !productId) {
      alert("로그인과 상품 정보가 필요합니다.");
      return;
    }

    if (
      !orderItemId ||
      Number(orderItemId) <= 0
    ) {
      alert(
        "구매 이력을 확인할 수 없습니다."
      );
      return;
    }

    if (!content.trim()) {
      alert("리뷰 내용을 입력해주세요.");
      return;
    }

    const success = await onSubmit?.({
      userId,
      productId,
      orderItemId,
      rating,
      content,
      imageUrl,
    });

    if (success) {
      setRating(5);
      setContent("");
      setImageUrl("");
    }
  };

  return (
    <form
      className="review-write"
      onSubmit={handleSubmit}
    >
      <div className="review-write-heading">
        <div>
          <span>WRITE A REVIEW</span>
          <h3>리뷰 작성</h3>
        </div>

        <p>
          구매한 상품에 대한 경험을
          남겨주세요.
        </p>
      </div>

      <div className="review-field">
        <label>별점</label>
        <RatingStars
          rating={rating}
          onChange={setRating}
        />
      </div>

      <div className="review-purchase-confirmed">
        구매 이력이 확인되었습니다.
      </div>

      <div className="review-field">
        <label htmlFor="review-content">
          리뷰 내용
        </label>

        <textarea
          id="review-content"
          className="review-textarea"
          value={content}
          onChange={(event) =>
            setContent(event.target.value)
          }
          placeholder="상품은 어떠셨나요?"
          maxLength={1000}
          disabled={submitting}
        />

        <span className="review-character-count">
          {content.length}/1000
        </span>
      </div>

      <div className="review-field">
        <label htmlFor="review-image-url">
          이미지 URL
          <small> 선택사항</small>
        </label>

        <input
          id="review-image-url"
          type="url"
          value={imageUrl}
          onChange={(event) =>
            setImageUrl(event.target.value)
          }
          placeholder="https://example.com/image.jpg"
          disabled={submitting}
        />
      </div>

      <div className="review-write-actions">
        <button
          type="button"
          className="review-cancel-btn"
          onClick={onCancel}
          disabled={submitting}
        >
          취소
        </button>

        <button
          type="submit"
          className="review-submit-btn"
          disabled={submitting}
        >
          {submitting
            ? "등록 중..."
            : "리뷰 등록"}
        </button>
      </div>
    </form>
  );
};

export default ReviewWrite;
