import {
  useEffect,
  useState,
} from "react";
import { ChevronRight } from "lucide-react";

import RecentProductList from "./RecentProductList";
import MyReviewList from "./MyReviewList";
import MyInquiryList from "./MyInquiryList";

const MyPageActivity = ({
  recentProducts = [],
  recentLoading = false,
  reviews = [],
  reviewLoading = false,
  inquiries = [],
  onNavigate,
}) => {
  const [activeTab, setActiveTab] =
    useState("recent");

  /*
   * 상단의 '내 리뷰' 요약 카드를 누르면
   * 별도 페이지로 이동하지 않고 나의 활동 영역의
   * 리뷰 탭을 열도록 이벤트를 수신합니다.
   */
  useEffect(() => {
    const handleTabChange = (event) => {
      const nextTab = event.detail?.tab;

      if (
        ["recent", "reviews", "inquiries"].includes(
          nextTab
        )
      ) {
        setActiveTab(nextTab);
      }
    };

    window.addEventListener(
      "mypage-tab-change",
      handleTabChange
    );

    return () => {
      window.removeEventListener(
        "mypage-tab-change",
        handleTabChange
      );
    };
  }, []);

  const hasMoreRecentProducts =
    recentProducts.length > 4;

  return (
    <section className="mypage-section mypage-activity">
      <div className="mypage-section-heading">
        <div>
          <p>MY ACTIVITY</p>
          <h2>나의 활동</h2>
        </div>

        {activeTab === "recent" &&
          hasMoreRecentProducts && (
            <button
              type="button"
              className="mypage-view-all-button"
              onClick={() =>
                onNavigate("/moodfit/history")
              }
            >
              전체보기
              <ChevronRight size={18} />
            </button>
          )}
      </div>

      <div className="mypage-tabs">
        <button
          type="button"
          className={`mypage-tab ${
            activeTab === "recent"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setActiveTab("recent")
          }
        >
          최근 본 상품
        </button>

        <button
          type="button"
          className={`mypage-tab ${
            activeTab === "reviews"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setActiveTab("reviews")
          }
        >
          나의 리뷰
        </button>

        <button
          type="button"
          className={`mypage-tab ${
            activeTab === "inquiries"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setActiveTab("inquiries")
          }
        >
          나의 문의
        </button>
      </div>

      <div className="mypage-tab-content">
        {activeTab === "recent" &&
          (recentLoading ? (
            <div className="mypage-loading">
              최근 본 상품을 불러오는 중입니다.
            </div>
          ) : (
            <RecentProductList
              products={recentProducts}
              limit={4}
              onNavigate={onNavigate}
            />
          ))}

        {activeTab === "reviews" &&
          (reviewLoading ? (
            <div className="mypage-loading">
              내가 작성한 리뷰를 불러오는
              중입니다.
            </div>
          ) : (
            <MyReviewList
              reviews={reviews}
              onNavigate={onNavigate}
            />
          ))}

        {activeTab === "inquiries" && (
          <MyInquiryList
            inquiries={inquiries}
            onNavigate={onNavigate}
          />
        )}
      </div>
    </section>
  );
};

export default MyPageActivity;
