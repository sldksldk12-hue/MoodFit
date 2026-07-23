import {
  Heart,
  MessageCircleQuestion,
  ShoppingCart,
  Star,
} from "lucide-react";

const summaryItems = [
  {
    key: "cartCount",
    label: "장바구니",
    icon: ShoppingCart,
    path: "/moodfit/cart",
  },
  {
    key: "likeCount",
    label: "찜한 상품",
    icon: Heart,
    path: "/moodfit/wishlist",
  },
  {
    key: "reviewCount",
    label: "내 리뷰",
    icon: Star,
    tab: "reviews",
  },
  {
    key: "inquiryCount",
    label: "내 문의",
    icon: MessageCircleQuestion,
    tab: "inquiries",
  },
];

const MyPageSummary = ({ summary, onNavigate }) => {
  const handleClick = (item) => {
    if (item.path) {
      onNavigate(item.path);
      return;
    }

    window.dispatchEvent(
      new CustomEvent("mypage-tab-change", {
        detail: { tab: item.tab },
      })
    );

    document.querySelector(".mypage-activity")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section className="mypage-summary-grid" aria-label="마이페이지 요약">
      {summaryItems.map((item) => {
        const Icon = item.icon;

        return (
          <button
            type="button"
            className="mypage-summary-card"
            key={item.key}
            onClick={() => handleClick(item)}
          >
            <span className="mypage-summary-icon">
              <Icon size={21} />
            </span>
            <strong>{summary[item.key] ?? 0}</strong>
            <span>{item.label}</span>
          </button>
        );
      })}
    </section>
  );
};

export default MyPageSummary;
