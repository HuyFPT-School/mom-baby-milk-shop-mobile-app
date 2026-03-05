import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import mockApi from "./mockApi";

// TOGGLE THIS TO USE MOCK DATA (set to true when backend is down)
const USE_MOCK_API = true;

const BASE_URL = "https://mom-baby-milk-server.vercel.app/";

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach token to every request
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

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");
        const { data } = await axios.post(
          `${BASE_URL}/api/auth/token`,
          {},
          {
            headers: { Authorization: `Bearer ${refreshToken}` },
          },
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
  login: (email: string, password: string) =>
    USE_MOCK_API
      ? mockApi.auth.login(email, password)
      : api.post("/api/auth/login", { email, password }),
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) =>
    USE_MOCK_API
      ? mockApi.auth.register(data)
      : api.post("/api/auth/register", data),
  logout: () => api.post("/api/auth/logout"),
  getProfile: () =>
    USE_MOCK_API ? mockApi.auth.getProfile() : api.get("/api/users/profile"),
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const productApi = {
  getAll: (params?: {
    category?: string;
    brand?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) =>
    USE_MOCK_API
      ? mockApi.products.getAll(params)
      : api.get("/api/products", { params }),
  getById: (id: string) =>
    USE_MOCK_API
      ? mockApi.products.getById(id)
      : api.get(`/api/products/${id}`),
  getFeatured: () =>
    USE_MOCK_API
      ? mockApi.products.getFeatured()
      : api.get("/api/products", { params: { limit: 8, sort: "newest" } }),
};

// ─── Categories ──────────────────────────────────────────────────────────────
export const categoryApi = {
  getAll: () =>
    USE_MOCK_API ? mockApi.categories.getAll() : api.get("/api/categories"),
};

// ─── Brands ──────────────────────────────────────────────────────────────────
export const brandApi = {
  getAll: () =>
    USE_MOCK_API ? mockApi.brands.getAll() : api.get("/api/brands"),
};

// ─── Cart / Checkout ─────────────────────────────────────────────────────────
export const checkoutApi = {
  createOrder: (data: object) => api.post("/api/checkout", data),
};

// ─── Orders ──────────────────────────────────────────────────────────────────
export const orderApi = {
  getMyOrders: () =>
    USE_MOCK_API
      ? mockApi.orders.getMyOrders()
      : api.get("/api/orders/my-orders"),
  getById: (id: string) =>
    USE_MOCK_API ? mockApi.orders.getById(id) : api.get(`/api/orders/${id}`),
};

// ─── Wishlist ────────────────────────────────────────────────────────────────
export const wishlistApi = {
  get: () => api.get("/api/wishlist"),
  add: (productId: string) => api.post("/api/wishlist", { productId }),
  remove: (productId: string) => api.delete(`/api/wishlist/${productId}`),
};

// ─── Blog ────────────────────────────────────────────────────────────────────
export const blogApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    USE_MOCK_API
      ? mockApi.blogs.getAll(params)
      : api.get("/api/blogs", { params }),
  getById: (id: string) =>
    USE_MOCK_API ? mockApi.blogs.getById(id) : api.get(`/api/blogs/${id}`),
};

// ─── Points ──────────────────────────────────────────────────────────────────
export const pointApi = {
  getMyPoints: () => api.get("/api/points/my-points"),
};

export default api;
