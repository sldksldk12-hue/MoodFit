import { useEffect, useState } from "react";
import { getWeather } from "../services/api"

import {
  getWeatherLabel,
  getWeatherRecommendation,
  getWeatherType,
} from "../utils/weather";

import WeatherIcon from "../utils/weatherIcon";
import "../assets/styles/WeatherCard.css";

const WeatherCard = () => {
  const [weather, setWeather] = useState(() => {
    try {
      const savedWeather =
        localStorage.getItem("moodfit_weather");

      return savedWeather
        ? JSON.parse(savedWeather)
        : null;
    } catch (error) {
      console.error(
        "저장된 날씨 데이터 파싱 실패:",
        error
      );

      return null;
    }
  });

  const [loading, setLoading] = useState(!weather);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError("");

        // 백엔드에서 OpenWeather 전체 JSON을 받음
        const data = await getWeather();

        console.log("날씨 API 결과:", data);

        setWeather(data);

        localStorage.setItem(
          "moodfit_weather",
          JSON.stringify(data)
        );
      } catch (error) {
        console.error("날씨 API 오류:", error);

        setError(
          "날씨 정보를 불러오지 못했습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (loading && !weather) {
    return (
      <div className="weather-card">
        <div className="weather-skeleton">
          <div className="skeleton-icon" />
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-subtitle" />
          <div className="skeleton-line skeleton-recommend" />
        </div>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="weather-card weather-card--error">
        <h2>오늘의 추천</h2>
        <p>{error}</p>
      </div>
    );
  }

  /*
    OpenWeather 응답 구조

    weather.weather[0].main
    weather.weather[0].description
    weather.main.temp
    weather.name
  */

  const weatherMain =
    weather?.weather?.[0]?.main ?? "Clear";

  const description =
    weather?.weather?.[0]?.description ?? "맑음";

  const temperature =
    weather?.main?.temp ?? "--";

  const city =
    weather?.name ?? "Seoul";

  const weatherType =
    getWeatherType(weatherMain);

  const weatherLabel =
    getWeatherLabel(weatherMain);

  const recommendation =
    getWeatherRecommendation(weatherMain);

  return (
    <div
      className={`weather-card weather-card--${weatherType}`}
    >
      <WeatherIcon type={weatherType} />

      <h2>오늘의 추천</h2>

      <p>
        {city} {temperature}℃ ·{" "}
        {weatherLabel}
      </p>

      <small className="weather-description">
        {description}
      </small>

      <strong>{recommendation}</strong>
    </div>
  );
};

export default WeatherCard;