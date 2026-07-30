import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HEADER_CATEGORIES } from "../../../../constants/headerCategories";
import "../../../../assets/styles/common/layout/Header.css";

const HeaderNav = ({ onScrollToTop }) => {
  const [activeMenu, setActiveMenu] = useState(null);
  const navigate = useNavigate();
  const navRef = useRef(null); 

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMenuClick = (label) => {
    if (activeMenu === label) {
      setActiveMenu(null);
      navigate(`/moodfit/list?group=${encodeURIComponent(label)}`);
      if (onScrollToTop) onScrollToTop();
    } else {
      setActiveMenu(label);
    }
  };

  const handleLinkClick = () => {
    setActiveMenu(null);
    if (onScrollToTop) onScrollToTop();
  };

  return (
    <nav className="main-nav" ref={navRef}>
      {HEADER_CATEGORIES.map(({ label, subs }) => (
        <div key={label} className="nav-item-container">
          <button 
            type="button" 
            className={`nav-main-link ${activeMenu === label ? "active" : ""}`}
            onClick={() => handleMenuClick(label)}
          >
            {label}
          </button>

          {activeMenu === label && subs && (
            <div className="nav-sub-menu">
              {/* 중분류 목록만 깔끔하게 출력 (전체보기는 대분류 버튼 클릭으로 대체 또는 필요시 1개만 유지) */}
              {subs.map((sub) => (
                <Link
                  key={sub.id}
                  to={`/moodfit/list?group=${encodeURIComponent(label)}&category=${sub.id}`}
                  className="nav-sub-link"
                  onClick={handleLinkClick}
                >
                  {sub.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
};

export default HeaderNav;