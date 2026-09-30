"""
Pydantic schemas for request/response validation and serialization.
These define the API contract between FastAPI and the frontend.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, field_validator, ConfigDict

from app.models import UserRole, OrderStatus


# ---------------------------------------------------------------------------
# User & Auth Schemas
# ---------------------------------------------------------------------------

class UserBase(BaseModel):
    """Shared fields between user request/response schemas."""
    username: str
    email: EmailStr
    first_name: str
    last_name: str


class UserCreate(UserBase):
    """Schema for registering a new user."""
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return v

    @field_validator("username")
    @classmethod
    def username_length(cls, v: str) -> str:
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters long.")
        return v.strip()


class UserResponse(UserBase):
    """Safe user response — never exposes password."""
    id: int
    role: UserRole
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None


class ChangePasswordRequest(BaseModel):
    """Schema for changing password."""
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("New password must be at least 8 characters long.")
        return v


class ForgotPasswordRequest(BaseModel):
    """Schema for forgot password."""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Schema for resetting password with a token."""
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("New password must be at least 8 characters long.")
        return v


class LoginRequest(BaseModel):
    """Schema for login requests."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


# ---------------------------------------------------------------------------
# Product Images & Variants
# ---------------------------------------------------------------------------

class ProductImageBase(BaseModel):
    image_url: str
    display_order: int = 0


class ProductImageResponse(ProductImageBase):
    id: int
    product_id: int

    model_config = ConfigDict(from_attributes=True)


class ProductVariantBase(BaseModel):
    name: str
    value: str
    sku: Optional[str] = None
    price_adjustment: float = 0.0
    stock_quantity: int = 10


class ProductVariantResponse(ProductVariantBase):
    id: int
    product_id: int

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Product Schemas
# ---------------------------------------------------------------------------

class ProductBase(BaseModel):
    """Shared fields for product schemas."""
    name: str
    description: Optional[str] = None
    category: str = "General"
    brand: Optional[str] = "Generic"
    price: float
    image_url: Optional[str] = None
    stock_quantity: int = 0
    rating: float = 5.0
    review_count: int = 0
    specs: Optional[str] = None

    @field_validator("price")
    @classmethod
    def price_must_be_positive(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Price must be non-negative.")
        return v

    @field_validator("stock_quantity")
    @classmethod
    def stock_must_be_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Stock quantity must be non-negative.")
        return v


class ProductCreate(ProductBase):
    """Schema for creating a new product (admin only)."""
    additional_images: Optional[List[str]] = None


class ProductUpdate(BaseModel):
    """Schema for updating a product."""
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    stock_quantity: Optional[int] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    specs: Optional[str] = None


class ProductResponse(ProductBase):
    """Full product response."""
    id: int
    images: List[ProductImageResponse] = []
    variants: List[ProductVariantResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SearchSuggestion(BaseModel):
    id: int
    name: str
    category: str
    price: float
    image_url: Optional[str] = None


class FilterMetaResponse(BaseModel):
    categories: List[str]
    brands: List[str]
    min_price: float
    max_price: float


class ProductRecommendationsResponse(BaseModel):
    similar: List[ProductResponse]
    recommended: List[ProductResponse]
    also_viewed: List[ProductResponse]


# ---------------------------------------------------------------------------
# Wishlist Schemas
# ---------------------------------------------------------------------------

class WishlistItemResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    product: ProductResponse
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Review Schemas
# ---------------------------------------------------------------------------

class ReviewCreate(BaseModel):
    rating: int
    title: str
    comment: str

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v: int) -> int:
        if v < 1 or v > 5:
            raise ValueError("Rating must be between 1 and 5.")
        return v


class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    title: Optional[str] = None
    comment: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 1 or v > 5):
            raise ValueError("Rating must be between 1 and 5.")
        return v


class ReviewUserResponse(BaseModel):
    id: int
    username: str
    first_name: str
    last_name: str

    model_config = ConfigDict(from_attributes=True)


class ProductBrief(BaseModel):
    id: int
    name: str
    image_url: Optional[str] = None
    category: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ReviewResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    rating: int
    title: str
    comment: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    user: ReviewUserResponse
    product: Optional[ProductBrief] = None

    model_config = ConfigDict(from_attributes=True)


class ReviewStatsResponse(BaseModel):
    average_rating: float
    total_reviews: int
    rating_distribution: Dict[str, int]  # e.g. {"5": 10, "4": 3, "3": 1, "2": 0, "1": 0}
    reviews: List[ReviewResponse]


# ---------------------------------------------------------------------------
# Address Schemas
# ---------------------------------------------------------------------------

class AddressBase(BaseModel):
    full_name: str
    phone: str
    street_address: str
    city: str
    state: str
    postal_code: str
    country: str = "United States"
    is_default: bool = False


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    is_default: Optional[bool] = None


class AddressResponse(AddressBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Coupon Schemas
# ---------------------------------------------------------------------------

class CouponBase(BaseModel):
    code: str
    discount_type: str = "percentage"  # "percentage" or "fixed"
    discount_value: float
    minimum_order_amount: float = 0.0
    expiration_date: Optional[datetime] = None
    usage_limit: Optional[int] = None
    is_active: bool = True


class CouponCreate(CouponBase):
    pass


class CouponResponse(CouponBase):
    id: int
    used_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CouponValidateRequest(BaseModel):
    code: str
    order_amount: float


class CouponValidateResponse(BaseModel):
    valid: bool
    message: str
    code: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    discount_amount: float = 0.0
    final_amount: float = 0.0


# ---------------------------------------------------------------------------
# Order Schemas
# ---------------------------------------------------------------------------

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = 1

    @field_validator("quantity")
    @classmethod
    def quantity_must_be_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Quantity must be at least 1.")
        return v


class OrderItemProductInfo(BaseModel):
    id: int
    name: str
    image_url: Optional[str] = None
    category: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price_at_purchase: float
    product: Optional[OrderItemProductInfo] = None

    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    shipping_address: str
    items: List[OrderItemCreate]
    coupon_code: Optional[str] = None
    payment_method: str = "Sandbox Credit Card"
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    notes: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderResponse(BaseModel):
    id: int
    user_id: int
    order_date: datetime
    subtotal: float = 0.0
    discount_amount: float = 0.0
    shipping_fee: float = 0.0
    total_amount: float
    coupon_code: Optional[str] = None
    status: OrderStatus
    shipping_address: Optional[str] = None
    payment_method: str = "Sandbox Credit Card"
    payment_status: str = "PAID"
    tracking_number: Optional[str] = None
    estimated_delivery: Optional[datetime] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    notes: Optional[str] = None
    items: List[OrderItemResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TrackingEvent(BaseModel):
    status: str
    label: str
    completed: bool
    current: bool
    timestamp: Optional[datetime] = None


class OrderTrackingResponse(BaseModel):
    order_id: int
    status: OrderStatus
    tracking_number: Optional[str] = None
    events: List[TrackingEvent]


# ---------------------------------------------------------------------------
# Admin Dashboard & Analytics Schemas
# ---------------------------------------------------------------------------

class AdminStatsResponse(BaseModel):
    total_users: int
    total_products: int
    total_orders: int
    total_revenue: float
    low_stock_products_count: int
    pending_orders_count: int
    revenue_chart: List[Dict[str, Any]]
    orders_chart: List[Dict[str, Any]]
    top_selling_products: List[Dict[str, Any]]
    recent_orders: List[OrderResponse]


class AdminUserResponse(UserResponse):
    order_count: int = 0
    total_spent: float = 0.0


class AdminUserRoleUpdate(BaseModel):
    role: UserRole
    is_active: Optional[bool] = None


# ---------------------------------------------------------------------------
# Generic Responses
# ---------------------------------------------------------------------------

class MessageResponse(BaseModel):
    message: str
