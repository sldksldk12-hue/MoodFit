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
import { getCachedRequest, invalidateRequestCache } from "./requestCache";

const BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json;charset=utf-8",
  },
});
export const getFestival = () =>
  getCachedRequest("festival:v2", async () => {
    const response = await api.get("/api/festival");
    if (response.data?.error) throw new Error(response.data.error);

    // 백엔드 응답 형태가 달라도 축제 배열 자체를 반환하도록 정리합니다.
    const payload = response.data;
    return (
      payload?.data ??
      payload?.items ??
      payload?.response?.body?.items?.item ??
      payload ??
      []
    );
  }, 30 * 60 * 1000);
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
    "/api/chat/emotion/",
    payload
  );

 return response.data;
};
//날씨
export const getWeather = () =>
  getCachedRequest("weather", async () => {
    const response = await api.get("/api/weather");
    return response.data;
  }, 10 * 60 * 1000);

export const getList = () =>
  getCachedRequest("products:list", async () => {
    const response = await api.get("/api/products/");
    return response.data;
  }, 5 * 60 * 1000);
//상세페이지
export const getDetail = (id) =>
  getCachedRequest(`products:detail:${id}`, async () => {
    const response = await api.get(`/api/products/${id}`);
    return response.data;
  }, 5 * 60 * 1000);
const notifyCartUpdated = () => {
  window.dispatchEvent(
    new CustomEvent("cart-updated")
  );
};

//장바구니 조회
export const getCartItems = (userId) =>
  getCachedRequest(`cart:${userId}`, async () => {
    const response = await api.get(`/api/cart/${userId}`);
    return response.data;
  }, 30 * 1000);
//장바구니 추가
export const addCartItem = async (data) => {
  const response = await api.post("/api/cart", data);
  invalidateRequestCache("cart:");
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
  invalidateRequestCache("cart:");
  notifyCartUpdated();

  return response.data;
};
//장바구니 삭제
export const deleteCartItem = async (cartItemId, userId) => {
  const response = await api.delete(`/api/cart/${cartItemId}`, {
    params: { user_id: userId },
  });
  invalidateRequestCache("cart:");
  notifyCartUpdated();

  return response.data;
};
// 로그인
export const login = (username, password) => {
  const params = new URLSearchParams();
  params.append("username", username);
  params.append("password", password);

  return api.post("/moodfit/login/", params, {
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
  const response = await api.post("/moodfit/register/", userData);
  return response.data;
}

// 취향 정보 수정
export const updatePreference = async (preferenceData) => {
  const token = localStorage.getItem("token");
  const response = await api.put("/moodfit/preference", preferenceData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// ===========================
// 좋아요(찜) 기능
// ===========================

// 상품 찜하기 / 찜 취소
export const toggleLike = async (userId, productId) => {
  const response = await api.post("/api/likes/", {
    user_id: Number(userId),
    product_id: Number(productId),
  });
  invalidateRequestCache(`likes:${userId}`);
  invalidateRequestCache(`products:detail:${productId}`);
  invalidateRequestCache("products:list");
  return response.data;
};

// 내가 찜한 상품 목록 조회
export const getUserLikes = (userId) =>
  getCachedRequest(`likes:${userId}`, async () => {
    const response = await api.get(`/api/likes/${userId}`);
    return response.data;
  }, 5 * 60 * 1000);
  // ===========================
// 최근 본 상품
// ===========================

// 상품 상세페이지를 조회했을 때 기록 및 체류시간(dwell_time) 저장
export const addProductHistory = async (userId, productId, dwellTime = 0) => {
  const response = await api.post("/api/history/", {
    user_id: Number(userId),
    product_id: Number(productId),
    dwell_time: Number(dwellTime || 0),
  });

  // 조회 목록 캐시를 사용할 경우 기존 캐시 제거
  invalidateRequestCache(`history:${userId}`);

  return response.data;
};

// 사용자의 최근 본 상품 목록 조회
export const getProductHistory = (userId) =>
  getCachedRequest(
    `history:${userId}`,
    async () => {
      const response = await api.get(`/api/history/${userId}`);
      return response.data;
    },
    30 * 1000
  );
  // ===========================
// 리뷰
// ===========================

// 사용자가 작성한 리뷰 목록 조회
export const getUserReviews = async (userId) => {
  const response = await api.get(
    `/api/reviews/user/${userId}`
  );

  return response.data;
};

// 특정 상품의 리뷰 목록 조회
export const getProductReviews = async (productId) => {
  const response = await api.get(
    `/api/reviews/product/${productId}`
  );

  return response.data;
};

// 리뷰 작성
export const createReview = async (reviewData) => {
  try {
    const payload = {
      user_id: Number(reviewData.userId),
      product_id: Number(reviewData.productId),
      order_item_id: Number(reviewData.orderItemId),
      rating: Number(reviewData.rating),
      content: reviewData.content.trim(),

      // 이미지가 있으면 배열 형태로 전달하고,
      // 이미지가 없으면 null을 전달합니다.
      image_url: reviewData.imageUrl
        ? [reviewData.imageUrl]
        : null,
    };

    const response = await api.post(
      "/api/reviews/",
      payload
    );

    // 백엔드에서 상품 평균 평점이 변경되므로 기존 상품 캐시를 제거합니다.
    invalidateRequestCache(`products:detail:${reviewData.productId}`);
    invalidateRequestCache("products:list");

    return response.data;
  } catch (error) {
    console.error("리뷰 등록 API 오류:", error);
    throw error;
  }
};


// ===========================
// 상품 문의(Q&A)
// ===========================

// 특정 상품의 문의 목록 조회
export const getProductInquiries = async (productId) => {
  const response = await api.get(
    `/api/inquiries/product/${productId}`
  );

  return response.data;
};

// 로그인 사용자의 상품 문의 등록
export const createInquiry = async ({
  userId,
  productId,
  title,
  content,
}) => {
  const response = await api.post(
    "/api/inquiries/",
    {
      user_id: Number(userId),
      product_id: Number(productId),
      title: title.trim(),
      content: content.trim(),
    }
  );

  return response.data;
};

// ===========================
// 배송지
// ===========================

// 사용자의 저장된 배송지 목록 조회
export const getUserAddresses = async (userId) => {
  const response = await api.get(`/api/addresses/user/${userId}`);
  return response.data;
};

// 배송지 추가
export const createAddress = async (addressData) => {
  const response = await api.post("/api/addresses/", {
    user_id: Number(addressData.userId),
    receiver_name: addressData.receiverName.trim(),
    call_number: addressData.callNumber.trim(),
    user_address: addressData.userAddress.trim(),
    zip_code: addressData.zipCode.trim(),
    address_detail: addressData.addressDetail.trim(),
    delivery_request: addressData.deliveryRequest?.trim() || null,
    is_default: Boolean(addressData.isDefault),
  });

  return response.data;
};

// ===========================
// 주문
// ===========================

// 주문 생성
export const createOrder = async ({
  userId,
  addressId,
  addressInfo,
  selectedOrder,
  items,
}) => {
  const payload = {
    user_id: Number(userId),
    address_id: addressId ? Number(addressId) : null,
    address_info: addressId
      ? null
      : {
          receiver_name: addressInfo.receiverName.trim(),
          call_number: addressInfo.callNumber.trim(),
          user_address: addressInfo.userAddress.trim(),
          zip_code: addressInfo.zipCode.trim(),
          address_detail: addressInfo.addressDetail.trim(),
          delivery_request:
            addressInfo.deliveryRequest?.trim() || null,
        },
    selected_order: selectedOrder,
    items: items.map((item) => ({
      product_id: Number(item.productId),
      quantity: Number(item.quantity),
      selected_size: item.selectedSize || "FREE",
      selected_color: item.selectedColor || "기본",
    })),
  };

  const response = await api.post("/api/orders/", payload);

  invalidateRequestCache(`cart:${userId}`);
  invalidateRequestCache(`orders:${userId}`);

  return response.data;
};

// 사용자 주문 목록 조회
export const getUserOrders = async (userId) => {
  const response = await api.get(`/api/orders/user/${userId}`);
  return response.data;
};

// 단일 주문 상세 조회
export const getOrderDetail = async (orderId) => {
  const response = await api.get(`/api/orders/${orderId}`);
  return response.data;
};
export const updateAddress = async (
  addressId,
  addressData
) => {
  const response = await api.put(
    `/api/addresses/${addressId}`,
    {
      receiver_name: addressData.receiverName.trim(),
      call_number: addressData.callNumber.trim(),
      user_address: addressData.userAddress.trim(),
      zip_code: addressData.zipCode.trim(),
      address_detail:
        addressData.addressDetail.trim(),
      delivery_request:
        addressData.deliveryRequest?.trim() || null,
      is_default: Boolean(addressData.isDefault),
    }
  );

  return response.data;
};

export const deleteAddress = async (addressId) => {
  const response = await api.delete(
    `/api/addresses/${addressId}`
  );

  return response.data;
};
