/**
 * Cart context — manages shopping cart state, stock validation, and coupon discounts.
 * Persists to localStorage for session continuity.
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type { CartItem, Product, ProductVariant, CouponValidation } from '../types';
import { couponsApi } from '../services/api';
import toast from 'react-hot-toast';

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  grandTotal: number;
  appliedCoupon: CouponValidation | null;
  addItem: (product: Product, quantity?: number, selectedVariant?: ProductVariant) => boolean;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => boolean;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'shopwave_cart';
const COUPON_STORAGE_KEY = 'shopwave_applied_coupon';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation | null>(() => {
    try {
      const stored = localStorage.getItem(COUPON_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Persist applied coupon
  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem(COUPON_STORAGE_KEY);
    }
  }, [appliedCoupon]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = items.reduce(
    (sum, item) => sum + (item.product.price + (item.selectedVariant?.price_adjustment || 0)) * item.quantity,
    0
  );

  // Recalculate coupon discount if subtotal changes
  const discountAmount = appliedCoupon
    ? appliedCoupon.discount_type === 'percentage' && appliedCoupon.discount_value
      ? Math.round(((appliedCoupon.discount_value / 100) * subtotal) * 100) / 100
      : Math.min(appliedCoupon.discount_amount || 0, subtotal)
    : 0;

  const shippingFee = subtotal > 0 ? (subtotal >= 100 ? 0.0 : 9.99) : 0.0;
  const grandTotal = Math.max(0, Math.round((subtotal - discountAmount + shippingFee) * 100) / 100);

  const addItem = (product: Product, quantity = 1, selectedVariant?: ProductVariant): boolean => {
    if (product.stock_quantity <= 0) {
      toast.error(`${product.name} is currently out of stock.`);
      return false;
    }

    const existing = items.find((i) => i.product.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    const maxStock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;

    if (currentQty + quantity > maxStock) {
      toast.error(`Cannot add more: only ${maxStock} in stock (you already have ${currentQty} in cart).`);
      return false;
    }

    setItems((prev) => {
      const exists = prev.find((i) => i.product.id === product.id);
      if (exists) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + quantity, selectedVariant }
            : i
        );
      }
      return [...prev, { product, quantity, selectedVariant }];
    });

    return true;
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
    toast.success('Item removed from cart.');
  };

  const updateQuantity = (productId: number, quantity: number): boolean => {
    if (quantity <= 0) {
      removeItem(productId);
      return true;
    }

    const item = items.find((i) => i.product.id === productId);
    if (!item) return false;

    const maxStock = item.selectedVariant
      ? item.selectedVariant.stock_quantity
      : item.product.stock_quantity;

    if (quantity > maxStock) {
      toast.error(`Maximum available stock is ${maxStock}.`);
      return false;
    }

    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
    return true;
  };

  const applyCoupon = async (code: string): Promise<boolean> => {
    if (!code || !code.trim()) {
      toast.error('Please enter a coupon code.');
      return false;
    }

    try {
      const res = await couponsApi.validate(code.trim().toUpperCase(), subtotal);
      if (!res.valid) {
        toast.error(res.message);
        return false;
      }

      setAppliedCoupon(res);
      toast.success(res.message);
      return true;
    } catch {
      toast.error('Failed to validate coupon.');
      return false;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast.success('Coupon removed.');
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        subtotal,
        discountAmount,
        shippingFee,
        grandTotal,
        appliedCoupon,
        addItem,
        removeItem,
        updateQuantity,
        applyCoupon,
        removeCoupon,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
