import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { HEADER_CATEGORIES } from "../../../../constants/headerCategories";
import "../../../../assets/styles/common/layout/Header.css";

const HeaderNav = ({ onScrollToTop }) => {
  const [activeMenu, setActiveMenu] = useState(null);
  
  // 네비게이션 영역을 참조할 useRef 생성
  const navRef = useRef(null); 

  // 외부 클릭 감지 로직 추가
  useEffect(() => {
    const handleClickOutside = (event) => {
      // navRef.current가 존재하고, 클릭된 요소(event.target)가 nav 영역 바깥일 때
      if (navRef.current && !navRef.current.contains(event.target)) {
        setActiveMenu(null); // 열려있는 메뉴를 닫음
      }
    };

    // 화면(document)에 마우스 클릭 이벤트 리스너 등록
    document.addEventListener("mousedown", handleClickOutside);
    
    // 컴포넌트가 사라질 때(언마운트) 이벤트 리스너를 제거하여 메모리 누수 방지
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []); // 빈 배열([])을 넣어 컴포넌트가 처음 나타날 때 한 번만 실행되도록 설정

  const handleMenuClick = (label) => {
    setActiveMenu((prev) => (prev === label ? null : label));
  };

  const handleLinkClick = () => {
    setActiveMenu(null);
    if (onScrollToTop) onScrollToTop();
  };

  return (
    // nav 태그에 ref={navRef}를 연결하여 영역 지정
    <nav className="main-nav" ref={navRef}>
      {HEADER_CATEGORIES.map(({ label, categoryIds, subs }) => (
        <div key={label} className="nav-item-container">
          {/* 대분류 버튼 */}
          <button 
            type="button" 
            className={`nav-main-link ${activeMenu === label ? "active" : ""}`}
            onClick={() => handleMenuClick(label)}
          >
            {label}
          </button>

          {/* 중분류 드롭다운 */}
          {activeMenu === label && subs && (
            <div className="nav-sub-menu">
              {subs.map((sub) => (
                <Link
                  key={sub.label}
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