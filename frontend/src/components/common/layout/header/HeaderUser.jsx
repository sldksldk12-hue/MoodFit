import { User } from "lucide-react";

const HeaderUser = ({ isLogin, userName, onLogout, onMovePage }) => {
  const handleUserNameClick = () => {
    if (userName === "admin1") {
      onMovePage("/moodfit/admin");
    }
  };

  if (!isLogin) {
    return (
      <button
        type="button"
        className="icon-button"
        aria-label="로그인"
        onClick={() => onMovePage("/moodfit/login")}
      >
        <User size={21} />
      </button>
    );
  }

  return (
    <div className="user-menu">
      <button
        type="button"
        className="user-name"
        onClick={handleUserNameClick}
      >
        <User size={18} />
        {userName}님
      </button>

      <button type="button" className="logout-btn" onClick={onLogout}>
        로그아웃
      </button>
    </div>
  );
};

export default HeaderUser;
