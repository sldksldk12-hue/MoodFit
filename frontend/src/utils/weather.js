/**
 * 파일: src/utils/weather.js
 * 분류: 공통 유틸리티 모듈
 *
 * 역할
 * - 날씨 API 값을 화면용 테마·문구로 변환하는 공통 유틸리티입니다.
 *
 * 사용 기술
 * - 순수 함수, 데이터 매핑
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
export function getWeatherType(main) {
  switch (main) {
    case "Clear":
      return "clear";

    case "Clouds":
      return "cloudy";

    case "Rain":
    case "Drizzle":
    case "Thunderstorm":
      return "rain";

    case "Snow":
      return "snow";

    case "Mist":
    case "Fog":
    case "Haze":
      return "fog";

    default:
      return "clear";
  }
}

export function getWeatherLabel(main) {
  const labels = {
    Clear: "맑음",
    Clouds: "흐림",
    Rain: "비",
    Drizzle: "이슬비",
    Thunderstorm: "천둥번개",
    Snow: "눈",
    Mist: "안개",
    Fog: "안개",
    Haze: "연무",
  };

  return labels[main] ?? "날씨 정보 없음";
}

export function getWeatherRecommendation(main) {
  const recommendations = {
    Clear:
      "가벼운 셔츠 + 데님 팬츠 + 스니커즈 추천",

    Clouds:
      "얇은 가디건 + 니트 + 와이드 팬츠 추천",

    Rain:
      "생활방수 자켓 + 긴 바지 + 방수 신발 추천",

    Drizzle:
      "가벼운 방수 자켓 + 긴 바지 추천",

    Thunderstorm:
      "방수 아우터 + 방수 신발 + 우산 추천",

    Snow:
      "패딩 + 기모 팬츠 + 방한 부츠 추천",

    Mist:
      "가벼운 자켓 + 밝은 색상의 옷 추천",

    Fog:
      "가벼운 자켓 + 밝은 색상의 옷 추천",

    Haze:
      "얇은 아우터 + 마스크 착용 추천",
  };

  // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
  return (
    recommendations[main] ??
    "오늘 날씨에 맞는 코디를 준비하고 있어요."
  );
}