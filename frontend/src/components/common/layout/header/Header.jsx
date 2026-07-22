/**
 * 파일: src/components/common/layout/Header.jsx
 * 역할: 헤더 하위 컴포넌트를 배치하고 공통 이동/인증 상태만 연결합니다.
 */

import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../../store/AuthContext";
import useCartCount from "../../../../hooks/useCartCount";
import "../../../../assets/styles/common/layout/Header.css";

import HeaderBanner from "./HeaderBanner";
import HeaderCart from "./HeaderCart";
import HeaderLogo from "./HeaderLogo";
import HeaderNav from "./HeaderNav";
import HeaderQuickActions from "./HeaderQuickActions";
import HeaderSearch from "./HeaderSearch";
import HeaderUser from "./HeaderUser";

const Header = () => {
  const navigate = useNavigate();
  const { user, isLogin, logout, loading: authLoading } = useAuth();

  const { cartCount, resetCartCount } = useCartCount({
    userId: user?.id,
    isLogin,
    authLoading,
  });

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

  const handleLogout = () => {
    logout();
    resetCartCount();
    movePage("/moodfit");
  };

  return (
    <header className="site-header">
      <HeaderBanner />

      <div className="header-inner">
        <HeaderLogo onMovePage={movePage} />
        <HeaderNav onScrollToTop={scrollToTop} />

        <div className="header-actions">
          <HeaderSearch onMovePage={movePage} />
          <HeaderQuickActions onMovePage={movePage} />
          <HeaderCart cartCount={cartCount} onMovePage={movePage} />
          <HeaderUser
            isLogin={isLogin}
            userName={user?.user_name}
            onLogout={handleLogout}
            onMovePage={movePage}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
