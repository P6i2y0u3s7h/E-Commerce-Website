/** Orders Page: Customer order history, item breakdowns, and visual status tracking timeline. */
import React, { useState, useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  Package,
  Calendar,
  CheckCircle,
  Clock,
  Truck,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  X,
  CreditCard,
  MapPin,
  AlertCircle,
  Printer,
  Ban,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ordersApi } from '../services/api';
import type { Order, OrderTracking } from '../types';
import { formatPrice, formatDate, getImageUrl } from '../utils';
import toast from 'react-hot-toast';

export default function OrdersPage() {
  const { id: routeOrderId } = useParams<{ id?: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingData, setTrackingData] = useState<OrderTracking | null>(null);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      ordersApi
        .getAll()
        .then((fetchedOrders) => {
          setOrders(fetchedOrders);
          if (routeOrderId) {
            const found = fetchedOrders.find((o) => o.id === Number(routeOrderId));
            if (found) {
              viewOrderDetails(found);
            } else {
              ordersApi.getById(Number(routeOrderId)).then((single) => {
                viewOrderDetails(single);
              }).catch(() => {});
            }
          }
        })
        .catch((err) => console.error('Failed to load orders:', err))
        .finally(() => setIsLoading(false));
    }
  }, [isAuthenticated, routeOrderId]);

  const viewOrderDetails = async (order: Order) => {
    setSelectedOrder(order);
    setIsLoadingTracking(true);
    try {
      const tracking = await ordersApi.getTracking(order.id);
      setTrackingData(tracking);
    } catch (err) {
      console.error('Failed to load tracking:', err);
    } finally {
      setIsLoadingTracking(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm(`Are you sure you want to cancel Order #${orderId}? Your payment will be refunded immediately.`)) {
      return;
    }
    setCancellingOrderId(orderId);
    try {
      const updated = await ordersApi.cancel(orderId);
      toast.success(`Order #${orderId} cancelled. Refund of ${formatPrice(updated.total_amount)} processed successfully!`);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updated);
        // Refresh tracking
        const tracking = await ordersApi.getTracking(orderId);
        setTrackingData(tracking);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to cancel order.');
    } finally {
      setCancellingOrderId(null);
    }
  };

  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: { pathname: '/orders' } }} replace />;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
            <CheckCircle className="w-3 h-3" /> Delivered
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
            <Truck className="w-3 h-3" /> In Transit
          </span>
        );
      case 'PROCESSING':
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
            <Clock className="w-3 h-3" /> {status === 'CONFIRMED' ? 'Confirmed' : 'Processing'}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700">
            <AlertCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="section">
      <div className="page-container max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Orders</h1>
            <p className="text-slate-500 text-sm mt-1">
              View your order history, receipts, and real-time shipment updates
            </p>
          </div>
          <Link to="/products" className="btn-secondary py-2 px-4 text-xs font-semibold">
            Browse More Products
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
                <div className="h-16 bg-slate-100 rounded mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="card text-center py-20 p-8">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="font-bold text-slate-800 text-lg">No orders placed yet</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto mb-6">
              When you purchase items from ShopWave, your tracking updates and order details will appear here.
            </p>
            <Link to="/products" className="btn-primary py-2.5 px-6 text-sm inline-flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" /> Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <div key={order.id} className="card p-6 hover:shadow-card-hover transition-all">
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 text-base">Order #{order.id}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    {order.estimated_delivery && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                      <span className="text-primary-600 font-semibold flex items-center gap-1 bg-primary-50 px-2.5 py-1 rounded-md">
                        <Truck className="w-3.5 h-3.5" /> Est. Delivery: {formatDate(order.estimated_delivery)}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(order.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="py-4 space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.product?.image_url && (
                          <img
                            src={getImageUrl(item.product.image_url)}
                            alt=""
                            className="w-10 h-10 object-cover rounded-lg bg-slate-100 shrink-0"
                          />
                        )}
                        <div className="truncate">
                          <p className="font-medium text-slate-900 truncate">
                            {item.product?.name || `Product #${item.product_id}`}
                          </p>
                          <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-slate-900 shrink-0 ml-4">
                        {formatPrice(item.price_at_purchase * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 text-sm">
                  <div>
                    <span className="text-slate-500 text-xs">Total: </span>
                    <span className="font-extrabold text-slate-900 text-base">
                      {formatPrice(order.total_amount)}
                    </span>
                    {order.payment_status === 'REFUNDED' && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full">
                        Refunded
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status) && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancellingOrderId === order.id}
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold px-3 py-1.5 rounded-lg border border-red-200 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Ban className="w-3.5 h-3.5" /> Cancel Order
                      </button>
                    )}

                    <button
                      onClick={() => viewOrderDetails(order)}
                      className="btn-secondary py-1.5 px-3.5 text-xs font-semibold flex items-center gap-1.5"
                    >
                      Track Package & Details <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Details & Tracking Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedOrder(null)}
            />
            <div className="relative bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto animate-fade-in">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    Order Details #{selectedOrder.id}
                    {getStatusBadge(selectedOrder.status)}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Placed on {formatDate(selectedOrder.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowInvoiceModal(true)}
                    className="btn-secondary py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5"
                    title="View and print tax invoice"
                  >
                    <Printer className="w-3.5 h-3.5" /> Invoice
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Live Tracking Timeline */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary-600" />
                    Shipment Timeline
                  </h3>
                  <div className="flex items-center gap-3">
                    {selectedOrder.estimated_delivery && selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
                      <span className="text-xs text-primary-700 font-semibold bg-primary-100/60 px-2.5 py-0.5 rounded-full">
                        Est: {formatDate(selectedOrder.estimated_delivery)}
                      </span>
                    )}
                    {selectedOrder.tracking_number && (
                      <span className="font-mono text-xs text-slate-500 font-semibold">
                        {selectedOrder.tracking_number}
                      </span>
                    )}
                  </div>
                </div>

                {isLoadingTracking ? (
                  <div className="py-6 text-center text-xs text-slate-400">Loading tracking…</div>
                ) : trackingData ? (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {trackingData.events.map((evt, idx) => (
                      <div key={idx} className="relative">
                        <div
                          className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                            evt.completed
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-400'
                          }`}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p
                            className={`text-sm font-bold ${
                              evt.current ? 'text-primary-600' : evt.completed ? 'text-slate-900' : 'text-slate-400'
                            }`}
                          >
                            {evt.label}
                          </p>
                          {evt.timestamp && (
                            <p className="text-xs text-slate-400">{formatDate(evt.timestamp)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Delivery Address & Payment summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                <div>
                  <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary-600" /> Shipping Destination:
                  </h4>
                  <p className="text-slate-600 leading-relaxed">{selectedOrder.shipping_address}</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-primary-600" /> Payment Summary:
                  </h4>
                  <p className="text-slate-600">{selectedOrder.payment_method}</p>
                  <p className={`font-semibold mt-0.5 ${selectedOrder.payment_status === 'REFUNDED' ? 'text-purple-600' : 'text-emerald-600'}`}>
                    Status: {selectedOrder.payment_status}
                  </p>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-3 mb-6">
                <h4 className="font-bold text-slate-900 text-sm">Ordered Items</h4>
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm py-1 border-b border-slate-50">
                    <div>
                      <p className="font-medium text-slate-900">
                        {item.product?.name || `Product #${item.product_id}`}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.quantity} × {formatPrice(item.price_at_purchase)}
                      </p>
                    </div>
                    <span className="font-bold text-slate-900">
                      {formatPrice(item.price_at_purchase * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Cost Breakdown */}
              <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-right mb-6">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>{formatPrice(selectedOrder.subtotal || selectedOrder.total_amount)}</span>
                </div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount ({selectedOrder.coupon_code}):</span>
                    <span>-{formatPrice(selectedOrder.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Shipping:</span>
                  <span>{selectedOrder.shipping_fee === 0 ? 'FREE' : formatPrice(selectedOrder.shipping_fee)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Grand Total:</span>
                  <span className="text-primary-600">{formatPrice(selectedOrder.total_amount)}</span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                {['PENDING', 'CONFIRMED', 'PROCESSING'].includes(selectedOrder.status) ? (
                  <button
                    onClick={() => handleCancelOrder(selectedOrder.id)}
                    disabled={cancellingOrderId === selectedOrder.id}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold px-4 py-2 rounded-xl border border-red-200 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Ban className="w-3.5 h-3.5" /> Cancel Order & Refund
                  </button>
                ) : (
                  <div />
                )}

                <button
                  onClick={() => setShowInvoiceModal(true)}
                  className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> View Full Printable Invoice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Printable Tax Invoice Modal */}
        {showInvoiceModal && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowInvoiceModal(false)}
            />
            <div className="relative bg-white rounded-2xl max-w-2xl w-full p-8 sm:p-10 shadow-2xl z-10 max-h-[95vh] overflow-y-auto print:p-0 print:shadow-none print:max-w-none">
              {/* Actions Header (hidden on print) */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6 print:hidden">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Customer Receipt / Tax Invoice
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="btn-primary py-1.5 px-4 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Invoice
                  </button>
                  <button
                    onClick={() => setShowInvoiceModal(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Invoice Printable Content */}
              <div className="space-y-6 text-slate-800">
                {/* Brand & Invoice Details */}
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <span className="w-7 h-7 bg-primary-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                        ⚡
                      </span>
                      ShopWave
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">100 Market Street, Suite 500</p>
                    <p className="text-xs text-slate-500">San Francisco, CA 94105</p>
                    <p className="text-xs text-slate-500">support@shopwave.com</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-bold text-slate-900">INVOICE</h2>
                    <p className="text-xs font-mono font-semibold text-slate-600 mt-1">
                      INV-{selectedOrder.id.toString().padStart(6, '0')}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Date: {formatDate(selectedOrder.created_at)}</p>
                    <p className="text-xs text-slate-500 font-mono">Tracking: {selectedOrder.tracking_number || 'N/A'}</p>
                  </div>
                </div>

                {/* Billed To / Shipped To */}
                <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-1">Billed To:</h4>
                    <p className="font-semibold text-slate-800">{selectedOrder.contact_email}</p>
                    {selectedOrder.contact_phone && (
                      <p className="text-slate-600">{selectedOrder.contact_phone}</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-1">Destination:</h4>
                    <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                      {selectedOrder.shipping_address}
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b-2 border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-2.5">Item Description</th>
                        <th className="py-2.5 text-center">Qty</th>
                        <th className="py-2.5 text-right">Unit Price</th>
                        <th className="py-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-3 font-medium text-slate-900">
                            {item.product?.name || `Product #${item.product_id}`}
                            <span className="block text-[11px] text-slate-400">
                              Category: {item.product?.category || 'General'}
                            </span>
                          </td>
                          <td className="py-3 text-center text-slate-700 font-medium">{item.quantity}</td>
                          <td className="py-3 text-right text-slate-700">{formatPrice(item.price_at_purchase)}</td>
                          <td className="py-3 text-right font-bold text-slate-900">
                            {formatPrice(item.price_at_purchase * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Calculation Totals */}
                <div className="border-t-2 border-slate-200 pt-4 flex justify-end">
                  <div className="w-64 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-medium text-slate-900">
                        {formatPrice(selectedOrder.subtotal || selectedOrder.total_amount)}
                      </span>
                    </div>
                    {selectedOrder.discount_amount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Discount ({selectedOrder.coupon_code}):</span>
                        <span>-{formatPrice(selectedOrder.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>Shipping & Handling:</span>
                      <span className="font-medium text-slate-900">
                        {selectedOrder.shipping_fee === 0 ? 'FREE' : formatPrice(selectedOrder.shipping_fee)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Tax (Estimated):</span>
                      <span className="font-medium text-slate-900">{formatPrice(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                      <span>Grand Total:</span>
                      <span className="text-primary-600">{formatPrice(selectedOrder.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Status & Footer */}
                <div className="border-t border-slate-100 pt-4 text-[11px] text-slate-500 flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <span className="font-bold text-slate-700">Payment: </span>
                    {selectedOrder.payment_method} —{' '}
                    <span className={`font-bold ${selectedOrder.payment_status === 'REFUNDED' ? 'text-purple-600' : 'text-emerald-600'}`}>
                      {selectedOrder.payment_status}
                    </span>
                  </div>
                  <p>Thank you for shopping with ShopWave!</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
