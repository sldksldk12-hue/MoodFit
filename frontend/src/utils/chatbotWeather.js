/**
 * 파일: src/utils/chatbotWeather.js
 * 분류: 프론트엔드 UI 전용 유틸리티 모듈
 *
 * 역할
 * - 이미 프론트엔드가 받아 둔 날씨 상태값(OpenWeather의 weather[0].main 등)을
 *   챗봇 캐릭터의 시각 상태(clear / clouds / rain / snow / fog / thunder / default)로 변환합니다.
 *
 * 주의
 * - 이 파일은 화면 표현만 담당하는 UI 전용 함수입니다.
 * - 새로운 날씨 API 요청을 하지 않으며, 백엔드 응답 필드명을 변경하지 않습니다.
 * - 대소문자, 한글/영문 값 차이를 안전하게 처리하고 값이 없으면 기본 상태를 반환합니다.
 */

/**
 * 날씨 원본 값을 챗봇 캐릭터 상태 문자열로 변환합니다.
 * @param {string|undefined|null} weatherValue - 예: "Clear", "rain", "눈" 등
 * @returns {"clear"|"clouds"|"rain"|"snow"|"fog"|"thunder"|"default"}
 */
export function getChatbotWeatherState(weatherValue) {
  if (!weatherValue || typeof weatherValue !== "string") {
    return "default";
  }

  const value = weatherValue.trim().toLowerCase();

  if (!value) return "default";

  // 천둥번개 (rain 키워드보다 먼저 확인)
  if (
    value.includes("thunder") ||
    value.includes("storm") ||
    value.includes("천둥") ||
    value.includes("번개")
  ) {
    return "thunder";
  }

  // 눈
  if (value.includes("snow") || value.includes("눈")) {
    return "snow";
  }

  // 비 / 이슬비 / 소나기
  if (
    value.includes("rain") ||
    value.includes("drizzle") ||
    value.includes("shower") ||
    value.includes("비") ||
    value.includes("소나기")
  ) {
    return "rain";
  }

  // 안개 / 연무 / 실안개
  if (
    value.includes("fog") ||
    value.includes("mist") ||
    value.includes("haze") ||
    value.includes("smoke") ||
    value.includes("안개") ||
    value.includes("연무")
  ) {
    return "fog";
  }

  // 흐림 / 구름
  if (value.includes("cloud") || value.includes("흐림") || value.includes("구름")) {
    return "clouds";
  }

  // 맑음
  if (value.includes("clear") || value.includes("sun") || value.includes("맑")) {
    return "clear";
  }

  return "default";
}

/**
 * 프론트엔드가 이미 localStorage에 저장해 둔 날씨 상태값을 안전하게 읽어옵니다.
 * (WeatherCard가 getWeather() 호출 후 "moodfit_weather" 키로 저장한 OpenWeather 원본 JSON)
 *
 * - 새로운 API 요청을 추가하지 않습니다.
 * - 값이 없거나 파싱에 실패하면 null을 반환하여 기본 캐릭터가 표시되도록 합니다.
 * @returns {string|null} 예: "Clear", "Rain" 또는 null
 */
export function readStoredWeatherMain() {
  try {
    const saved = JSON.parse(localStorage.getItem("moodfit_weather") || "null");
    return saved?.weather?.[0]?.main ?? null;
  } catch (error) {
    console.error("[v0] 저장된 날씨 상태값 읽기 실패:", error);
    return null;
  }
}

/**
 * 챗봇 캐릭터 상태별 접근성 라벨(장식 요소 설명이 아닌 버튼 보조 설명용).
 */
export function getChatbotWeatherLabel(state) {
  const labels = {
    clear: "맑은 날씨",
    clouds: "흐린 날씨",
    rain: "비 오는 날씨",
    snow: "눈 오는 날씨",
    fog: "안개 낀 날씨",
    thunder: "천둥번개 날씨",
    default: "",
  };
  return labels[state] ?? "";
}
