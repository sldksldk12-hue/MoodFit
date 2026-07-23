import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const HeaderSearch = ({ onMovePage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const toggleSearch = () => {
    setIsOpen((previous) => !previous);
  };

  const handleSearch = () => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) return;

    onMovePage(`/moodfit/list?query=${encodeURIComponent(trimmedKeyword)}`);
    setKeyword("");
    setIsOpen(false);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }

    if (event.key === "Escape") { 
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="icon-button"
        aria-label={isOpen ? "검색창 닫기" : "검색창 열기"}
        aria-expanded={isOpen}
        onClick={toggleSearch}
      >
        <Search size={21} />
      </button>

      <div className={`search-container${isOpen ? "" : " display-none"}`}>
        <input
          ref={inputRef}
          type="search"
          value={keyword}
          placeholder="검색..."
          className="search-input"
          onChange={(event) => setKeyword(event.target.value)}
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
    </>
  );
};

export default HeaderSearch;
