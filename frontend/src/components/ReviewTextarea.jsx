const ReviewTextarea = ({ content, setContent }) => {
    return (
        <textarea
            className="review-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="상품은 어떠셨나요?"
        />
    );
};

export default ReviewTextarea;