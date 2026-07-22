import { Link } from "react-router-dom";

import { HEADER_CATEGORIES } from "../../../../constants/headerCategories";

const HeaderNav = ({ onScrollToTop }) => {
  return (
    <nav className="main-nav">
      {HEADER_CATEGORIES.map(({ label, categoryIds }) => (
        <Link
          key={label}
          to={`/moodfit/list?group=${encodeURIComponent(label)}&category=${categoryIds}`}
          onClick={onScrollToTop}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
};

export default HeaderNav;
