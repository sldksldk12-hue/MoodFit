import axios from "axios";

const adminApi = axios.create({
  baseURL: "http://127.0.0.1:8000/api/admin",
  headers: { "Content-Type": "application/json;charset=utf-8" },
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const unwrap = (request) => request.then((response) => response.data);

export const getAdminDashboard = () => unwrap(adminApi.get("/dashboard"));
export const getAdminCategories = () => unwrap(adminApi.get("/categories"));
export const getAdminProducts = (params = {}) => unwrap(adminApi.get("/products", { params }));
export const updateAdminProduct = (id, payload) => unwrap(adminApi.patch(`/products/${id}`, payload));
export const deleteAdminProduct = (id) => unwrap(adminApi.delete(`/products/${id}`));
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
