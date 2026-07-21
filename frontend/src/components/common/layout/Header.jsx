/**
 * 파일: src/components/common/layout/Header.jsx
 *
 * 역할
 * - 모든 페이지에서 공통으로 사용하는 상단 내비게이션입니다.
 * - 로그인 상태와 사용자 정보를 표시합니다.
 * - 백엔드 DB에서 장바구니 정보를 조회해 장바구니 개수를 표시합니다.
 */

import {
  Heart,
  Search,
  ShoppingBag,
  ShoppingCart,
  User,
} from "lucide-react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useAuth } from "../../../store/AuthContext";
import { getCartItems } from "../../../services/api";

import "../../../assets/styles/common/layout/Header.css";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /*
   * AuthContext에서 로그인 정보를 가져옵니다.
   */
  const {
    user,
    isLogin,
    logout,
    loading: authLoading,
  } = useAuth();

  /*
   * 백엔드 장바구니에 들어 있는 전체 상품 수량입니다.
   *
   * 예:
   * 상품 A 2개
   * 상품 B 3개
   *
   * cartCount는 5가 됩니다.
   */
  const [cartCount, setCartCount] = useState(0);

  /*
   * 관리자 페이지 이동
   */
  const chkAdmin = (userName) => {
    if (userName === "admin1") {
      navigate("/moodfit/admin");
    }
  };

  /*
   * 백엔드 DB에서 현재 사용자의 장바구니를 조회합니다.
   *
   * useCallback을 사용한 이유:
   * useEffect와 이벤트 리스너에서 같은 함수를 안정적으로
   * 사용할 수 있도록 하기 위해서입니다.
   */
  const fetchCartCount = useCallback(async () => {
    /*
     * 로그인 정보 확인 중에는 API를 호출하지 않습니다.
     */
    if (authLoading) {
      return;
    }

    /*
     * 로그인하지 않았거나 사용자 ID가 없으면
     * 장바구니 숫자를 0으로 설정합니다.
     */
    if (!isLogin || !user?.id) {
      setCartCount(0);
      return;
    }

    try {
      /*
       * GET /api/cart/{userId}
       */
      const items = await getCartItems(user.id);

      /*
       * 안전하게 배열 여부를 확인합니다.
       */
      if (!Array.isArray(items)) {
        console.error(
          "장바구니 응답이 배열이 아닙니다:",
          items
        );

        setCartCount(0);
        return;
      }

      /*
       * 각 장바구니 상품의 quantity를 모두 더합니다.
       */
      const totalQuantity = items.reduce(
        (sum, item) => {
          return (
            sum + (Number(item.quantity) || 0)
          );
        },
        0
      );

      setCartCount(totalQuantity);
    } catch (err) {
      console.error(
        "헤더 장바구니 개수 조회 실패:",
        err
      );

      console.error(
        "서버 응답:",
        err.response?.data
      );

      setCartCount(0);
    }
  }, [
    authLoading,
    isLogin,
    user?.id,
  ]);

  /*
   * 로그인 상태가 바뀌거나 페이지가 이동할 때
   * 장바구니 숫자를 다시 조회합니다.
   */
  useEffect(() => {
    fetchCartCount();
  }, [
    fetchCartCount,
    location.pathname,
  ]);

  /*
   * api.js에서 장바구니 추가·수정·삭제가 성공하면
   * cart-updated 이벤트가 발생합니다.
   *
   * Header는 이 이벤트를 감지해 DB 장바구니를 다시 조회합니다.
   */
  useEffect(() => {
    const handleCartUpdated = () => {
      fetchCartCount();
    };

    window.addEventListener(
      "cart-updated",
      handleCartUpdated
    );

    /*
     * Header가 사라질 때 이벤트를 제거합니다.
     */
    return () => {
      window.removeEventListener(
        "cart-updated",
        handleCartUpdated
      );
    };
  }, [fetchCartCount]);

  /*
   * 검색창 표시 및 숨김
   */
  const toggleSearch = () => {
    const searchContainer =
      document.querySelector(
        ".search-container"
      );

    if (!searchContainer) {
      return;
    }

    searchContainer.classList.toggle(
      "display-none"
    );

    if (
      !searchContainer.classList.contains(
        "display-none"
      )
    ) {
      const searchInput =
        searchContainer.querySelector(
          ".search-input"
        );

      searchInput?.focus();
    }
  };

  /*
   * 상품 검색
   */
  const handleSearch = () => {
    const searchInput =
      document.querySelector(
        ".search-input"
      );

    if (!searchInput) {
      return;
    }

    const query =
      searchInput.value.trim();

    if (!query) {
      return;
    }

    navigate(
      `/moodfit/list?category=${encodeURIComponent(
        query
      )}`
    );
  };

  /*
   * 엔터키 검색
   */
  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  /*
   * 로그아웃 시 AuthContext의 logout을 실행합니다.
   *
   * isLogin이 false로 바뀌면 useEffect가 다시 실행되어
   * cartCount도 0으로 변경됩니다.
   */
  const handleLogout = () => {
    logout();
    setCartCount(0);
  };

  return (
    <header className="site-header">
      <div className="top-banner">
        AI가 오늘 날씨와 기분에 맞는 코디를
        추천해드려요
      </div>

      <div className="header-inner">
        {/* 로고 */}
        <button
          type="button"
          className="logo"
          onClick={() =>
            navigate("/")
          }
        >
          <ShoppingBag size={28} />
          <span>MOOD FIT</span>
        </button>

        {/* 메인 메뉴 */}
        <nav className="main-nav">
          <Link to="/moodfit/list?category=상의">
            상의
          </Link>

          <Link to="/moodfit/list?category=하의">
            하의
          </Link>

          <Link to="/moodfit/list?category=아우터">
            아우터
          </Link>

          <Link to="/moodfit/list?category=악세사리/신발">
            악세사리/신발
          </Link>
        </nav>

        <div className="header-actions">
          {/* 검색 버튼 */}
          <button
            type="button"
            className="icon-button"
            aria-label="검색"
            onClick={toggleSearch}
          >
            <Search size={21} />
          </button>

          {/* 검색 입력 영역 */}
          <div className="search-container display-none">
            <input
              type="text"
              placeholder="검색..."
              className="search-input"
              onKeyDown={
                handleSearchKeyDown
              }
            />

            <button
              type="button"
              className="search-button"
              onClick={handleSearch}
            >
              검색
            </button>
          </div>

          {/* 마이페이지 버튼 */}
          <button
            type="button"
            className="icon-button"
            aria-label="마이페이지"
            onClick={() =>
              navigate("/moodfit/mypage")
            }
          >
            <Heart size={21} />
          </button>

          {/* 장바구니 버튼 */}
          <button
            type="button"
            className="icon-button"
            aria-label={`장바구니 ${cartCount}개`}
            onClick={() =>
              navigate("/moodfit/cart")
            }
          >
            <ShoppingCart size={21} />

            {cartCount > 0 && (
              <span className="cart-count">
                {cartCount > 99
                  ? "99+"
                  : cartCount}
              </span>
            )}
          </button>

          {/* 로그인 사용자 메뉴 */}
          {isLogin ? (
            <div className="user-menu">
              <span
                className="user-name"
                onClick={() =>
                  chkAdmin(
                    user?.user_name
                  )
                }
              >
                <User size={18} />
                {user?.user_name}님
              </span>

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
              onClick={() =>
                navigate(
                  "/moodfit/login"
                )
              }
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