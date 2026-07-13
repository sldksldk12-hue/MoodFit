import { ShoppingBag, Search, User, Heart, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import '../assets/styles/Header.css';
import { useState } from 'react';
import { useAuth } from "../store/AuthContext";

const Header = () => {
  const navigate = useNavigate();
  const { user, isLogin, logout } = useAuth();
  const chkAdmin = (userName) => {
    if (userName === "admin1") {
      navigate('/moodfit/admin');
    }}
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

export default Header;
