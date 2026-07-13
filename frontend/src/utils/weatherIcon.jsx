import {
  Cloud,
  CloudRain,
  CloudSun,
  Snowflake,
  Sun,
} from "lucide-react";

export default function WeatherIcon({ type = "cloudy", size = 42 }) {
  switch (type) {
    case "clear":
      return <Sun size={size} />;

    case "cloudy":
      return <CloudSun size={size} />;

    case "overcast":
      return <Cloud size={size} />;

    case "rain":
      return <CloudRain size={size} />;

    case "snow":
      return <Snowflake size={size} />;

    default:
      return <CloudSun size={size} />;
  }
}