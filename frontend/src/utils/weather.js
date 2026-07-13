export function getWeatherType(pty, sky) {
  const ptyCode = String(pty ?? "0");
  const skyCode = String(sky ?? "1");

  // 비·눈 여부를 SKY보다 먼저 확인
  if (["1", "2", "5", "6"].includes(ptyCode)) {
    return "rain";
  }

  if (["3", "7"].includes(ptyCode)) {
    return "snow";
  }

  if (skyCode === "1") {
    return "clear";
  }

  if (skyCode === "3") {
    return "cloudy";
  }

  if (skyCode === "4") {
    return "overcast";
  }

  return "clear";
}

export function getWeatherLabel(pty, sky) {
  const type = getWeatherType(pty, sky);

  const labels = {
    clear: "맑음",
    cloudy: "구름많음",
    overcast: "흐림",
    rain: "비",
    snow: "눈",
  };

  return labels[type] ?? "날씨 정보 없음";
}

export function getWeatherRecommendation(pty, sky) {
  const type = getWeatherType(pty, sky);

  const recommendations = {
    clear: "가벼운 셔츠 + 데님 팬츠 + 스니커즈 추천",
    cloudy: "얇은 가디건 + 니트 + 와이드 팬츠 추천",
    overcast: "가벼운 자켓 + 니트 + 와이드 팬츠 추천",
    rain: "생활방수 자켓 + 긴 바지 + 방수 신발 추천",
    snow: "패딩 + 기모 팬츠 + 방한 부츠 추천",
  };

  return recommendations[type] ?? "오늘 날씨에 맞는 코디를 준비하고 있어요.";
}