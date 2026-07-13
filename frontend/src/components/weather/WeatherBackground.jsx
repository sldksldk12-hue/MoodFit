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
