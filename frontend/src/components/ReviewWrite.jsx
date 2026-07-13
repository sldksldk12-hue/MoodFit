import { useState } from "react";
import RatingStars from "./RatingStars";
import ReviewTextarea from "./ReviewTextarea";
import ReviewImageUpload from "./ReviewImageUpload";
import "../assets/styles/ReviewWrite.css";

const ReviewWrite = ({ onSubmit }) => {
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState("");
    const [image, setImage] = useState(null);

    const submitReview = (e) => {
        e.preventDefault();

        if (content.trim() === "") {
            alert("리뷰를 작성해주세요.");
            return;
        }

        const reviewData = {
            rating,
            content,
            image,
        };

        onSubmit?.(reviewData);

        alert("리뷰가 등록되었습니다.");
    };

    return (
        <form className="review-write" onSubmit={submitReview}>
            <h2>리뷰 작성</h2>

            <RatingStars
                rating={rating}
                setRating={setRating}
            />

            <ReviewTextarea
                content={content}
                setContent={setContent}
            />

            <ReviewImageUpload
                image={image}
                setImage={setImage}
            />

            <button type="submit" className="review-submit-btn">
                리뷰 등록
            </button>
        </form>
    );
};

export default ReviewWrite;