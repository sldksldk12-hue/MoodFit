/**
 * 파일: src/services/api.js
 * 분류: API 통신 모듈
 *
 * 역할
 * - Axios 인스턴스와 MoodFit 백엔드 엔드포인트별 요청 함수를 한곳에 모읍니다.
 *
 * 사용 기술
 * - Axios, JWT Authorization header, async/await
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
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
  const response = await api.get("/api/products");
  return response.data;
};
//상세페이지
export const getDetail = async (id) => {
  const response = await api.get(`/api/products/${id}`);
  return response.data;
};
const notifyCartUpdated = () => {
  window.dispatchEvent(
    new CustomEvent("cart-updated")
  );
};

//장바구니 조회
export const getCartItems = async (userId) => {
  const response = await api.get(`/api/cart/${userId}`);
  return response.data;
};
//장바구니 추가
export const addCartItem = async (data) => {
  const response = await api.post("/api/cart/", data);
  notifyCartUpdated();
  return response.data;
};
//장바구니 수정
export const updateCartItemQuantity = async (
  cartItemId,
  userId,
  quantity
) => {
  const response = await api.put(`/api/cart/${cartItemId}`, {
    user_id: Number(userId),
    quantity: Number(quantity),
  });
  notifyCartUpdated();

  return response.data;
};
//장바구니 삭제
export const deleteCartItem = async (cartItemId, userId) => {
  const response = await api.delete(`/api/cart/${cartItemId}`, {
    params: { user_id: userId },
  });
  notifyCartUpdated();

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

// ===========================
// 좋아요(찜) 기능
// ===========================

// 상품 찜하기 / 찜 취소
export const toggleLike = async (userId, productId) => {
  const response = await api.post("/api/likes/", {
    user_id: Number(userId),
    product_id: Number(productId),
  });

  return response.data;
};

// 내가 찜한 상품 목록 조회
export const getUserLikes = async (userId) => {
  const response = await api.get(`/api/likes/${userId}`);

  return response.data;
};