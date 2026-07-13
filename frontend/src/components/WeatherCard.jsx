import {
  Cloud,
  CloudRain,
  CloudSun,
  Snowflake,
  Sun,
} from "lucide-react";

import { useEffect, useState } from "react";
import { getWeather } from "../services/api";

import {
  getWeatherLabel,
  getWeatherRecommendation,
  getWeatherType,
} from "../utils/weather";

import "../assets/styles/WeatherCard.css";
import WeatherIcon from "../utils/weatherIcon";

const WeatherCard = () => {
  const [weather, setWeather] = useState(() => {
    try {
      const saved = localStorage.getItem("moodfit_weather");

      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("저장된 날씨 데이터 파싱 실패:", error);
      return null;
    }
  });

  const [loading, setLoading] = useState(!weather);

  useEffect(() => {
    const fetchWeather = async (lat, lng) => {
      try {
        const data = await getWeather(lat, lng);

        setWeather(data);

        localStorage.setItem(
          "moodfit_weather",
          JSON.stringify(data)
        );
      } catch (error) {
        console.error("날씨 API 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeather(
          position.coords.latitude,
          position.coords.longitude
        );
      },

      () => {
        // 위치 권한 거부 또는 위치 조회 실패 시 서울시청 좌표
        fetchWeather(37.5665, 126.9780);
      },

      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 600000,
      }
    );
  }, []);

  /*
    백엔드 응답 필드가 rain_type이라면 아래처럼 사용.
    만약 pty라는 이름으로 내려오면 weather?.pty로 변경.
  */
  const pty = weather?.rain_type ?? weather?.pty ?? "0";
  const sky = weather?.sky ?? "1";

  const weatherType = getWeatherType(pty, sky);
  const weatherLabel = getWeatherLabel(pty, sky);
  const recommendation = getWeatherRecommendation(pty, sky);


  return (
    <div
      className={`weather-card weather-card--${weatherType}`}
    >
      {loading && !weather ? (
        <div className="weather-skeleton">
          <div className="skeleton-icon" />
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-subtitle" />
          <div className="skeleton-line skeleton-recommend" />
        </div>
      ) : (
        <>
          <WeatherIcon type={weatherType} />

          <h2>오늘의 추천</h2>

          <p>
            {weather?.city ?? "서울"}{" "}
            {weather?.temperature ?? "--"}℃ ·{" "}
            {weatherLabel}
          </p>

          <strong>{recommendation}</strong>
        </>
      )}
    </div>
  );
};

export default WeatherCard;