/**
 * Centralized API service layer.
 * All HTTP calls go through this file.
 * Automatically attaches JWT from localStorage to protected requests.
 *
 * API base URL is driven by the VITE_API_URL environment variable.
 *   - Development: set VITE_API_URL in frontend/.env.local, or it falls back to http://localhost:8000
 *   - Production:  set VITE_API_URL=https://your-backend.vercel.app in Vercel environment variables
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

// ---------------------------------------------------------------------------
// Base URL — driven by environment variable, never falls back to frontend origin
// ---------------------------------------------------------------------------
const PRODUCTION_BACKEND_URL = 'https://e-commerce-website-one-phi-12.vercel.app';

let rawBaseUrl = (import.meta.env.VITE_API_URL || '').trim();

// Detect local environment (both Vite dev server :5173 and Vite preview server :4173)
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0');

const isPlaceholder =
  !rawBaseUrl ||
  rawBaseUrl.includes('your-backend-api.vercel.app') ||
  rawBaseUrl.includes('example.com');

// Fall back to local FastAPI server when running locally in dev or preview mode
if (isPlaceholder && (import.meta.env.DEV || isLocalhost)) {
  rawBaseUrl = 'http://localhost:8000';
} else if (isPlaceholder) {
  // In production, strictly point to the deployed FastAPI backend.
  // Never fall back to window.location.origin or relative path.
  rawBaseUrl = PRODUCTION_BACKEND_URL;
}

// Automatically ensure protocol scheme (https:// or http://) is present.
// Prevents browser "Network Error" when users configure VITE_API_URL without https://
if (rawBaseUrl && !rawBaseUrl.startsWith('http://') && !rawBaseUrl.startsWith('https://')) {
  if (rawBaseUrl.includes('localhost') || rawBaseUrl.includes('127.0.0.1')) {
    rawBaseUrl = `http://${rawBaseUrl}`;
  } else {
    rawBaseUrl = `https://${rawBaseUrl}`;
  }
}

const BASE_URL = (rawBaseUrl || PRODUCTION_BACKEND_URL).replace(/\/+$/, '');

// Create the Axios instance
export const apiClient: AxiosInstance = axios.create({
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

// Response interceptor: Handle 401s (token expiry) & 405s (misconfigured API URL)
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
    } else if (error.response?.status === 405 && !BASE_URL) {
      console.error(
        `[ShopWave API] Request to "${error.config?.url}" failed with 405 Method Not Allowed. ` +
        `Root cause: VITE_API_URL is missing in Vercel Frontend environment variables, causing requests to be sent to the static frontend host.`
      );
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

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>('/auth/profile', data);
    return response.data;
  },

  // Called as: authApi.changePassword(currentPassword, newPassword)
  changePassword: async (
    current_password: string,
    new_password: string
  ): Promise<{ message: string }> => {
    const response = await apiClient.put<{ message: string }>(
      '/auth/change-password',
      { current_password, new_password }
    );
    return response.data;
  },

  forgotPassword: async (
    email: string
  ): Promise<{ message: string; reset_token?: string }> => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Called as: authApi.resetPassword(token, newPassword)
  resetPassword: async (
    token: string,
    new_password: string
  ): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      new_password,
    });
    return response.data;
  },
};

// ---------------------------------------------------------------------------
// Products API
// ---------------------------------------------------------------------------

export const productsApi = {
  // Called as: productsApi.getAll(params?)
  getAll: async (params?: {
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
  }): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>('/products', { params });
    return response.data;
  },

  // Called as: productsApi.getById(id)
  getById: async (id: number): Promise<Product> => {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  },

  getFilterMeta: async (): Promise<FilterMeta> => {
    const response = await apiClient.get<FilterMeta>('/products/filter-meta');
    return response.data;
  },

  getSuggestions: async (q: string): Promise<SearchSuggestion[]> => {
    const response = await apiClient.get<SearchSuggestion[]>(
      '/products/search/suggestions',
      { params: { q } }
    );
    return response.data;
  },

  searchSuggestions: async (q: string): Promise<SearchSuggestion[]> => {
    const response = await apiClient.get<SearchSuggestion[]>(
      '/products/search/suggestions',
      { params: { q } }
    );
    return response.data;
  },

  getRecommendations: async (
    productId: number
  ): Promise<ProductRecommendations> => {
    const response = await apiClient.get<ProductRecommendations>(
      `/products/${productId}/recommendations`
    );
    return response.data;
  },

  create: async (data: ProductCreate): Promise<Product> => {
    const response = await apiClient.post<Product>('/products', data);
    return response.data;
  },

  createProduct: async (data: ProductCreate): Promise<Product> => {
    const response = await apiClient.post<Product>('/products', data);
    return response.data;
  },

  update: async (id: number, data: ProductUpdate): Promise<Product> => {
    const response = await apiClient.put<Product>(`/products/${id}`, data);
    return response.data;
  },

  updateProduct: async (id: number, data: ProductUpdate): Promise<Product> => {
    const response = await apiClient.put<Product>(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  deleteProduct: async (id: number): Promise<void> => {
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

  getWishlist: async (): Promise<WishlistItem[]> => {
    const response = await apiClient.get<WishlistItem[]>('/wishlist');
    return response.data;
  },

  add: async (productId: number): Promise<WishlistItem> => {
    const response = await apiClient.post<WishlistItem>(
      `/wishlist/${productId}`
    );
    return response.data;
  },

  addToWishlist: async (productId: number): Promise<WishlistItem> => {
    const response = await apiClient.post<WishlistItem>(
      `/wishlist/${productId}`
    );
    return response.data;
  },

  remove: async (productId: number): Promise<void> => {
    await apiClient.delete(`/wishlist/${productId}`);
  },

  removeFromWishlist: async (productId: number): Promise<void> => {
    await apiClient.delete(`/wishlist/${productId}`);
  },

  checkWishlist: async (
    productId: number
  ): Promise<{ in_wishlist: boolean }> => {
    const response = await apiClient.get<{ in_wishlist: boolean }>(
      `/wishlist/check/${productId}`
    );
    return response.data;
  },
};

// ---------------------------------------------------------------------------
// Reviews API
// ---------------------------------------------------------------------------

export const reviewsApi = {
  // Called as: reviewsApi.getByProduct(productId)
  getByProduct: async (productId: number): Promise<ReviewStats> => {
    const response = await apiClient.get<ReviewStats>(
      `/products/${productId}/reviews`
    );
    return response.data;
  },

  // Called as: reviewsApi.create(productId, data)
  create: async (productId: number, data: ReviewCreate): Promise<Review> => {
    const response = await apiClient.post<Review>(
      `/products/${productId}/reviews`,
      data
    );
    return response.data;
  },

  // Called as: reviewsApi.update(reviewId, data)
  update: async (
    reviewId: number,
    data: Partial<ReviewCreate>
  ): Promise<Review> => {
    const response = await apiClient.put<Review>(`/reviews/${reviewId}`, data);
    return response.data;
  },

  // Called as: reviewsApi.delete(reviewId)
  delete: async (reviewId: number): Promise<void> => {
    await apiClient.delete(`/reviews/${reviewId}`);
  },

  // Called as: reviewsApi.getMyReviews()
  getMyReviews: async (): Promise<Review[]> => {
    const response = await apiClient.get<Review[]>('/reviews/my-reviews');
    return response.data;
  },
};

// ---------------------------------------------------------------------------
// Addresses API
// ---------------------------------------------------------------------------

export const addressesApi = {
  // Called as: addressesApi.getAll()
  getAll: async (): Promise<Address[]> => {
    const response = await apiClient.get<Address[]>('/addresses');
    return response.data;
  },

  // Called as: addressesApi.create(data)
  create: async (data: AddressCreate): Promise<Address> => {
    const response = await apiClient.post<Address>('/addresses', data);
    return response.data;
  },

  // Called as: addressesApi.update(id, data)
  update: async (id: number, data: AddressCreate): Promise<Address> => {
    const response = await apiClient.put<Address>(`/addresses/${id}`, data);
    return response.data;
  },

  // Called as: addressesApi.delete(id)
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/addresses/${id}`);
  },

  setDefault: async (id: number): Promise<Address> => {
    const response = await apiClient.patch<Address>(
      `/addresses/${id}/default`
    );
    return response.data;
  },
};

// ---------------------------------------------------------------------------
// Coupons API
// ---------------------------------------------------------------------------

export const couponsApi = {
  validate: async (
    code: string,
    order_amount: number
  ): Promise<CouponValidation> => {
    const response = await apiClient.post<CouponValidation>(
      '/coupons/validate',
      { code, order_amount }
    );
    return response.data;
  },

  validateCoupon: async (
    code: string,
    order_amount: number
  ): Promise<CouponValidation> => {
    const response = await apiClient.post<CouponValidation>(
      '/coupons/validate',
      { code, order_amount }
    );
    return response.data;
  },

  // Admin
  adminList: async (): Promise<Coupon[]> => {
    const response = await apiClient.get<Coupon[]>('/coupons');
    return response.data;
  },

  getCoupons: async (): Promise<Coupon[]> => {
    const response = await apiClient.get<Coupon[]>('/coupons');
    return response.data;
  },

  adminCreate: async (data: CouponCreate): Promise<Coupon> => {
    const response = await apiClient.post<Coupon>('/coupons', data);
    return response.data;
  },

  createCoupon: async (data: CouponCreate): Promise<Coupon> => {
    const response = await apiClient.post<Coupon>('/coupons', data);
    return response.data;
  },

  adminDelete: async (id: number): Promise<void> => {
    await apiClient.delete(`/coupons/${id}`);
  },

  deleteCoupon: async (id: number): Promise<void> => {
    await apiClient.delete(`/coupons/${id}`);
  },
};

// ---------------------------------------------------------------------------
// Orders API
// ---------------------------------------------------------------------------

export const ordersApi = {
  // Called as: ordersApi.getAll()
  getAll: async (): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>('/orders');
    return response.data;
  },

  // Called as: ordersApi.getById(id)
  getById: async (id: number): Promise<Order> => {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  },

  // Called as: ordersApi.getTracking(id)
  getTracking: async (id: number): Promise<OrderTracking> => {
    const response = await apiClient.get<OrderTracking>(
      `/orders/${id}/tracking`
    );
    return response.data;
  },

  create: async (data: OrderCreate): Promise<Order> => {
    const response = await apiClient.post<Order>('/orders', data);
    return response.data;
  },

  createOrder: async (data: OrderCreate): Promise<Order> => {
    const response = await apiClient.post<Order>('/orders', data);
    return response.data;
  },

  // Called as: ordersApi.cancel(id)
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

  getUsers: async (): Promise<AdminUser[]> => {
    const response = await apiClient.get<AdminUser[]>('/admin/users');
    return response.data;
  },

  getOrders: async (status?: OrderStatus): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>('/admin/orders', {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  updateOrderStatus: async (
    orderId: number,
    status: OrderStatus
  ): Promise<Order> => {
    const response = await apiClient.patch<Order>(
      `/admin/orders/${orderId}/status`,
      { status }
    );
    return response.data;
  },

  updateUserRole: async (
    userId: number,
    role: string
  ): Promise<{ message: string }> => {
    const response = await apiClient.patch<{ message: string }>(
      `/admin/users/${userId}/role`,
      { role }
    );
    return response.data;
  },
};

// ---------------------------------------------------------------------------
// Error helper
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
