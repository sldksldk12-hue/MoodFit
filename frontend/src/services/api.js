import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json;charset=utf-8",
  },
});
export const getFestival = async () => {
  const response = await api.get("/api/festival");

  console.log("백엔드 응답 전체:", response.data);

  if (response.data.error) {
    throw new Error(response.data.error);
  }

  return response.data.data ?? [];
};
//chat
// chat
export const chatStart = async ({
  userId = 1,
  message,
  sessionId = null,
}) => {
  const payload = {
    user_id: Number(userId),
    message: String(message).trim(),
  };

  // sessionId가 실제 숫자일 때만 요청에 포함
  if (
    sessionId !== null &&
    sessionId !== undefined &&
    sessionId !== ""
  ) {
    payload.session_id = Number(sessionId);
  }

  console.log("채팅 요청 payload:", payload);

  const response = await api.post(
    "/api/chat/emotion",
    payload
  );

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