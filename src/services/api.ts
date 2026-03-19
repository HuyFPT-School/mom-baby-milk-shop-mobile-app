import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { Product, Brand, Category } from "../types";

// ─── Configuration ──────────────────────────────────────────────────────────
// Android emulator: 10.0.2.2 maps to host machine's localhost
// iOS simulator: localhost works directly
// Fallback: Vercel deployment

const USE_LOCAL = process.env.EXPO_PUBLIC_USE_LOCAL === "true";
const LOCAL_PORT = process.env.EXPO_PUBLIC_LOCAL_PORT ?? "3000";
const FALLBACK_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://mom-baby-milk-server.vercel.app";

const LOCAL_URL = Platform.select({
  android: `http://10.0.2.2:${LOCAL_PORT}`,
  ios: `http://localhost:${LOCAL_PORT}`,
  default: `http://localhost:${LOCAL_PORT}`,
});

// When USE_LOCAL=false, connect directly to Vercel (no timeout waste)
const BASE_URL = USE_LOCAL ? LOCAL_URL! : FALLBACK_URL;

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  // Short timeout when local so fallback kicks in fast; standard for Vercel
  timeout: USE_LOCAL ? 4_000 : 10_000,
  headers: { "Content-Type": "application/json" },
});

// ─── Request Interceptor (attach token) ─────────────────────────────────────

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor: Fallback to Vercel on network errors ─────────────

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (!original) {
      return Promise.reject(error);
    }

    // If local server unreachable, retry with Vercel fallback (only when USE_LOCAL)
    const isNetworkError =
      !error.response ||
      error.code === "ECONNABORTED" ||
      error.code === "ERR_NETWORK";
    if (USE_LOCAL && isNetworkError && !original._fallbackRetried) {
      original._fallbackRetried = true;
      original.baseURL = FALLBACK_URL;
      original.timeout = 10_000;
      console.log(
        "⚡ Retrying with fallback URL:",
        FALLBACK_URL + original.url,
      );
      return axios(original);
    }

    const status = error.response?.status;
    // data may be a plain string (e.g. "Forbidden") or an object
    const rawData = String(error.response?.data ?? "");
    const message =
      error.response?.data?.message || error.response?.data?.error || rawData;
    const isAuthLike403 =
      status === 403 &&
      /(token|jwt|expired|unauthori|forbidden)/i.test(message);

    // Auto-refresh on expired/invalid auth responses
    if ((status === 401 || isAuthLike403) && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");
        const { data } = await axios.post(
          `${original.baseURL || BASE_URL}/api/auth/token`,
          {},
          { headers: { Authorization: `Bearer ${refreshToken}` } },
        );
        await SecureStore.setItemAsync("accessToken", data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: {
    fullname: string;
    email: string;
    password: string;
    role?: string;
    phone?: string;
  }) => api.post("/api/auth/register", data),
  login: (email: string, password: string) =>
    api.post("/api/auth/login", { email, password }),
  logout: () => api.post("/api/auth/logout"),
  refreshToken: () => api.post("/api/auth/token"),
  verifyEmail: (data: { email: string; otp: string }) =>
    api.post("/api/auth/verify-email", data),
  forgetPassword: (email: string) =>
    api.post("/api/auth/forget-password", { email }),
  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    api.post("/api/auth/reset-password", data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post("/api/auth/change-password", data),
  resendOtp: (email: string) => api.post("/api/auth/send-reset-otp", { email }),
};

// ─── Users ───────────────────────────────────────────────────────────────────

export const userApi = {
  getAll: () => api.get("/api/users"),
  create: (data: object) => api.post("/api/users", data),
  getById: (id: string) => api.get(`/api/users/${id}`),
  update: (id: string, data: object) => api.patch(`/api/users/${id}`, data),
  delete: (id: string) => api.delete(`/api/users/${id}`),
  getMyVouchers: () => api.get("/api/users/my-vouchers"),
};

// ─── Products ────────────────────────────────────────────────────────────────

export const productApi = {
  getAll: (params?: {
    category?: string;
    brand?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get<{ data: Product[] }>("/api/product", { params }),
  create: (data: object) => api.post("/api/product", data),
  getById: (id: string) => api.get<{ data: Product }>(`/api/product/${id}`),
  update: (id: string, data: object) => api.patch(`/api/product/${id}`, data),
  delete: (id: string) => api.delete(`/api/product/${id}`),
  getByCategory: (id: string, params?: { page?: number; limit?: number }) =>
    api.get<{ data: Product[] }>(`/api/product/category/${id}`, { params }),
  getByBrand: (id: string, params?: { page?: number; limit?: number }) =>
    api.get<{ data: Product[] }>(`/api/product/brand/${id}`, { params }),
  // Comments
  createComment: (
    productId: string,
    data: { content: string; rating?: number },
  ) => api.post(`/api/product/${productId}/comments`, data),
  updateComment: (
    productId: string,
    commentId: string,
    data: { content?: string; rating?: number },
  ) => api.put(`/api/product/${productId}/comments/${commentId}`, data),
  deleteComment: (productId: string, commentId: string) =>
    api.delete(`/api/product/${productId}/comments/${commentId}`),
};

// ─── Categories ──────────────────────────────────────────────────────────────

export const categoryApi = {
  getAll: () => api.get<{ data: Category[] }>("/api/category"),
  create: (data: object) => api.post("/api/category", data),
  getById: (id: string) => api.get<{ data: Category }>(`/api/category/${id}`),
  update: (id: string, data: object) => api.patch(`/api/category/${id}`, data),
  delete: (id: string) => api.delete(`/api/category/${id}`),
};

// ─── Brands ──────────────────────────────────────────────────────────────────

export const brandApi = {
  getAll: () => api.get<{ data: Brand[] }>("/api/brand"),
  create: (data: object) => api.post("/api/brand", data),
  getById: (id: string) => api.get(`/api/brand/${id}`),
  update: (id: string, data: object) => api.patch(`/api/brand/${id}`, data),
  delete: (id: string) => api.delete(`/api/brand/${id}`),
};

// ─── Blogs ───────────────────────────────────────────────────────────────────

export const blogApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get("/api/blogs", { params }),
  create: (data: object) => api.post("/api/blogs", data),
  getPopular: () => api.get("/api/blogs/popular"),
  getByTags: (tags: string) => api.get(`/api/blogs/tags/${tags}`),
  getById: (id: string) => api.get(`/api/blogs/${id}`),
  update: (id: string, data: object) => api.put(`/api/blogs/${id}`, data),
  delete: (id: string) => api.delete(`/api/blogs/${id}`),
};

// ─── Checkout ────────────────────────────────────────────────────────────────

export const checkoutApi = {
  createOrder: (data: object) => api.post("/api/checkout", data),
};

// ─── Orders ──────────────────────────────────────────────────────────────────

export const orderApi = {
  getMyOrders: () => api.get("/api/orders/my-orders"),
  getAll: () => api.get("/api/orders"),
  getPreOrders: () => api.get("/api/orders/pre-orders"),
  getById: (id: string) => api.get(`/api/orders/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/api/orders/${id}/status`, { status }),
  cancel: (id: string, reason?: string) =>
    api.patch(`/api/orders/${id}/cancel`, { reason }),
  retryPayment: (id: string) => api.post(`/api/orders/${id}/retry-payment`),
  confirmDelivery: (id: string) =>
    api.patch(`/api/orders/${id}/confirm-delivery`),
  updateItemStatus: (orderId: string, itemIndex: number, status: string) =>
    api.patch(`/api/orders/${orderId}/items/${itemIndex}/status`, { status }),
  notifyPreorderReady: (orderId: string) =>
    api.post(`/api/orders/${orderId}/notify-preorder-ready`),
};

// ─── Points ──────────────────────────────────────────────────────────────────

export const pointApi = {
  getBalance: () => api.get("/api/points/balance"),
  getHistory: () => api.get("/api/points/history"),
  getRewards: () => api.get("/api/points/rewards"),
  redeemReward: (rewardId: string) =>
    api.post(`/api/points/rewards/${rewardId}/redeem`),
  // Admin
  adminGetRewards: () => api.get("/api/points/admin/rewards"),
  adminCreateReward: (data: object) =>
    api.post("/api/points/admin/rewards", data),
  adminUpdateReward: (id: string, data: object) =>
    api.put(`/api/points/admin/rewards/${id}`, data),
  adminDeleteReward: (id: string) =>
    api.delete(`/api/points/admin/rewards/${id}`),
};

// ─── Voucher ─────────────────────────────────────────────────────────────────

export const voucherApi = {
  getAll: () => api.get("/api/voucher"),
  validate: (code: string) => api.post("/api/voucher/validate", { code }),
  apply: (data: { code: string; orderTotal?: number }) =>
    api.post("/api/voucher/apply", data),
  createManual: (data: object) => api.post("/api/voucher/create-manual", data),
  createRandom: (data: object) => api.post("/api/voucher/create-random", data),
  assignToUser: (data: { voucherId: string; userId: string }) =>
    api.post("/api/voucher/assign-to-user", data),
  assignToAll: (data: { voucherId: string }) =>
    api.post("/api/voucher/assign-to-all", data),
  update: (id: string, data: object) => api.put(`/api/voucher/${id}`, data),
  delete: (id: string) => api.delete(`/api/voucher/${id}`),
  getByIdOrCode: (idOrCode: string) => api.get(`/api/voucher/${idOrCode}`),
};

// ─── Wishlist ────────────────────────────────────────────────────────────────

export const wishlistApi = {
  getAll: () => api.get("/api/wishlist"),
  add: (productId: string) => api.post("/api/wishlist", { productId }),
  remove: (productId: string) => api.delete(`/api/wishlist/${productId}`),
  clear: () => api.delete("/api/wishlist/clear"),
  check: (productId: string) => api.get(`/api/wishlist/check/${productId}`),
};

// ─── AI Assistant ────────────────────────────────────────────────────────────

export const aiApi = {
  chat: (data: { message: string; sessionId?: string }) =>
    api.post("/api/ai/chat", data),
  getHistory: (sessionId: string) => api.get(`/api/ai/history/${sessionId}`),
  deleteHistory: (sessionId: string) =>
    api.delete(`/api/ai/history/${sessionId}`),
  getUserHistories: (userId: string) =>
    api.get(`/api/ai/history/user/${userId}`),
};

// ─── Support ─────────────────────────────────────────────────────────────────

export const supportApi = {
  createTicket: (data: { subject: string; message: string }) =>
    api.post("/api/support/conversations", data),
  getTickets: () => api.get("/api/support/conversations"),
  getTicketById: (id: string) => api.get(`/api/support/conversations/${id}`),
  assignTicket: (id: string) =>
    api.patch(`/api/support/conversations/${id}/assign`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/api/support/conversations/${id}/status`, { status }),
  closeTicket: (id: string) =>
    api.patch(`/api/support/conversations/${id}/close`),
  getMessages: (id: string) =>
    api.get(`/api/support/conversations/${id}/messages`),
  sendMessage: (id: string, data: { content: string }) =>
    api.post(`/api/support/conversations/${id}/messages`, data),
};

// ─── Analytics ───────────────────────────────────────────────────────────────

export const analyticsApi = {
  getRevenueSummary: () => api.get("/api/analytics/revenue-summary"),
  getRevenue: (params?: { startDate?: string; endDate?: string }) =>
    api.get("/api/analytics/revenue", { params }),
  getRevenueChart: (params?: { period?: string }) =>
    api.get("/api/analytics/revenue/chart", { params }),
  getTopProducts: (params?: { limit?: number }) =>
    api.get("/api/analytics/top-products", { params }),
  getOrdersStats: () => api.get("/api/analytics/orders-stats"),
  getCustomersStats: () => api.get("/api/analytics/customers-stats"),
  getRevenueByCategory: () => api.get("/api/analytics/revenue-by-category"),
};

// ─── Upload ──────────────────────────────────────────────────────────────────

export const uploadApi = {
  avatar: (formData: FormData) =>
    api.post("/api/upload/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  productImage: (formData: FormData) =>
    api.post("/api/upload/product-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  brandLogo: (formData: FormData) =>
    api.post("/api/upload/brand-logo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  blogImage: (formData: FormData) =>
    api.post("/api/upload/blog-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export default api;
