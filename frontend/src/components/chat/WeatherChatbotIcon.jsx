/**
 * 파일: src/components/chat/WeatherChatbotIcon.jsx
 * 분류: 채팅 기능 - UI 전용 컴포넌트
 *
 * 역할
 * - 우측 하단 챗봇 버튼 안에 들어가는 MOODFIT AI 캐릭터를 그립니다.
 * - 프론트엔드가 이미 받아 둔 날씨 상태값을 캐릭터의 시각 상태로만 변환하며,
 *   버튼의 클릭/열림/Redux/팝업 로직에는 전혀 관여하지 않습니다.
 *
 * 접근성
 * - 모든 날씨 장식 요소는 aria-hidden="true" + pointer-events:none 입니다.
 * - 캐릭터 자체도 장식이므로 버튼의 텍스트/aria-label이 의미를 전달합니다.
 */
import { Bot } from "lucide-react";

import { getChatbotWeatherState } from "../../utils/chatbotWeather";
import "../../assets/styles/chat/chatbot-weather.css";

/**
 * 상태별 장식 레이어. 모두 순수 장식이므로 aria-hidden 처리합니다.
 */
const WeatherDecoration = ({ state }) => {
  switch (state) {
    case "rain":
      return (
        <span className="mf-cbw-deco mf-cbw-deco--rain" aria-hidden="true">
          <span className="mf-cbw-umbrella">
            <span className="mf-cbw-umbrella-canopy" />
            <span className="mf-cbw-umbrella-pole" />
          </span>
          <span className="mf-cbw-drop mf-cbw-drop-1" />
          <span className="mf-cbw-drop mf-cbw-drop-2" />
          <span className="mf-cbw-drop mf-cbw-drop-3" />
          <span className="mf-cbw-drop mf-cbw-drop-4" />
        </span>
      );

    case "snow":
      return (
        <span className="mf-cbw-deco mf-cbw-deco--snow" aria-hidden="true">
          <span className="mf-cbw-beanie">
            <span className="mf-cbw-beanie-pom" />
          </span>
          <span className="mf-cbw-scarf" />
          <span className="mf-cbw-flake mf-cbw-flake-1" />
          <span className="mf-cbw-flake mf-cbw-flake-2" />
          <span className="mf-cbw-flake mf-cbw-flake-3" />
        </span>
      );

    case "clear":
      return (
        <span className="mf-cbw-deco mf-cbw-deco--clear" aria-hidden="true">
          <span className="mf-cbw-sun-ring" />
          <span className="mf-cbw-sparkle mf-cbw-sparkle-1" />
          <span className="mf-cbw-sparkle mf-cbw-sparkle-2" />
          <span className="mf-cbw-shades" />
        </span>
      );

    case "clouds":
      return (
        <span className="mf-cbw-deco mf-cbw-deco--clouds" aria-hidden="true">
          <span className="mf-cbw-cloud mf-cbw-cloud-1" />
          <span className="mf-cbw-cloud mf-cbw-cloud-2" />
        </span>
      );

    case "fog":
      return (
        <span className="mf-cbw-deco mf-cbw-deco--fog" aria-hidden="true">
          <span className="mf-cbw-fog mf-cbw-fog-1" />
          <span className="mf-cbw-fog mf-cbw-fog-2" />
          <span className="mf-cbw-fog mf-cbw-fog-3" />
        </span>
      );

    case "thunder":
      return (
        <span className="mf-cbw-deco mf-cbw-deco--thunder" aria-hidden="true">
          <span className="mf-cbw-cloud mf-cbw-cloud-1" />
          <span className="mf-cbw-bolt" />
        </span>
      );

    default:
      return null;
  }
};

/**
 * WeatherChatbotIcon
 * @param {{ weatherMain?: string|null }} props - 프론트엔드가 이미 보유한 날씨 상태값
 */
const WeatherChatbotIcon = ({ weatherMain }) => {
  const state = getChatbotWeatherState(weatherMain);

  return (
    <span
      className={`mf-cbw mf-cbw--${state}`}
      data-weather={state}
      aria-hidden="true"
    >
      <span className="mf-cbw-face">
        <Bot size={24} strokeWidth={2.1} />
      </span>
      <WeatherDecoration state={state} />
    </span>
  );
};

export default WeatherChatbotIcon;
