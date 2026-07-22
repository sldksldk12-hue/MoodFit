import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  Clock3,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../store/AuthContext";
import { getProductHistory } from "../services";

import RecentProductList from "../components/mypage/RecentProductList";

import "../assets/styles/pages/mypage/RecentHistoryPage.css";

const RecentHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const userId = user?.id;

  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!userId) return;

    let isCancelled = false;

    const fetchHistory = async () => {
      try {
        const data =
          await getProductHistory(userId);

        if (isCancelled) return;

        setProducts(
          Array.isArray(data) ? data : []
        );
      } catch (err) {
        console.error(
          "최근 본 상품 전체 조회 실패:",
          err
        );

        if (isCancelled) return;

        setError(
          err.response?.data?.detail ||
            "최근 본 상품을 불러오지 못했습니다."
        );
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  if (!user) {
    return (
      <main className="recent-history-page">
        <div className="recent-history-status">
          <h1>로그인이 필요합니다</h1>

          <p>
            최근 본 상품을 확인하려면
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

  if (loading) {
    return (
      <main className="recent-history-page">
        <div className="recent-history-status">
          최근 본 상품을 불러오는
          중입니다.
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="recent-history-page">
        <div className="recent-history-status recent-history-error">
          <p>{error}</p>

          <button
            type="button"
            onClick={() =>
              navigate("/moodfit/mypage")
            }
          >
            마이페이지로 돌아가기
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="recent-history-page">
      <div className="recent-history-container">
        <header className="recent-history-header">
          <button
            type="button"
            className="recent-history-back"
            onClick={() => navigate(-1)}
            aria-label="이전 페이지"
          >
            <ArrowLeft size={22} />
          </button>

          <div>
            <div className="recent-history-title">
              <Clock3 size={22} />
              <h1>최근 본 상품</h1>
            </div>

            <p>
              최근에 확인한 상품을 다시
              살펴보세요.
            </p>
          </div>

          <span className="recent-history-count">
            총 {products.length}개
          </span>
        </header>

        <RecentProductList
          products={products}
          onNavigate={navigate}
        />
      </div>
    </main>
  );
};

export default RecentHistoryPage;