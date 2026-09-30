// Shared TypeScript types for the e-commerce frontend

export type UserRole = 'ADMIN' | 'CUSTOMER';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  display_order: number;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  name: string;
  value: string;
  sku?: string;
  price_adjustment: number;
  stock_quantity: number;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  price: number;
  image_url?: string;
  stock_quantity: number;
  rating: number;
  review_count: number;
  specs?: string; // JSON string
  images?: ProductImage[];
  variants?: ProductVariant[];
  created_at: string;
  updated_at?: string;
}

export interface ProductCreate {
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  price: number;
  image_url?: string;
  stock_quantity: number;
  rating?: number;
  specs?: string;
  additional_images?: string[];
}

export interface ProductUpdate {
  name?: string;
  description?: string;
  category?: string;
  brand?: string;
  price?: number;
  image_url?: string;
  stock_quantity?: number;
  rating?: number;
  specs?: string;
}

export interface SearchSuggestion {
  id: number;
  name: string;
  category: string;
  price: number;
  image_url?: string;
}

export interface FilterMeta {
  categories: string[];
  brands: string[];
  min_price: number;
  max_price: number;
}

export interface ProductRecommendations {
  similar: Product[];
  recommended: Product[];
  also_viewed: Product[];
}

// Wishlist
export interface WishlistItem {
  id: number;
  user_id: number;
  product_id: number;
  product: Product;
  created_at: string;
}

// Reviews
export interface ReviewUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

export interface Review {
  id: number;
  user_id: number;
  product_id: number;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  updated_at?: string;
  user: ReviewUser;
  product?: OrderItemProductInfo;
}

export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<string, number>;
  reviews: Review[];
}

export interface ReviewCreate {
  rating: number;
  title: string;
  comment: string;
}

// Addresses
export interface Address {
  id: number;
  user_id: number;
  full_name: string;
  phone: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export interface AddressCreate {
  full_name: string;
  phone: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
  is_default?: boolean;
}

// Coupons
export interface Coupon {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_order_amount: number;
  expiration_date?: string;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

export interface CouponCreate {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_order_amount?: number;
  expiration_date?: string;
  usage_limit?: number;
  is_active?: boolean;
}

export interface CouponValidation {
  valid: boolean;
  message: string;
  code?: string;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  discount_amount: number;
  final_amount: number;
}

// Cart types
export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: ProductVariant;
}

export interface Cart {
  items: CartItem[];
}

// Orders
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItemProductInfo {
  id: number;
  name: string;
  image_url?: string;
  category?: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price_at_purchase: number;
  product?: OrderItemProductInfo;
}

export interface Order {
  id: number;
  user_id: number;
  order_date: string;
  subtotal: number;
  discount_amount: number;
  shipping_fee: number;
  total_amount: number;
  coupon_code?: string;
  status: OrderStatus;
  shipping_address?: string;
  payment_method: string;
  payment_status: string;
  tracking_number?: string;
  estimated_delivery?: string;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
  items: OrderItem[];
  created_at: string;
  updated_at?: string;
}

export interface OrderCreate {
  shipping_address: string;
  items: { product_id: number; quantity: number }[];
  coupon_code?: string;
  payment_method?: string;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
}

export interface TrackingEvent {
  status: string;
  label: string;
  completed: boolean;
  current: boolean;
  timestamp?: string;
}

export interface OrderTracking {
  order_id: number;
  status: OrderStatus;
  tracking_number?: string;
  events: TrackingEvent[];
}

// Admin Dashboard Types
export interface TopSellingProduct {
  id: number;
  name: string;
  price: number;
  image_url?: string;
  category?: string;
  units_sold: number;
  total_sales: number;
}

export interface AdminStats {
  total_users: number;
  total_products: number;
  total_orders: number;
  total_revenue: number;
  low_stock_products_count: number;
  pending_orders_count: number;
  revenue_chart: { date: string; revenue: number }[];
  orders_chart: { date: string; orders: number }[];
  top_selling_products: TopSellingProduct[];
  recent_orders: Order[];
}

export interface AdminUser extends User {
  order_count: number;
  total_spent: number;
}

export interface ApiError {
  detail: string;
}
