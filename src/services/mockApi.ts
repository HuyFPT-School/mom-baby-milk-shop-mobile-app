// Mock API for testing when backend is not available
import { AxiosResponse } from "axios";

// Mock data
const mockProducts = [
  {
    _id: "1",
    name: "Sữa Enfamil A+ 1",
    brand: "Enfamil",
    category: "Sữa công thức",
    price: 450000,
    originalPrice: 500000,
    image: "https://via.placeholder.com/300x300?text=Enfamil+A%2B",
    description: "Sữa công thức cho trẻ 0-6 tháng",
    stock: 50,
    rating: 4.5,
    reviews: 120,
  },
  {
    _id: "2",
    name: "Sữa Similac Mom",
    brand: "Similac",
    category: "Sữa bà bầu",
    price: 380000,
    originalPrice: 420000,
    image: "https://via.placeholder.com/300x300?text=Similac+Mom",
    description: "Sữa dinh dưỡng cho bà bầu và cho con bú",
    stock: 30,
    rating: 4.7,
    reviews: 85,
  },
  {
    _id: "3",
    name: "Sữa Aptamil Gold 3",
    brand: "Aptamil",
    category: "Sữa công thức",
    price: 520000,
    originalPrice: 580000,
    image: "https://via.placeholder.com/300x300?text=Aptamil+Gold",
    description: "Sữa công thức cho trẻ 1-2 tuổi",
    stock: 40,
    rating: 4.8,
    reviews: 200,
  },
  {
    _id: "4",
    name: "Sữa NAN Optipro 2",
    brand: "NAN",
    category: "Sữa công thức",
    price: 410000,
    originalPrice: 450000,
    image: "https://via.placeholder.com/300x300?text=NAN+Optipro",
    description: "Sữa công thức cho trẻ 6-12 tháng",
    stock: 60,
    rating: 4.6,
    reviews: 150,
  },
];

const mockCategories = [
  { _id: "1", name: "Sữa công thức", slug: "sua-cong-thuc" },
  { _id: "2", name: "Sữa bà bầu", slug: "sua-ba-bau" },
  { _id: "3", name: "Sữa cho con bú", slug: "sua-cho-con-bu" },
];

const mockBrands = [
  { _id: "1", name: "Enfamil", logo: "https://via.placeholder.com/100" },
  { _id: "2", name: "Similac", logo: "https://via.placeholder.com/100" },
  { _id: "3", name: "Aptamil", logo: "https://via.placeholder.com/100" },
  { _id: "4", name: "NAN", logo: "https://via.placeholder.com/100" },
];

const mockBlogs = [
  {
    _id: "1",
    title: "Cách chọn sữa phù hợp cho bé",
    excerpt: "Hướng dẫn chi tiết cách chọn sữa công thức cho trẻ sơ sinh...",
    image: "https://via.placeholder.com/400x250?text=Blog+1",
    author: "Admin",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "2",
    title: "Dinh dưỡng cho bà bầu",
    excerpt: "Những lưu ý về dinh dưỡng trong thai kỳ...",
    image: "https://via.placeholder.com/400x250?text=Blog+2",
    author: "Admin",
    createdAt: new Date().toISOString(),
  },
];

// Helper to create mock response
const createMockResponse = <T>(data: T): Promise<AxiosResponse<T>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data,
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      });
    }, 500); // Simulate network delay
  });
};

// Mock API endpoints
export const mockApi = {
  // Auth
  auth: {
    login: (email: string, password: string) => {
      console.log("🔥 MOCK: Login", { email, password });
      return createMockResponse({
        success: true,
        accessToken: "mock_access_token_12345",
        refreshToken: "mock_refresh_token_67890",
        user: {
          _id: "user1",
          name: "Test User",
          email,
          role: "customer",
        },
      });
    },
    register: (data: any) => {
      console.log("🔥 MOCK: Register", data);
      return createMockResponse({
        success: true,
        message: "Đăng ký thành công",
        user: { ...data, _id: "user1", role: "customer" },
      });
    },
    getProfile: () => {
      return createMockResponse({
        success: true,
        user: {
          _id: "user1",
          name: "Test User",
          email: "test@example.com",
          phone: "0123456789",
          role: "customer",
        },
      });
    },
  },

  // Products
  products: {
    getAll: (params?: any) => {
      console.log("🔥 MOCK: Get all products", params);
      let filtered = [...mockProducts];

      if (params?.search) {
        filtered = filtered.filter((p) =>
          p.name.toLowerCase().includes(params.search.toLowerCase()),
        );
      }
      if (params?.category) {
        filtered = filtered.filter((p) => p.category === params.category);
      }
      if (params?.brand) {
        filtered = filtered.filter((p) => p.brand === params.brand);
      }

      return createMockResponse({
        success: true,
        products: filtered,
        total: filtered.length,
      });
    },
    getById: (id: string) => {
      console.log("🔥 MOCK: Get product by ID", id);
      const product = mockProducts.find((p) => p._id === id);
      return createMockResponse({
        success: true,
        product: product || mockProducts[0],
      });
    },
    getFeatured: () => {
      console.log("🔥 MOCK: Get featured products");
      return createMockResponse({
        success: true,
        products: mockProducts.slice(0, 4),
      });
    },
  },

  // Categories
  categories: {
    getAll: () => {
      console.log("🔥 MOCK: Get all categories");
      return createMockResponse({
        success: true,
        categories: mockCategories,
      });
    },
  },

  // Brands
  brands: {
    getAll: () => {
      console.log("🔥 MOCK: Get all brands");
      return createMockResponse({
        success: true,
        brands: mockBrands,
      });
    },
  },

  // Blogs
  blogs: {
    getAll: (params?: any) => {
      console.log("🔥 MOCK: Get all blogs", params);
      return createMockResponse({
        success: true,
        blogs: mockBlogs,
        total: mockBlogs.length,
      });
    },
    getById: (id: string) => {
      console.log("🔥 MOCK: Get blog by ID", id);
      const blog = mockBlogs.find((b) => b._id === id);
      return createMockResponse({
        success: true,
        blog: blog || mockBlogs[0],
      });
    },
  },

  // Orders
  orders: {
    getMyOrders: () => {
      console.log("🔥 MOCK: Get my orders");
      return createMockResponse({
        success: true,
        orders: [],
      });
    },
    getById: (id: string) => {
      console.log("🔥 MOCK: Get order by ID", id);
      return createMockResponse({
        success: true,
        order: null,
      });
    },
  },

  // Checkout
  checkout: {
    createOrder: (data: any) => {
      console.log("🔥 MOCK: Create order", data);
      return createMockResponse({
        success: true,
        orderId: "order_" + Date.now(),
        message: "Đặt hàng thành công",
      });
    },
  },
};

export default mockApi;
