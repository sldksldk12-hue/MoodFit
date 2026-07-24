/**
 * 파일: src/components/main/WeatherCard.jsx
 * 분류: 메인 페이지 전용 컴포넌트
 *
 * 역할
 * - 현재 날씨 API 결과를 카드 형태로 표시하고 로딩·오류 상태를 처리합니다.
 *
 * 사용 기술
 * - Axios API 호출, useEffect/useState, 조건부 렌더링
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import { useEffect, useState } from "react";
import { getWeather } from "../../services/api"

import {
  getWeatherLabel,
  getWeatherRecommendation,
  getWeatherType,
} from "../../utils/weather";

import WeatherIcon from "../../utils/weatherIcon";
import "../../assets/styles/main/WeatherCard.css";

/**
 * WeatherCard 컴포넌트
 * 부모에게 받은 props와 전역 상태를 조합해 화면을 렌더링합니다.
 */
const WeatherCard = () => {
  // weather: 이 컴포넌트 안에서만 필요한 화면 상태이므로 useState로 관리합니다.
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

  // loading: 이 컴포넌트 안에서만 필요한 화면 상태이므로 useState로 관리합니다.
  const [loading, setLoading] = useState(!weather);
  // error: 이 컴포넌트 안에서만 필요한 화면 상태이므로 useState로 관리합니다.
  const [error, setError] = useState("");

  // 컴포넌트 렌더링 이후 API 호출, DOM 동기화 또는 이벤트 정리가 필요할 때 실행합니다.
  useEffect(() => {
    // fetchWeather: 사용자 이벤트 또는 데이터 처리 과정을 한 함수로 분리해 JSX를 단순하게 유지합니다.
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

        // 챗봇 캐릭터가 같은 세션에서도 최신 날씨 상태를 반영하도록 알림만 보냅니다.
        // (새로운 API 호출이 아니라 이미 받은 데이터를 전달하는 UI용 이벤트입니다.)
        window.dispatchEvent(
          new CustomEvent("moodfit:weather-updated", { detail: data })
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
    // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
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
    // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
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

  // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
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

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default WeatherCard;
