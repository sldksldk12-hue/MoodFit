import {
    useEffect,
    useMemo,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../store/AuthContext";

import {
    getCartItems,
    getUserLikes,
    getProductHistory,
    getUserReviews,
} from "../services";

import MyPageProfile from "../components/mypage/MyPageProfile";
import MyPageSummary from "../components/mypage/MyPageSummary";
import MyPageQuickMenu from "../components/mypage/MyPageQuickMenu";
import MyPageActivity from "../components/mypage/MyPageActivity";

import "../assets/styles/pages/mypage/MyPage.css";

const MyPage = () => {
    const navigate = useNavigate();

    const { user } = useAuth();

    // user 객체 전체를 의존성에 넣지 않고
    // 실제 API 호출에 필요한 사용자 ID만 분리합니다.
    const userId = user?.id;

    const [recentProducts, setRecentProducts] = useState([]);
    const [recentLoading, setRecentLoading] = useState(false);

    const [summary, setSummary] = useState({
        cartCount: 0,
        likeCount: 0,
        reviewCount: 0,
        inquiryCount: 0,
    });

    /*
     * TODO
     * 리뷰 API가 완성되면 실제 리뷰 데이터로 교체합니다.
     */
    const [reviews, setReviews] = useState([]);
    const [reviewLoading, setReviewLoading] =
        useState(false);
    /*
     * TODO
     * 문의 API가 완성되면 실제 문의 데이터로 교체합니다.
     */
    const inquiries = useMemo(
        () => [
            {
                id: 1,
                productId: 103,
                productName: "리넨 오버 셔츠",
                title: "재입고 예정이 있나요?",
                status: "답변완료",
                createdAt: "2026.07.19",
            },
            {
                id: 2,
                productId: 104,
                productName: "베이직 러닝 스니커즈",
                title: "사이즈 교환 문의드립니다.",
                status: "답변대기",
                createdAt: "2026.07.17",
            },
        ],
        []
    );

    /*
     * 장바구니와 좋아요 개수를 조회합니다.
     */
    useEffect(() => {
        // 로그인하지 않은 경우 API를 호출하지 않습니다.
        // 비로그인 화면은 아래의 조건부 렌더링에서 처리합니다.
        if (!userId) return;

        let isCancelled = false;

        const fetchSummary = async () => {
            try {
                const [cartItems, likes] = await Promise.all([
                    getCartItems(userId),
                    getUserLikes(userId),
                ]);

                // 컴포넌트가 사라진 뒤에는 상태를 변경하지 않습니다.
                if (isCancelled) return;

                setSummary((previous) => ({
                    ...previous,

                    cartCount: Array.isArray(cartItems)
                        ? cartItems.length
                        : 0,

                    likeCount: Array.isArray(likes)
                        ? likes.length
                        : 0,

                    inquiryCount: inquiries.length,
                }));
            } catch (error) {
                console.error(
                    "마이페이지 요약 조회 실패:",
                    error
                );

                if (isCancelled) return;

                setSummary({
                    cartCount: 0,
                    likeCount: 0,
                    reviewCount: reviews.length,
                    inquiryCount: inquiries.length,
                });
            }
        };

        fetchSummary();

        return () => {
            isCancelled = true;
        };
    }, [
        userId,
        reviews.length,
        inquiries.length,
    ]);
    /*
 * 사용자가 작성한 리뷰를 조회합니다.
 */
    useEffect(() => {
        if (!userId) return;

        let isCancelled = false;

        const fetchUserReviews = async () => {
            try {
                setReviewLoading(true);

                const data = await getUserReviews(userId);

                if (isCancelled) return;

                const reviewList =
                    Array.isArray(data) ? data : [];

                setReviews(reviewList);

                setSummary((previous) => ({
                    ...previous,
                    reviewCount: reviewList.length,
                }));
            } catch (error) {
                console.error(
                    "내 리뷰 조회 실패:",
                    error
                );

                if (isCancelled) return;

                setReviews([]);
            } finally {
                if (!isCancelled) {
                    setReviewLoading(false);
                }
            }
        };

        fetchUserReviews();

        return () => {
            isCancelled = true;
        };
    }, [userId]);

    /*
     * 최근 본 상품을 조회합니다.
     *
     * useCallback을 사용하지 않고 조회 함수를
     * useEffect 내부에 선언하여 React Compiler의
     * 메모이제이션 의존성 경고를 방지합니다.
     */
    useEffect(() => {
        // 로그인하지 않은 경우 API를 호출하지 않습니다.
        if (!userId) return;

        let isCancelled = false;

        const fetchRecentProducts = async () => {
            try {
                setRecentLoading(true);

                const data =
                    await getProductHistory(userId);

                if (isCancelled) return;

                setRecentProducts(
                    Array.isArray(data) ? data : []
                );
            } catch (error) {
                console.error(
                    "최근 본 상품 조회 실패:",
                    error
                );

                if (isCancelled) return;

                setRecentProducts([]);
            } finally {
                if (!isCancelled) {
                    setRecentLoading(false);
                }
            }
        };

        fetchRecentProducts();

        return () => {
            isCancelled = true;
        };
    }, [userId]);

    /*
     * 로그인하지 않은 사용자는
     * 마이페이지 내용을 볼 수 없습니다.
     */
    if (!user) {
        return (
            <main className="mypage">
                <div className="mypage-login-required">
                    <h1>로그인이 필요합니다</h1>

                    <p>
                        마이페이지를 이용하려면 먼저
                        로그인해주세요.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/moodfit/login")
                        }
                    >
                        로그인하기
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="mypage">
            <div className="mypage-container">
                <MyPageProfile
                    user={user}
                    onNavigate={navigate}
                />

                <MyPageSummary
                    summary={summary}
                    onNavigate={navigate}
                />

                <MyPageQuickMenu
                    onNavigate={navigate}
                />

                <MyPageActivity
                    recentProducts={recentProducts}
                    recentLoading={recentLoading}
                    reviews={reviews}
                    reviewLoading={reviewLoading}
                    inquiries={inquiries}
                    onNavigate={navigate}
                />
            </div>
        </main>
    );
};

export default MyPage;