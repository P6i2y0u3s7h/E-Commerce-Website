/** Checkout page: complete multi-step order placement flow with address selection and sandbox payment. */
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  CheckCircle,
  ArrowLeft,
  ShoppingBag,
  Building,
  User,
  Phone,
  MapPin,
  Lock,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersApi, addressesApi } from '../services/api';
import type { Address } from '../types';
import { formatPrice, getImageUrl } from '../utils';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const { items, subtotal, discountAmount, shippingFee, grandTotal, appliedCoupon, clearCart } =
    useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | 'new'>('new');

  // New address form fields
  const [fullName, setFullName] = useState(
    user ? `${user.first_name} ${user.last_name}`.trim() : ''
  );
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United States');

  // Sandbox payment fields
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  // Load saved addresses for logged-in user
  useEffect(() => {
    if (isAuthenticated) {
      addressesApi
        .getAll()
        .then((addrs) => {
          setSavedAddresses(addrs);
          const def = addrs.find((a) => a.is_default);
          if (def) setSelectedAddressId(def.id);
          else if (addrs.length > 0) setSelectedAddressId(addrs[0].id);
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  if (items.length === 0 && !orderSuccess) {
    return (
      <div className="section">
        <div className="page-container text-center py-20 card p-8 max-w-lg mx-auto">
          <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No Items in Cart</h2>
          <p className="text-slate-500 mb-6">
            Please add some products to your cart before proceeding to checkout.
          </p>
          <Link to="/products" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Browse Catalog
          </Link>
        </div>
      </div>
    );
  }

  // Order confirmation view
  if (orderSuccess) {
    return (
      <div className="section">
        <div className="page-container max-w-xl mx-auto text-center py-12 card p-8 sm:p-12 shadow-xl">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            Order #{orderSuccess.id} Placed
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3 mb-2">
            Thank You for Your Order!
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            A confirmation receipt has been sent to <strong>{orderSuccess.contact_email}</strong>.
            Your package is being prepared for dispatch.
          </p>

          <div className="bg-slate-50 p-4 rounded-xl text-left text-sm space-y-2 mb-8 border border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-500">Tracking Number:</span>
              <span className="font-mono font-bold text-slate-800">
                {orderSuccess.tracking_number}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Status:</span>
              <span className="font-bold text-emerald-600">PAID (Sandbox Simulation)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Charged:</span>
              <span className="font-bold text-slate-900">
                {formatPrice(orderSuccess.total_amount)}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/orders" className="btn-primary py-3 px-6 text-sm font-semibold">
              View Order Tracking
            </Link>
            <Link to="/products" className="btn-secondary py-3 px-6 text-sm font-semibold">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please sign in or create an account to complete your checkout.');
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }

    // Determine final address string
    let finalAddressStr = '';
    if (selectedAddressId !== 'new') {
      const existing = savedAddresses.find((a) => a.id === selectedAddressId);
      if (existing) {
        finalAddressStr = `${existing.full_name}, ${existing.street_address}, ${existing.city}, ${existing.state} ${existing.postal_code}, ${existing.country} (Phone: ${existing.phone})`;
      }
    } else {
      if (!fullName.trim() || !phone.trim() || !streetAddress.trim() || !city.trim() || !state.trim() || !postalCode.trim()) {
        toast.error('Please fill in all required shipping address fields.');
        return;
      }
      finalAddressStr = `${fullName.trim()}, ${streetAddress.trim()}, ${city.trim()}, ${state.trim()} ${postalCode.trim()}, ${country.trim()} (Phone: ${phone.trim()})`;

      // Optionally save to addresses table
      addressesApi
        .create({
          full_name: fullName.trim(),
          phone: phone.trim(),
          street_address: streetAddress.trim(),
          city: city.trim(),
          state: state.trim(),
          postal_code: postalCode.trim(),
          country: country.trim(),
          is_default: savedAddresses.length === 0,
        })
        .catch(() => {});
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        shipping_address: finalAddressStr,
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
        })),
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
        payment_method: paymentMethod === 'card' ? 'Sandbox Card (Test Mode)' : 'Cash on Delivery',
        contact_email: user?.email,
        contact_phone: phone,
      };

      const createdOrder = await ordersApi.create(orderPayload);
      clearCart();
      setOrderSuccess(createdOrder);
      toast.success('Order placed successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="section">
      <div className="page-container max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link to="/cart" className="hover:text-slate-900 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Cart
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">Checkout</span>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">
          Checkout & Place Order
        </h1>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Shipping & Payment (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Step 1: Shipping Address */}
              <div className="card p-6 sm:p-7">
                <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center">
                    1
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Shipping Address</h2>
                </div>

                {/* Saved Address Selector */}
                {savedAddresses.length > 0 && (
                  <div className="space-y-3 mb-6">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Choose Saved Address:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {savedAddresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedAddressId === addr.id
                              ? 'border-primary-600 bg-primary-50/50 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-sm">
                              {addr.full_name}
                            </span>
                            {addr.is_default && (
                              <span className="text-[10px] font-semibold text-primary-700 bg-primary-100 px-1.5 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {addr.street_address}, {addr.city}, {addr.state} {addr.postal_code}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">{addr.phone}</p>
                        </div>
                      ))}

                      {/* Add new address option */}
                      <div
                        onClick={() => setSelectedAddressId('new')}
                        className={`p-3.5 rounded-xl border-2 border-dashed cursor-pointer flex items-center justify-center text-sm font-semibold transition-all ${
                          selectedAddressId === 'new'
                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                            : 'border-slate-300 text-slate-600 hover:border-slate-400'
                        }`}
                      >
                        + Enter New Address
                      </div>
                    </div>
                  </div>
                )}

                {/* New Address Form Fields */}
                {(selectedAddressId === 'new' || savedAddresses.length === 0) && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. +1 555-0123"
                          className="input-field text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        placeholder="Street and house number"
                        className="input-field text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          State *
                        </label>
                        <input
                          type="text"
                          required
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Postal Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="input-field text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Sandbox Payment */}
              <div className="card p-6 sm:p-7">
                <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center">
                    2
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Payment Method (Sandbox Mode)</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <label
                      onClick={() => setPaymentMethod('card')}
                      className={`flex-1 p-3.5 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
                        paymentMethod === 'card'
                          ? 'border-primary-600 bg-primary-50/50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 text-primary-600" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">Credit / Debit Card</p>
                        <p className="text-xs text-slate-400">Sandbox Test Card</p>
                      </div>
                    </label>

                    <label
                      onClick={() => setPaymentMethod('cod')}
                      className={`flex-1 p-3.5 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
                        paymentMethod === 'cod'
                          ? 'border-primary-600 bg-primary-50/50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Building className="w-5 h-5 text-primary-600" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">Cash on Delivery</p>
                        <p className="text-xs text-slate-400">Pay upon receipt</p>
                      </div>
                    </label>
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Test Card Number
                        </label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="input-field text-sm font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Expires
                          </label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="input-field text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            CVC
                          </label>
                          <input
                            type="text"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            className="input-field text-sm font-mono"
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        ⚡ Test Mode Active: No real charges are made.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Order Review & Confirmation (5 cols) */}
            <div className="lg:col-span-5">
              <div className="card p-6 sm:p-7 sticky top-24 space-y-6">
                <h2 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-3">
                  Items in Order ({items.length})
                </h2>

                {/* Items mini list */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {items.map(({ product, quantity, selectedVariant }) => (
                    <div key={product.id} className="flex items-center gap-3 py-1">
                      <img
                        src={getImageUrl(product.image_url)}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg bg-slate-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{product.name}</p>
                        <p className="text-[11px] text-slate-400">Qty: {quantity}</p>
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        {formatPrice((product.price + (selectedVariant?.price_adjustment || 0)) * quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals Breakdown */}
                <div className="space-y-2.5 text-sm border-t border-slate-100 pt-4">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>Shipping</span>
                    <span className="font-semibold text-slate-900">
                      {shippingFee === 0 ? 'FREE' : formatPrice(shippingFee)}
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex justify-between text-lg font-bold text-slate-900">
                    <span>Total Amount</span>
                    <span className="text-primary-600">{formatPrice(grandTotal)}</span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full py-4 text-base font-bold shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  {isSubmitting ? 'Placing Order…' : `Pay ${formatPrice(grandTotal)} & Place Order`}
                </button>

                <p className="text-[11px] text-slate-400 text-center leading-normal">
                  By clicking "Place Order", you agree to ShopWave's Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
