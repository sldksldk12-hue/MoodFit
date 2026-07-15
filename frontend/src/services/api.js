import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json;charset=utf-8",
  },
});
export const getFestival = async () => {
  const response = await api.get("/moodfit/festival")
  return response.data;
};
//날씨
export const getWeather = async () => {
  const response = await api.get("/api/weather");
  return response.data;
};

export const getList = async () => {
  const response = await api.get("/moodfit/list");
  return response.data;
};
// 로그인
export const login = (username, password) => {
  const params = new URLSearchParams();
  params.append("username", username);
  params.append("password", password);

  return api.post("/moodfit/login", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
};

// 내 정보 조회
export const getMe = () => {
  const token = localStorage.getItem("token");

  return api.get("/moodfit/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
// 회원가입
export const register = async (userData) => {
  const response = await api.post("/moodfit/register", userData);
  return response.data;
}

export default api; 