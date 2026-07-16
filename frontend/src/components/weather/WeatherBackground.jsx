/**
 * 파일: src/components/weather/WeatherBackground.jsx
 * 분류: 날씨 시각 효과 모듈
 *
 * 역할
 * - 선택된 날씨 테마에 따라 비·눈·안개 효과를 페이지 배경에 적용합니다.
 *
 * 사용 기술
 * - 컴포넌트 합성, 조건부 렌더링
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import FogEffect from "./fog/FogEffect.jsx";
import RainEffect from "./rain/RainEffect.jsx";
import SnowEffect from "./snow/SnowEffect.jsx";
import "./weather-effects.css";

export function resolveWeatherTheme({ theme, pty, sky, visibility }) {
  if (theme) return theme;

  const precipitation = String(pty ?? "0");
  const skyState = String(sky ?? "1");

  if (["3", "7"].includes(precipitation)) return "snow";
  if (["1", "2", "4", "5", "6"].includes(precipitation)) return "rain";
  if (visibility != null && Number(visibility) < 1000) return "fog";
  if (["3", "4"].includes(skyState)) return "fog-light";
  return "clear";
}

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default function WeatherBackground({
  children,
  theme,
  pty,
  sky,
  visibility,
  rainType = "rain",
  snowType = "gentle",
  fogType = "light",
  backgroundImageUrl,
  className = "",
}) {
  const resolvedTheme = resolveWeatherTheme({ theme, pty, sky, visibility });

  const defaultBackgrounds = {
    rain: "/assets/raincolor.png",
    snow: "/assets/new-york-snow.png",
    fog: "/assets/san-francisco-fog.png",
    "fog-light": "/assets/san-francisco-fog.png",
    clear: "",
  };

  const selectedBackground =
    backgroundImageUrl || defaultBackgrounds[resolvedTheme] || "";

  // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
  return (
    <div
      className={`weather-page weather-page--${resolvedTheme} ${className}`.trim()}
      style={
        resolvedTheme !== "rain" && selectedBackground
          ? { backgroundImage: `url(${selectedBackground})` }
          : undefined
      }
    >
      {resolvedTheme === "rain" && (
        <RainEffect
          backgroundImageUrl={selectedBackground}
          type={rainType}
        />
      )}

      {resolvedTheme === "snow" && <SnowEffect type={snowType} />}

      {(resolvedTheme === "fog" || resolvedTheme === "fog-light") && (
        <FogEffect type={resolvedTheme === "fog-light" ? "light" : fogType} />
      )}

      <div className="weather-page__overlay" aria-hidden="true" />
      <div className="weather-page__content">{children}</div>
    </div>
  );
}
