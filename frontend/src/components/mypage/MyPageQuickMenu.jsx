import {
  ChevronRight,
  MapPin,
  Package,
  Settings,
  Sparkles,
} from "lucide-react";

const menuItems = [
  {
    label: "주문내역",
    description: "주문 및 배송 상태를 확인합니다.",
    icon: Package,
    path: "/moodfit/orders",
  },
  {
    label: "배송지 관리",
    description: "기본 배송지와 추가 배송지를 관리합니다.",
    icon: MapPin,
    path: "/moodfit/address",
  },
  {
    label: "취향 관리",
    description: "AI 추천에 사용되는 취향을 수정합니다.",
    icon: Sparkles,
    path: "/moodfit/preference",
  },
  {
    label: "회원정보 수정",
    description: "이름, 이메일 등 회원정보를 수정합니다.",
    icon: Settings,
    path: "/moodfit/profile/edit",
  },
];

const MyPageQuickMenu = ({ onNavigate }) => {
  return (
    <section className="mypage-section">
      <div className="mypage-section-heading">
        <div>
          <p>QUICK MENU</p>
          <h2>빠른 메뉴</h2>
        </div>
      </div>

      <div className="mypage-menu-grid">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              type="button"
              className="mypage-menu-card"
              key={item.label}
              onClick={() => onNavigate(item.path)}
            >
              <span className="mypage-menu-icon">
                <Icon size={22} />
              </span>

              <span className="mypage-menu-content">
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>

              <ChevronRight size={19} />
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default MyPageQuickMenu;
