import MyPageEmptyState from "./MyPageEmptyState";

const MyInquiryList = ({ inquiries, onNavigate }) => {
  if (!inquiries.length) {
    return (
      <MyPageEmptyState
        title="작성한 문의가 없습니다."
        description="상품에 궁금한 점이 있다면 문의를 남겨보세요."
      />
    );
  }

  return (
    <div className="mypage-list">
      {inquiries.map((inquiry) => (
        <article className="mypage-list-card" key={inquiry.id}>
          <div className="mypage-list-main">
            <span
              className={
                inquiry.status === "답변완료"
                  ? "inquiry-status answered"
                  : "inquiry-status waiting"
              }
            >
              {inquiry.status}
            </span>

            <button
              type="button"
              className="mypage-list-title"
              onClick={() =>
                onNavigate(`/moodfit/detail/${inquiry.productId}`)
              }
            >
              {inquiry.productName}
            </button>

            <p>{inquiry.title}</p>
          </div>

          <div className="mypage-list-side">
            <time>{inquiry.createdAt}</time>
            <button type="button">보기</button>
          </div>
        </article>
      ))}
    </div>
  );
};

export default MyInquiryList;
