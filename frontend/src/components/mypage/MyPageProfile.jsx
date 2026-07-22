import { UserRound } from "lucide-react";

const MyPageProfile = ({ user, onNavigate }) => {
  return (
    <section className="mypage-profile-card">
      <div className="mypage-profile-icon">
        <UserRound size={34} />
      </div>

      <div className="mypage-profile-info">
        <p className="mypage-profile-label">반가워요</p>
        <h1>{user?.user_name ?? "회원"}님</h1>
        <p className="mypage-profile-email">{user?.email ?? ""}</p>
      </div>

      <div className="mypage-profile-actions">
        {/* <button
          type="button"
          className="mypage-outline-button"
          onClick={() => onNavigate("/moodfit/profile/edit")}
        >
          회원정보 수정
        </button> */}
      </div>
    </section>
  );
};

export default MyPageProfile;
