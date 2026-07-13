import { Star, Camera, MessageSquare, ThumbsUp } from "lucide-react";
import "../assets/styles/ProductReview.css";
import ReviewWrite from "./ReviewWrite";
import { useState } from "react";
import Reviews from "./Reviews";

const ProductReview = () => {
    const saveReview = (reviewData) => {
        console.log(reviewData);
    };
    const [isWriteOpen, setIsWriteOpen] = useState(false);


    return (
        <main className="review-page">
            <section className="review-header">
                <div>
                    <h1>상품 리뷰</h1>
                    <p>구매자들의 생생한 후기를 확인해보세요.</p>
                </div>

                <button className="review-write-btn" onClick={() => setIsWriteOpen(true)}>

                    <MessageSquare size={20} />
                    리뷰 작성
                </button>
            </section>
            
            {isWriteOpen && (
                <ReviewWrite
                    onSubmit={(data) => {
                        console.log(data);

                        setIsWriteOpen(false);
                    }}
                />
            ) || <Reviews />}

        </main>
    );
};

export default ProductReview;