/** Shopping cart page with quantity limits, coupon discount validation, and shipping progress. */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ShoppingBag,
  Tag,
  Check,
  X,
  Truck,
  ArrowRight,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice, getImageUrl } from '../utils';

export default function CartPage() {
  const {
    items,
    totalItems,
    subtotal,
    discountAmount,
    shippingFee,
    grandTotal,
    appliedCoupon,
    removeItem,
    updateQuantity,
    applyCoupon,
    removeCoupon,
    clearCart,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const navigate = useNavigate();

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    await applyCoupon(couponCode.trim());
    setIsApplyingCoupon(false);
  };

  if (items.length === 0) {
    return (
      <div className="section">
        <div className="page-container text-center py-20 card p-8 max-w-lg mx-auto">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-10 h-10 text-slate-300" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Your cart is empty</h1>
          <p className="text-slate-500 mt-2 text-sm">
            Looks like you haven't added anything to your cart yet. Explore our latest arrivals!
          </p>
          <Link to="/products" className="btn-primary mt-6 inline-flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const freeShippingThreshold = 100.0;
  const freeShippingDiff = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <div className="section">
      <div className="page-container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Shopping Cart</h1>
            <p className="text-slate-500 text-sm mt-1">{totalItems} item(s) selected for purchase</p>
          </div>
          <button
            onClick={clearCart}
            className="btn-ghost text-red-500 hover:text-red-600 hover:bg-red-50 text-sm inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Trash2 className="w-4 h-4" />
            Clear Cart
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="bg-primary-50/60 border border-primary-100 rounded-2xl p-4 mb-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary-900 mb-1.5">
            <Truck className="w-4 h-4 text-primary-600" />
            {freeShippingDiff === 0 ? (
              <span>🎉 Congratulations! You have qualified for <strong>FREE Shipping</strong>!</span>
            ) : (
              <span>
                Add <strong>{formatPrice(freeShippingDiff)}</strong> more to unlock <strong>FREE Shipping</strong>!
              </span>
            )}
          </div>
          <div className="w-full bg-primary-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${freeShippingPercent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Item Cards */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(({ product, quantity, selectedVariant }) => {
              const maxStock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;
              const itemPrice = product.price + (selectedVariant?.price_adjustment || 0);

              return (
                <div key={product.id} className="card p-4 sm:p-5 flex gap-4 sm:gap-6 items-center">
                  <Link to={`/products/${product.id}`} className="shrink-0">
                    <img
                      src={getImageUrl(product.image_url)}
                      alt={product.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl bg-slate-100"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=200';
                      }}
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {product.brand && (
                          <span className="text-[11px] font-bold uppercase text-primary-600">
                            {product.brand}
                          </span>
                        )}
                        <Link
                          to={`/products/${product.id}`}
                          className="font-bold text-slate-900 text-sm sm:text-base hover:text-primary-600 transition-colors line-clamp-1"
                        >
                          {product.name}
                        </Link>
                        {selectedVariant && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {selectedVariant.name}: {selectedVariant.value}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(product.id)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-4">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs sm:text-sm font-semibold text-slate-900">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          disabled={quantity >= maxStock}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right">
                        <span className="text-base sm:text-lg font-bold text-slate-900">
                          {formatPrice(itemPrice * quantity)}
                        </span>
                        {quantity > 1 && (
                          <p className="text-[11px] text-slate-400">
                            {formatPrice(itemPrice)} each
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-sm text-primary-600 hover:underline pt-2 font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Continue Shopping
            </Link>
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <div className="card p-6 sticky top-24 space-y-6">
              <h2 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-3">
                Order Summary
              </h2>

              {/* Coupon Form */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Have a Promo Code?
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold">{appliedCoupon.code}</span>
                      <span className="text-xs">(-{formatPrice(discountAmount)})</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="p-1 hover:text-emerald-950 rounded"
                      title="Remove coupon"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. WELCOME10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="input-field text-sm flex-1 uppercase"
                    />
                    <button
                      type="submit"
                      disabled={isApplyingCoupon || !couponCode.trim()}
                      className="btn-secondary py-2 px-3 text-xs font-semibold whitespace-nowrap"
                    >
                      {isApplyingCoupon ? 'Applying…' : 'Apply'}
                    </button>
                  </form>
                )}
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Try <strong>WELCOME10</strong> (10% off {formatPrice(50)}+) or <strong>SAVE20</strong> ({formatPrice(20)} off {formatPrice(100)}+)
                </p>
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-3 text-sm border-t border-slate-100 pt-4">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Estimated Shipping</span>
                  <span className="font-semibold text-slate-900">
                    {shippingFee === 0 ? 'FREE' : formatPrice(shippingFee)}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between text-lg font-bold text-slate-900">
                  <span>Total</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="btn-primary w-full py-3.5 text-base font-semibold shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center text-xs text-slate-400">
                🔒 Secure Sandbox Checkout • 256-bit encryption
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
