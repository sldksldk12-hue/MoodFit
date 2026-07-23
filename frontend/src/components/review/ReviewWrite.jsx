import { useState } from "react";
import RatingStars from "./RatingStars";
import ReviewImageUpload from "./ReviewImageUpload";
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
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState("");

  // initialOrderItemId를 별도 state로 복사하지 않습니다.
  // 따라서 useEffect 안에서 setState를 호출하는 경고가 발생하지 않습니다.
  const orderItemId = initialOrderItemId;

  const handleImageChange = ({ file, previewUrl }) => {
    setImage(file);
    setImageUrl(previewUrl);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!userId || !productId) {
      alert("로그인과 상품 정보가 필요합니다.");
      return;
    }

    if (!orderItemId || Number(orderItemId) <= 0) {
      alert("구매 이력을 확인할 수 없습니다.");
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
      // 현재 백엔드에 별도 파일 업로드 API가 없으므로
      // 선택한 이미지를 Data URL 문자열로 전달합니다.
      imageUrl: imageUrl || null,
    });

    if (success) {
      setRating(5);
      setContent("");
      setImage(null);
      setImageUrl("");
    }
  };

  return (
    <form className="review-write" onSubmit={handleSubmit}>
      <div className="review-write-heading">
        <div>
          <span>WRITE A REVIEW</span>
          <h3>리뷰 작성</h3>
        </div>

        <p>구매한 상품에 대한 경험을 남겨주세요.</p>
      </div>

      <div className="review-field">
        <label>별점</label>
        <RatingStars rating={rating} onChange={setRating} />
      </div>

      <div className="review-purchase-confirmed">
        구매 이력이 확인되었습니다.
      </div>

      <div className="review-field">
        <label htmlFor="review-content">리뷰 내용</label>

        <textarea
          id="review-content"
          className="review-textarea"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="상품은 어떠셨나요?"
          maxLength={1000}
          disabled={submitting}
        />

        <span className="review-character-count">
          {content.length}/1000
        </span>
      </div>

      <div className="review-field">
        <label>
          리뷰 이미지
          <small> 선택사항 · 최대 1MB</small>
        </label>

        <ReviewImageUpload
          image={image}
          previewUrl={imageUrl}
          onChange={handleImageChange}
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
          {submitting ? "등록 중..." : "리뷰 등록"}
        </button>
      </div>
    </form>
  );
};

export default ReviewWrite;