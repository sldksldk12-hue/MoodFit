/**
 * 파일: src/components/common/layout/Header.jsx
 */

import {
  Heart,
  Search,
  ShoppingBag,
  ShoppingCart,
  User,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../../store/AuthContext";
import { getCartItems } from "../../../services/api";
import "../../../assets/styles/common/layout/Header.css";

const CATEGORY = {
  TOP: "101,102,103,104,105,106",
  BOTTOM: "201,202,203,204,205,206,207,208",
  OUTER: "301,302,303,304,305,306,307",
  ACC: "401,402,403,404,405,406,407,408,409",
};

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    isLogin,
    logout,
    loading: authLoading,
  } = useAuth();

  const userId = user?.id;
  const userName = user?.user_name;

  const [cartCount, setCartCount] = useState(0);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  };

  const movePage = (path) => {
    navigate(path);
    scrollToTop();
  };

  const chkAdmin = () => {
    if (userName === "admin1") {
      movePage("/moodfit/admin");
    }
  };

  const fetchCartCount = useCallback(async () => {
    if (authLoading) return;

    if (!isLogin || !userId) {
      setCartCount(0);
      return;
    }

    try {
      const items = await getCartItems(userId);

      if (!Array.isArray(items)) {
        console.error("장바구니 응답이 배열이 아닙니다:", items);
        setCartCount(0);
        return;
      }

      const totalQuantity = items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0),
        0
      );

      setCartCount(totalQuantity);
    } catch (error) {
      console.error("헤더 장바구니 개수 조회 실패:", error);
      console.error("서버 응답:", error.response?.data);
      setCartCount(0);
    }
  }, [authLoading, isLogin, userId]);

  useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount, location.pathname, location.search]);

  useEffect(() => {
    const handleCartUpdated = () => {
      fetchCartCount();
    };

    window.addEventListener("cart-updated", handleCartUpdated);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
    };
  }, [fetchCartCount]);

  const toggleSearch = () => {
    const searchContainer = document.querySelector(".search-container");
    if (!searchContainer) return;

    searchContainer.classList.toggle("display-none");

    if (!searchContainer.classList.contains("display-none")) {
      searchContainer.querySelector(".search-input")?.focus();
    }
  };

  const handleSearch = () => {
    const searchInput = document.querySelector(".search-input");
    if (!searchInput) return;

    const query = searchInput.value.trim();
    if (!query) return;

    movePage(
      `/moodfit/list?group=${encodeURIComponent(query)}&category=${encodeURIComponent(query)}`
    );
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const handleLogout = () => {
    logout();
    setCartCount(0);
    movePage("/moodfit");
  };

  return (
    <header className="site-header">
      <div className="top-banner">
        AI가 오늘 날씨와 기분에 맞는 코디를 추천해드려요
      </div>

      <div className="header-inner">
        <button
          type="button"
          className="logo"
          onClick={() => movePage("/moodfit")}
        >
          <ShoppingBag size={28} />
          <span>MOOD FIT</span>
        </button>

        <nav className="main-nav">
          <Link
            to={`/moodfit/list?group=${encodeURIComponent("상의")}&category=${CATEGORY.TOP}`}
            onClick={scrollToTop}
          >
            상의
          </Link>

          <Link
            to={`/moodfit/list?group=${encodeURIComponent("하의")}&category=${CATEGORY.BOTTOM}`}
            onClick={scrollToTop}
          >
            하의
          </Link>

          <Link
            to={`/moodfit/list?group=${encodeURIComponent("아우터")}&category=${CATEGORY.OUTER}`}
            onClick={scrollToTop}
          >
            아우터
          </Link>

          <Link
            to={`/moodfit/list?group=${encodeURIComponent("악세사리/신발")}&category=${CATEGORY.ACC}`}
            onClick={scrollToTop}
          >
            악세사리/신발
          </Link>
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className="icon-button"
            aria-label="검색"
            onClick={toggleSearch}
          >
            <Search size={21} />
          </button>

          <div className="search-container display-none">
            <input
              type="text"
              placeholder="검색..."
              className="search-input"
              onKeyDown={handleSearchKeyDown}
            />

            <button
              type="button"
              className="search-button"
              onClick={handleSearch}
            >
              검색
            </button>
          </div>

          <button
            type="button"
            className="icon-button"
            aria-label="마이페이지"
            onClick={() => movePage("/moodfit/mypage")}
          >
            <Heart size={21} />
          </button>

          <button
            type="button"
            className="icon-button"
            aria-label={`장바구니 ${cartCount}개`}
            onClick={() => movePage("/moodfit/cart")}
          >
            <ShoppingCart size={21} />

            {cartCount > 0 && (
              <span className="cart-count">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>

          {isLogin ? (
            <div className="user-menu">
              <button
                type="button"
                className="user-name"
                onClick={chkAdmin}
              >
                <User size={18} />
                {userName}님
              </button>

              <button
                type="button"
                className="logout-btn"
                onClick={handleLogout}
              >
                로그아웃
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="icon-button"
              aria-label="로그인"
              onClick={() => movePage("/moodfit/login")}
            >
              <User size={21} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;