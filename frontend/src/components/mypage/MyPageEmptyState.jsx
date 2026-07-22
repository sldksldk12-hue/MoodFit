const MyPageEmptyState = ({ title, description }) => {
  return (
    <div className="mypage-empty-state">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
};

export default MyPageEmptyState;
