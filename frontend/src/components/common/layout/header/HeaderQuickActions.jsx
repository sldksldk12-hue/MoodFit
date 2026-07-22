import { Heart } from "lucide-react";

const HeaderQuickActions = ({ onMovePage }) => {
  return (
    <button
      type="button"
      className="icon-button"
      aria-label="마이페이지"
      onClick={() => onMovePage("/moodfit/mypage")}
    >
      <Heart size={21} />
    </button>
  );
};

export default HeaderQuickActions;
