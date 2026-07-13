import { Camera, Star, ThumbsUp } from 'lucide-react';
import React from 'react';

const Reviews = () => {
        const reviews = [
        {
            id: 1,
            user: "사용자1",
            product: "오버핏 블랙 후드티",
            rating: 5,
            content: "핏이 넉넉하고 편해서 데일리로 입기 좋아요.",
            date: "2026.07.12",
        },
        {
            id: 2,
            user: "사용자2",
            product: "와이드 데님 팬츠",
            rating: 4,
            content: "기장이 적당하고 후드티랑 잘 어울립니다.",
            date: "2026.07.10",
        },
    ];
    return (
        <div>
            
            <section className="review-summary">
                <div className="review-score">
                    <strong>4.8</strong>
                    <div>
                        {[1, 2, 3, 4, 5].map(num => (
                            <Star key={num} size={22} fill="#facc15" color="#facc15" />
                        ))}
                    </div>
                    <p>총 128개의 리뷰</p>
                </div>

                <div className="review-stats">
                    <div><span>5점</span><progress value="85" max="100" /></div>
                    <div><span>4점</span><progress value="10" max="100" /></div>
                    <div><span>3점</span><progress value="3" max="100" /></div>
                    <div><span>2점</span><progress value="1" max="100" /></div>
                    <div><span>1점</span><progress value="1" max="100" /></div>
                </div>
            </section>

            <section className="review-list">
                {reviews.map(review => (
                    <article className="review-card" key={review.id}>
                        <div className="review-top">
                            <div>
                                <h3>{review.product}</h3>
                                <p>{review.user} · {review.date}</p>
                            </div>

                            <div className="review-stars">
                                {[1, 2, 3, 4, 5].map(num => (
                                    <Star
                                        key={num}
                                        size={18}
                                        fill={num <= review.rating ? "#facc15" : "none"}
                                        color="#facc15"
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="review-image-box">
                            <Camera size={34} />
                            <span>리뷰 이미지</span>
                        </div>

                        <p className="review-content">{review.content}</p>

                        <button className="review-like-btn">
                            <ThumbsUp size={17} />
                            도움돼요
                        </button>
                    </article>
                ))}
            </section>
        </div>
    );
};

export default Reviews;