/**
 * 파일: src/components/common/layout/Header.jsx
 * 분류: 공통 UI 컴포넌트
 *
 * 역할
 * - 모든 페이지에서 공통으로 사용하는 상단 내비게이션과 로그인·장바구니 상태를 표시합니다.
 *
 * 사용 기술
 * - React Router Link, Redux useSelector, Auth Context
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import { ShoppingBag, Search, User, Heart, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import '../../../assets/styles/common/layout/Header.css';
import { useAuth } from "../../../store/AuthContext";
import { useSelector } from "react-redux";

/**
 * Header 컴포넌트
 * 부모에게 받은 props와 전역 상태를 조합해 화면을 렌더링합니다.
 */
const Header = () => {
  const navigate = useNavigate();
  const { user, isLogin, logout } = useAuth();
  // 여러 컴포넌트가 공유하는 Redux 상태에서 현재 화면에 필요한 값만 선택합니다.
  const cartItems = useSelector((state) => state.cart.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const chkAdmin = (userName) => {
    if (userName === "admin1") {
      navigate('/moodfit/admin');
    }}
  // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
  return (
    <header className="site-header">
      <div className="top-banner">AI가 오늘 날씨와 기분에 맞는 코디를 추천해드려요</div>

      <div className="header-inner">
        <button type="button" className="logo" onClick={() => navigate('/')}>
          <ShoppingBag size={28} />
          <span>MOOD FIT</span>
        </button>
        <nav className="main-nav">
          <Link to="/moodfit/list?category=상의">상의</Link>
          <Link to="/moodfit/list?category=하의">하의</Link>
          <Link to="/moodfit/list?category=아우터">아우터</Link>
          <Link to="/moodfit/list?category=악세사리/신발">악세사리/신발</Link>
        </nav>

        <div className="header-actions">
          <button type="button" className="icon-button" aria-label="검색" onClick={() => {
            const searchContainer = document.querySelector('.search-container');
            if (searchContainer) {
              searchContainer.classList.toggle('display-none');
              if (!searchContainer.classList.contains('display-none')) {
                const searchInput = searchContainer.querySelector('.search-input');
                if (searchInput) {
                  searchInput.focus();
                }
              }
            }
          }}>
            <Search size={21} />
          </button>
          <div className="search-container display-none">
            <input type="text" placeholder="검색..." className="search-input" />
            <button type="button" className="search-button" onClick={() => {
              const searchInput = document.querySelector('.search-input');
              if (searchInput) {
                const query = searchInput.value.trim();
                if (query) {
                  navigate(`/moodfit/list?category=${encodeURIComponent(query)}`);
                }
              }
            }}>
              검색
            </button>
          </div>
          <button type="button" className="icon-button" aria-label="마이페이지" onClick={() => navigate('/moodfit/mypage')}>
            <Heart size={21} />
          </button>
          <button type="button" className="icon-button" aria-label="장바구니" onClick={() => navigate('/moodfit/cart')}>
            <ShoppingCart size={21} />
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>
          {isLogin ? (
            <div className="user-menu">
              <span className="user-name" onClick={() => chkAdmin(user.user_name)}>
                <User size={18} />
                {user.user_name}님
              </span>

              <button
                className="logout-btn"
                onClick={logout}
              >
                로그아웃
              </button>
            </div>
          ) : (
            <button type="button" className="icon-button" aria-label="로그인" onClick={() => navigate('/moodfit/login')}>
              <User size={21} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default Header;
