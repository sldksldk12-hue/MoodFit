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
      "맑은 날씨에 어울리는 스타일을 둘러보세요.",

    Clouds:
      "흐린 날씨에 어울리는 코디를 만나보세요.",

    Rain:
      "비 오는 날에 어울리는 방수 아이템을 확인해보세요.",

    Drizzle:
      "가벼운 비에 어울리는 코디를 둘러보세요.",

    Thunderstorm:
      "폭우에 대비한 기능성 아이템을 만나보세요.",

    Snow:
      "눈 오는 날 따뜻하게 입을 겨울 아이템을 둘러보세요.",

    Mist:
      "안개 낀 날씨에 어울리는 스타일을 확인해보세요.",

    Fog:
      "안개 낀 날씨에 어울리는 코디를 둘러보세요.",

    Haze:
      "쾌적한 외출을 위한 스타일을 만나보세요.",
  };

  return (
    recommendations[main] ??
    "오늘 날씨에 어울리는 스타일을 둘러보세요."
  );
}

