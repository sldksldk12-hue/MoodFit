import {
  Bot,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { getFestival } from "../services/api";
import "../assets/styles/HeroContent.css";

const HeroContent = ({
  openChat,
  chatMessage,
  setChatMessage,
}) => {
  const [festivals, setFestivals] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loadFestival = async () => {
      try {
        const data = await getFestival();

        setFestivals(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.error(
          "축제 정보 불러오기 실패:",
          error
        );

        setFestivals([]);
      }
    };

    loadFestival();
  }, []);

  // 행사 부분만 5초마다 자동 변경
  useEffect(() => {
    if (festivals.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((previousIndex) =>
        previousIndex === festivals.length - 1
          ? 0
          : previousIndex + 1
      );
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [festivals.length]);

  const currentFestival =
    festivals[currentIndex];

  const movePrevious = () => {
    if (festivals.length === 0) {
      return;
    }

    setCurrentIndex((previousIndex) =>
      previousIndex === 0
        ? festivals.length - 1
        : previousIndex - 1
    );
  };

  const moveNext = () => {
    if (festivals.length === 0) {
      return;
    }

    setCurrentIndex((previousIndex) =>
      previousIndex === festivals.length - 1
        ? 0
        : previousIndex + 1
    );
  };

  return (
    <div className="hero-text">
      <span className="eyebrow">
        AI CLOTHING RECOMMENDATION
      </span>

      {/* 이 부분만 슬라이드 */}
      <div className="festival-slider">
        <div
          className="festival-slide"
          key={
            currentFestival?.contentid ??
            currentIndex
          }
        >
          <h1>
            {currentFestival
              ? `${currentFestival.title}이 시작되었습니다!`
              : "오늘의 축제를 불러오는 중..."}
          </h1>

          <p>
            {currentFestival
              ? `${currentFestival.title}에 어울리는 티셔츠, 반바지, 샌들 등 축제 코디를 만나보세요.`
              : "축제 정보를 불러오는 중입니다."}
          </p>

          {currentFestival && (
            <Link
              to={`/festival/${currentFestival.contentid}`}
              className="festival-detail-link"
            >
              행사 코디 보기
            </Link>
          )}
        </div>

        {festivals.length > 1 && (
          <>
            <button
              type="button"
              className="festival-arrow festival-arrow--left"
              onClick={movePrevious}
              aria-label="이전 축제"
            >
              <ChevronLeft size={26} />
            </button>

            <button
              type="button"
              className="festival-arrow festival-arrow--right"
              onClick={moveNext}
              aria-label="다음 축제"
            >
              <ChevronRight size={26} />
            </button>

            <div className="festival-dots">
              {festivals.map(
                (festival, index) => (
                  <button
                    type="button"
                    key={
                      festival.contentid ??
                      index
                    }
                    className={
                      index === currentIndex
                        ? "festival-dot festival-dot--active"
                        : "festival-dot"
                    }
                    onClick={() =>
                      setCurrentIndex(index)
                    }
                    aria-label={`${index + 1}번째 축제`}
                  />
                )
              )}
            </div>
          </>
        )}
      </div>

      {/* 아래는 모두 고정 영역 */}
      <div className="ai-input-box">
        <input
          type="text"
          className="ai-input"
          placeholder="어떤 상품이 필요하신가요?"
          value={chatMessage}
          onChange={(event) =>
            setChatMessage(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              openChat();
            }
          }}
        />
      </div>

      <button
        type="button"
        className="primary-button"
        onClick={openChat}
      >
        <Bot size={19} />
        AI 추천 시작
      </button>

      <p className="hero-description">
        기상청 API, 사용자 취향 등을 바탕으로
        개인 맞춤 추천을 제공합니다.
      </p>
    </div>
  );
};

export default HeroContent;