import { Star } from "lucide-react";

const RatingStars = ({ rating, setRating }) => {
    return (
        <div className="rating-box">
            {[1, 2, 3, 4, 5].map(num => (
                <Star
                    key={num}
                    size={32}
                    className={num <= rating ? "star active" : "star"}
                    onClick={() => setRating(num)}
                />
            ))}
        </div>
    );
};

export default RatingStars;