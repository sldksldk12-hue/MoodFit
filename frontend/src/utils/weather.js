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

  return (
    recommendations[main] ??
    "오늘 날씨에 맞는 코디를 준비하고 있어요."
  );
}