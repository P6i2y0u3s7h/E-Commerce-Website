/**
 * Centralized API service layer.
 * All HTTP calls go through this file.
 * Automatically attaches JWT from localStorage to protected requests.
 */
import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import type {
  User,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  Product,
  ProductCreate,
  ProductUpdate,
  SearchSuggestion,
  FilterMeta,
  ProductRecommendations,
  WishlistItem,
  ReviewStats,
  Review,
  ReviewCreate,
  Address,
  AddressCreate,
  Coupon,
  CouponCreate,
  CouponValidation,
  Order,
  OrderCreate,
  OrderTracking,
  OrderStatus,
  AdminStats,
  AdminUser,
} from '../types';

const BASE_URL = 'http://localhost:8000';

// Create the Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token if present in localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401s (token expiry)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't treat a failed login attempt as "session expired"
      if (!error.config?.url?.includes('/auth/login')) {
        localStorage.removeItem('access_token');
        // Notify AuthContext to clear user state
        window.dispatchEvent(new Event('auth:logout'));
      }
    }
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

export const authApi = {
  register: async (data: RegisterRequest): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/login', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  updateProfile: async (data: { first_name?: string; last_name?: string; email?: string }): Promise<User> => {
    const response = await apiClient.put<User>('/auth/profile', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.put<{ message: string }>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string; reset_token?: string }> => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/reset-password', {
      token,
      new_password: newPassword,
    });
    return response.data;
  },
};

// ---------------------------------------------------------------------------
// Products API
// ---------------------------------------------------------------------------

export interface ProductQueryParams {
  search?: string;
  category?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  min_rating?: number;
  sort?: string;
  skip?: number;
  limit?: number;
}

export const productsApi = {
  getAll: async (params?: ProductQueryParams): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>('/products', {
      params,
    });
    return response.data;
  },

  getById: async (id: number): Promise<Product> => {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  },

  getSuggestions: async (q: string): Promise<SearchSuggestion[]> => {
    const response = await apiClient.get<SearchSuggestion[]>('/products/search/suggestions', {
      params: { q },
    });
    return response.data;
  },

  getFilterMeta: async (): Promise<FilterMeta> => {
    const response = await apiClient.get<FilterMeta>('/products/meta/filters');
    return response.data;
  },

  getRecommendations: async (productId: number): Promise<ProductRecommendations> => {
    const response = await apiClient.get<ProductRecommendations>(`/products/${productId}/recommendations`);
    return response.data;
  },

  create: async (data: ProductCreate): Promise<Product> => {
    const response = await apiClient.post<Product>('/products', data);
    return response.data;
  },

  update: async (id: number, data: ProductUpdate): Promise<Product> => {
    const response = await apiClient.put<Product>(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },
};

// ---------------------------------------------------------------------------
// Wishlist API
// ---------------------------------------------------------------------------

export const wishlistApi = {
  getAll: async (): Promise<WishlistItem[]> => {
    const response = await apiClient.get<WishlistItem[]>('/wishlist');
    return response.data;
  },

  add: async (productId: number): Promise<WishlistItem> => {
    const response = await apiClient.post<WishlistItem>(`/wishlist/${productId}`);
    return response.data;
  },

  remove: async (productId: number): Promise<void> => {
    await apiClient.delete(`/wishlist/${productId}`);
  },

  check: async (productId: number): Promise<{ in_wishlist: boolean }> => {
    const response = await apiClient.get<{ in_wishlist: boolean }>(`/wishlist/check/${productId}`);
    return response.data;
  },
};

// ---------------------------------------------------------------------------
// Reviews API
// ---------------------------------------------------------------------------

export const reviewsApi = {
  getByProduct: async (productId: number): Promise<ReviewStats> => {
    const response = await apiClient.get<ReviewStats>(`/products/${productId}/reviews`);
    return response.data;
  },

  create: async (productId: number, data: ReviewCreate): Promise<Review> => {
    const response = await apiClient.post<Review>(`/products/${productId}/reviews`, data);
    return response.data;
  },

  update: async (reviewId: number, data: Partial<ReviewCreate>): Promise<Review> => {
    const response = await apiClient.put<Review>(`/reviews/${reviewId}`, data);
    return response.data;
  },

  delete: async (reviewId: number): Promise<void> => {
    await apiClient.delete(`/reviews/${reviewId}`);
  },

  getMyReviews: async (): Promise<Review[]> => {
    const response = await apiClient.get<Review[]>('/reviews/me');
    return response.data;
  },
};

// ---------------------------------------------------------------------------
// Addresses API
// ---------------------------------------------------------------------------

export const addressesApi = {
  getAll: async (): Promise<Address[]> => {
    const response = await apiClient.get<Address[]>('/addresses');
    return response.data;
  },

  create: async (data: AddressCreate): Promise<Address> => {
    const response = await apiClient.post<Address>('/addresses', data);
    return response.data;
  },

  update: async (id: number, data: Partial<AddressCreate>): Promise<Address> => {
    const response = await apiClient.put<Address>(`/addresses/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/addresses/${id}`);
  },

  setDefault: async (id: number): Promise<Address> => {
    const response = await apiClient.patch<Address>(`/addresses/${id}/default`);
    return response.data;
  },
};

// ---------------------------------------------------------------------------
// Coupons API
// ---------------------------------------------------------------------------

export const couponsApi = {
  validate: async (code: string, orderAmount: number): Promise<CouponValidation> => {
    const response = await apiClient.post<CouponValidation>('/coupons/validate', {
      code,
      order_amount: orderAmount,
    });
    return response.data;
  },

  adminList: async (): Promise<Coupon[]> => {
    const response = await apiClient.get<Coupon[]>('/coupons');
    return response.data;
  },

  adminCreate: async (data: CouponCreate): Promise<Coupon> => {
    const response = await apiClient.post<Coupon>('/coupons', data);
    return response.data;
  },

  adminDelete: async (id: number): Promise<void> => {
    await apiClient.delete(`/coupons/${id}`);
  },
};

// ---------------------------------------------------------------------------
// Orders API
// ---------------------------------------------------------------------------

export const ordersApi = {
  create: async (data: OrderCreate): Promise<Order> => {
    const response = await apiClient.post<Order>('/orders', data);
    return response.data;
  },

  getAll: async (): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>('/orders');
    return response.data;
  },

  getById: async (id: number): Promise<Order> => {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  },

  getTracking: async (id: number): Promise<OrderTracking> => {
    const response = await apiClient.get<OrderTracking>(`/orders/${id}/tracking`);
    return response.data;
  },

  cancel: async (id: number): Promise<Order> => {
    const response = await apiClient.post<Order>(`/orders/${id}/cancel`);
    return response.data;
  },
};

// ---------------------------------------------------------------------------
// Admin API
// ---------------------------------------------------------------------------

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const response = await apiClient.get<AdminStats>('/admin/stats');
    return response.data;
  },

  getOrders: async (status?: OrderStatus, skip = 0, limit = 50): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>('/admin/orders', {
      params: { status, skip, limit },
    });
    return response.data;
  },

  updateOrderStatus: async (orderId: number, newStatus: OrderStatus): Promise<Order> => {
    const response = await apiClient.patch<Order>(`/admin/orders/${orderId}/status`, {
      status: newStatus,
    });
    return response.data;
  },

  getUsers: async (skip = 0, limit = 50): Promise<AdminUser[]> => {
    const response = await apiClient.get<AdminUser[]>('/admin/users', {
      params: { skip, limit },
    });
    return response.data;
  },

  updateUserRole: async (userId: number, role: string, isActive?: boolean): Promise<{ message: string }> => {
    const response = await apiClient.patch<{ message: string }>(`/admin/users/${userId}/role`, {
      role,
      is_active: isActive,
    });
    return response.data;
  },

  getLowStock: async (threshold = 10): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>('/admin/inventory/low-stock', {
      params: { threshold },
    });
    return response.data;
  },
};

// ---------------------------------------------------------------------------
// Helper: Extract error message from API error
// ---------------------------------------------------------------------------

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join(', ');
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}

export default apiClient;
