import { Star } from "lucide-react";

const RatingStars = ({ rating = 0, onChange, size = 28, readonly = false }) => {
  return (
    <div className="rating-box" aria-label={`${rating}점`}> 
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          className={`rating-star ${value <= rating ? "active" : ""}`}
          onClick={() => !readonly && onChange?.(value)}
          disabled={readonly}
          aria-label={`${value}점`}
        >
          <Star
            size={size}
            fill={value <= rating ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  );
};

export default RatingStars;
