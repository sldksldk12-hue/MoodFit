import axios from "axios";
import { clearRequestCache } from "./requestCache";

const resolveAdminBaseUrl = () => {
  if (import.meta.env.PROD) {
    return "/api/admin";
  }
  let raw = import.meta.env.VITE_API_BASE_URL;
  let url = raw
    ? `${raw}/api/admin`
    : "https://moodfit.kro.kr/api/admin";
  if (url.includes("moodfit.kro.kr") && url.startsWith("http://")) {
    url = url.replace("http://", "https://");
  }
  return url;
};

const BASE_ADMIN_URL = resolveAdminBaseUrl();

const adminApi = axios.create({
  baseURL: import.meta.env.PROD ? "/api/admin" : BASE_ADMIN_URL,
  headers: { "Content-Type": "application/json;charset=utf-8" },
});

if (import.meta.env.PROD) {
  adminApi.defaults.baseURL = "/api/admin";
}

adminApi.interceptors.request.use((config) => {
  if (import.meta.env.PROD) {
    config.baseURL = "/api/admin";
  } else if (typeof window !== "undefined" && window.location.protocol === "https:") {
    if (config.url && config.url.startsWith("http://")) {
      config.url = config.url.replace("http://", "https://");
    }
    if (config.baseURL && config.baseURL.startsWith("http://")) {
      config.baseURL = config.baseURL.replace("http://", "https://");
    }
  }
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const unwrap = (request) => request.then((response) => response.data);

export const uploadAdminImage = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const token = localStorage.getItem("token");
  return axios.post(`${BASE_ADMIN_URL}/upload/image`, formData, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then((res) => res.data);
};

export const getAdminDashboard = () => unwrap(adminApi.get("/dashboard"));
export const getAdminCategories = () => unwrap(adminApi.get("/categories"));
export const getAdminProducts = (params = {}) => unwrap(adminApi.get("/products", { params }));
export const analyzeAdminProduct = (payload) => unwrap(adminApi.post("/products/analyze", payload));
export const createAdminProduct = (payload) =>
  unwrap(adminApi.post("/products", payload)).then((res) => {
    clearRequestCache();
    return res;
  });
export const updateAdminProduct = (id, payload) =>
  unwrap(adminApi.patch(`/products/${id}`, payload)).then((res) => {
    clearRequestCache();
    return res;
  });
export const deleteAdminProduct = (id) =>
  unwrap(adminApi.delete(`/products/${id}`)).then((res) => {
    clearRequestCache();
    return res;
  });
export const getAdminOrders = (params = {}) => unwrap(adminApi.get("/orders", { params }));
export const updateAdminOrderStatus = (id, orderStatus) =>
  unwrap(adminApi.patch(`/orders/${id}/status`, { order_status: orderStatus }));
export const getAdminInquiries = (params = {}) => unwrap(adminApi.get("/inquiries", { params }));
export const replyAdminInquiry = (id, replyContent) =>
  unwrap(adminApi.patch(`/inquiries/${id}/reply`, { reply_content: replyContent }));
export const getAdminUsers = (params = {}) => unwrap(adminApi.get("/users", { params }));
export const updateAdminUserRole = (id, adminRole) =>
  unwrap(adminApi.patch(`/users/${id}/role`, { admin_role: adminRole }));
export const getAdminReviews = (params = {}) => unwrap(adminApi.get("/reviews", { params }));
export const deleteAdminReview = (id) => unwrap(adminApi.delete(`/reviews/${id}`));
