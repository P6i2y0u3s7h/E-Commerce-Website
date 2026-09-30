/** Comprehensive Admin Dashboard: Analytics, Product CRUD, Order Management, User Management, and Coupons. */
import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Users,
  ShoppingBag,
  IndianRupee,
  Tag,
  Search,
  Eye,
  CheckCircle,
  Clock,
  Truck,
  Shield,
  X,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../hooks/useProducts';
import { productsApi, adminApi, couponsApi, getErrorMessage } from '../services/api';
import type {
  Product,
  ProductCreate,
  ProductUpdate,
  AdminStats,
  AdminUser,
  Order,
  OrderStatus,
  Coupon,
} from '../types';
import { formatPrice, formatDate, getImageUrl } from '../utils';
import Modal from '../components/ui/Modal';
import ProductForm from '../components/admin/ProductForm';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function AdminDashboardPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const { products, isLoading: productsLoading, refetch: refetchProducts } = useProducts();

  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'orders' | 'users' | 'coupons'>('analytics');

  // Analytics Stats State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Orders Management State
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Users Management State
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Coupons Management State
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [couponValue, setCouponValue] = useState('');
  const [couponMinAmount, setCouponMinAmount] = useState('0');
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);

  // Product CRUD Modals State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Product table search & filter
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');

  // Load stats
  const loadStats = () => {
    setLoadingStats(true);
    adminApi
      .getStats()
      .then(setStats)
      .catch((err) => console.error('Failed to load admin stats:', err))
      .finally(() => setLoadingStats(false));
  };

  // Load orders
  const loadOrders = (status?: string) => {
    setLoadingOrders(true);
    const filter = status && status !== 'ALL' ? (status as OrderStatus) : undefined;
    adminApi
      .getOrders(filter)
      .then(setAdminOrders)
      .catch((err) => console.error('Failed to load orders:', err))
      .finally(() => setLoadingOrders(false));
  };

  // Load users
  const loadUsers = () => {
    setLoadingUsers(true);
    adminApi
      .getUsers()
      .then(setAdminUsers)
      .catch((err) => console.error('Failed to load users:', err))
      .finally(() => setLoadingUsers(false));
  };

  // Load coupons
  const loadCoupons = () => {
    couponsApi
      .adminList()
      .then(setCoupons)
      .catch((err) => console.error('Failed to load coupons:', err));
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadStats();
      loadOrders();
      loadUsers();
      loadCoupons();
    }
  }, [isAuthenticated, isAdmin]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />; // Backend will 403 on any admin API call

  // Product CRUD Handlers
  const handleCreateProduct = async (data: ProductCreate | ProductUpdate) => {
    setIsSubmitting(true);
    try {
      await productsApi.create(data as ProductCreate);
      toast.success('Product created successfully!');
      setCreateModalOpen(false);
      refetchProducts();
      loadStats();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = async (data: ProductCreate | ProductUpdate) => {
    if (!selectedProduct) return;
    setIsSubmitting(true);
    try {
      await productsApi.update(selectedProduct.id, data as ProductUpdate);
      toast.success('Product updated successfully!');
      setEditModalOpen(false);
      setSelectedProduct(null);
      refetchProducts();
      loadStats();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    setIsDeleting(true);
    try {
      await productsApi.delete(selectedProduct.id);
      toast.success('Product deleted.');
      setDeleteModalOpen(false);
      setSelectedProduct(null);
      refetchProducts();
      loadStats();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  // Order Status Change
  const handleUpdateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      await adminApi.updateOrderStatus(orderId, newStatus);
      toast.success(`Order #${orderId} marked as ${newStatus}`);
      loadOrders(orderStatusFilter);
      loadStats();
    } catch {
      toast.error('Failed to update order status.');
    }
  };

  // User Role Change
  const handleToggleUserRole = async (targetUser: AdminUser) => {
    const newRole = targetUser.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';
    if (!confirm(`Are you sure you want to change @${targetUser.username}'s role to ${newRole}?`)) return;
    try {
      await adminApi.updateUserRole(targetUser.id, newRole);
      toast.success(`Updated @${targetUser.username}'s role to ${newRole}`);
      loadUsers();
    } catch {
      toast.error('Failed to update user role.');
    }
  };

  // Coupon Creation
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || !couponValue) return;

    setIsCreatingCoupon(true);
    try {
      await couponsApi.adminCreate({
        code: couponCode.trim().toUpperCase(),
        discount_type: couponType,
        discount_value: parseFloat(couponValue),
        minimum_order_amount: parseFloat(couponMinAmount) || 0.0,
        is_active: true,
      });
      toast.success(`Coupon ${couponCode.toUpperCase()} created!`);
      setCouponCode('');
      setCouponValue('');
      setCouponMinAmount('0');
      loadCoupons();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to create coupon.');
    } finally {
      setIsCreatingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (couponId: number) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await couponsApi.adminDelete(couponId);
      toast.success('Coupon removed.');
      loadCoupons();
    } catch {
      toast.error('Failed to delete coupon.');
    }
  };

  // Filtered Products for Management Table
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !productSearch.trim() ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand?.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory =
      productCategoryFilter === 'All' || p.category === productCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const uniqueCategories = ['All', ...Array.from(new Set(products.map((p) => p.category || 'General')))];

  return (
    <div className="section">
      <div className="page-container">
        {/* Dashboard Title & Quick Stats Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                Administration Portal
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Store Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadStats();
                refetchProducts();
                loadOrders(orderStatusFilter);
              }}
              className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 mb-8 overflow-x-auto text-sm font-semibold space-x-6">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Overview & Analytics
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'products'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4" /> Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Orders ({adminOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> Customers ({adminUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'coupons'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Tag className="w-4 h-4" /> Coupons ({coupons.length})
          </button>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Top 6 KPI Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="card p-5">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase">Total Revenue</span>
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {formatPrice(stats?.total_revenue || 0)}
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase">Total Orders</span>
                  <ShoppingBag className="w-4 h-4 text-primary-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {stats?.total_orders ?? 0}
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase">Total Products</span>
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {stats?.total_products ?? products.length}
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase">Customers</span>
                  <Users className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {stats?.total_users ?? 0}
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase">Pending Orders</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-amber-600">
                  {stats?.pending_orders_count ?? 0}
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase">Low Stock Alerts</span>
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <div className="text-2xl font-black text-red-600">
                  {stats?.low_stock_products_count ?? 0}
                </div>
              </div>
            </div>

            {/* 7-Day Revenue & Orders Visualizer */}
            {stats?.revenue_chart && stats.revenue_chart.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue over time */}
                <div className="card p-6">
                  <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" /> 7-Day Revenue Trends
                  </h3>
                  <p className="text-xs text-slate-400 mb-6">Daily sales over the past week</p>
                  <div className="h-44 flex items-end justify-between gap-3 pt-4 border-b border-slate-100">
                    {stats.revenue_chart.map((day, i) => {
                      const max = Math.max(...stats.revenue_chart.map((d) => d.revenue), 100);
                      const heightPercent = Math.max(10, (day.revenue / max) * 100);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] py-1 px-2 rounded font-bold whitespace-nowrap z-10">
                            {formatPrice(day.revenue)}
                          </div>
                          <div
                            className="w-full bg-emerald-500/80 hover:bg-emerald-600 rounded-t-lg transition-all"
                            style={{ height: `${heightPercent}%` }}
                          />
                          <span className="text-[10px] text-slate-400 font-medium">{day.date}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Orders over time */}
                <div className="card p-6">
                  <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-primary-600" /> 7-Day Order Volume
                  </h3>
                  <p className="text-xs text-slate-400 mb-6">Completed checkout count</p>
                  <div className="h-44 flex items-end justify-between gap-3 pt-4 border-b border-slate-100">
                    {stats.orders_chart.map((day, i) => {
                      const max = Math.max(...stats.orders_chart.map((d) => d.orders), 5);
                      const heightPercent = Math.max(10, (day.orders / max) * 100);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] py-1 px-2 rounded font-bold whitespace-nowrap z-10">
                            {day.orders} order(s)
                          </div>
                          <div
                            className="w-full bg-primary-500/80 hover:bg-primary-600 rounded-t-lg transition-all"
                            style={{ height: `${heightPercent}%` }}
                          />
                          <span className="text-[10px] text-slate-400 font-medium">{day.date}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Low-Stock Section & Top Selling Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Low stock alerts */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> Low Stock Inventory Items
                  </h3>
                  <span className="text-xs text-slate-400">Stock ≤ 10</span>
                </div>
                {products.filter((p) => p.stock_quantity <= 10).length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">
                    All inventory levels are healthy!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {products
                      .filter((p) => p.stock_quantity <= 10)
                      .slice(0, 5)
                      .map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 border border-red-100 text-sm"
                        >
                          <div className="flex items-center gap-3 truncate">
                            <img
                              src={getImageUrl(p.image_url)}
                              alt=""
                              className="w-10 h-10 object-cover rounded-lg bg-white shrink-0"
                            />
                            <div className="truncate">
                              <p className="font-bold text-slate-900 text-xs truncate">{p.name}</p>
                              <p className="text-[11px] text-slate-400">{p.category}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded ${
                                p.stock_quantity === 0
                                  ? 'bg-red-200 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {p.stock_quantity === 0 ? 'Out of Stock' : `${p.stock_quantity} left`}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Top Selling Products */}
              <div className="card p-6">
                <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary-600" /> Top-Selling Catalog Products
                </h3>
                {stats?.top_selling_products && stats.top_selling_products.length > 0 ? (
                  <div className="space-y-3">
                    {stats.top_selling_products.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm">
                        <div className="flex items-center gap-3 truncate">
                          <img
                            src={getImageUrl(item.image_url)}
                            alt=""
                            className="w-10 h-10 object-cover rounded-lg bg-white shrink-0"
                          />
                          <div className="truncate">
                            <p className="font-bold text-slate-900 text-xs truncate">{item.name}</p>
                            <p className="text-[11px] text-slate-400">{item.units_sold} units sold</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="font-extrabold text-slate-900 text-sm">{formatPrice(item.total_sales)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-6 text-center">
                    Sales rankings will appear here as orders are placed.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 2: PRODUCT MANAGEMENT TABLE */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'products' && (
          <div className="space-y-5">
            {/* Search & Filter Header */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search products by title, category, or brand…"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="input-field text-sm pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="input-field text-sm bg-white min-w-[160px]"
                >
                  {uniqueCategories.map((c) => (
                    <option key={c} value={c}>
                      Category: {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products Table */}
            <div className="card overflow-x-auto shadow-sm">
              <table className="w-full text-left text-sm border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 tracking-wider">
                    <th className="p-4">Product</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Rating</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const isLow = p.stock_quantity > 0 && p.stock_quantity <= 10;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={getImageUrl(p.image_url)}
                              alt=""
                              className="w-12 h-12 object-cover rounded-xl bg-slate-100 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-slate-900 text-sm line-clamp-1">{p.name}</p>
                              {p.brand && <p className="text-xs text-slate-400">{p.brand}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600 font-medium">{p.category || 'General'}</td>
                        <td className="p-4 font-bold text-slate-900">{formatPrice(p.price)}</td>
                        <td className="p-4">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              p.stock_quantity === 0
                                ? 'bg-red-100 text-red-700'
                                : isLow
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {p.stock_quantity === 0 ? 'Out of Stock' : `${p.stock_quantity} in stock`}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-semibold text-slate-700">
                          ★ {p.rating ? p.rating.toFixed(1) : '5.0'} ({p.review_count || 0})
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to={`/products/${p.id}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                              title="View details page"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => {
                                setSelectedProduct(p);
                                setEditModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50"
                              title="Edit product"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProduct(p);
                                setDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 3: ORDER MANAGEMENT */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'orders' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Customer Orders</h3>
                <p className="text-xs text-slate-400 mt-0.5">Filter orders and advance fulfillment status</p>
              </div>
              <select
                value={orderStatusFilter}
                onChange={(e) => {
                  setOrderStatusFilter(e.target.value);
                  loadOrders(e.target.value);
                }}
                className="input-field text-xs bg-white min-w-[170px]"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="card overflow-x-auto shadow-sm">
              <table className="w-full text-left text-sm border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 tracking-wider">
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Items</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-900">#{ord.id}</td>
                      <td className="p-4 text-xs text-slate-500">{formatDate(ord.created_at)}</td>
                      <td className="p-4 text-xs font-semibold text-slate-800">
                        {ord.contact_email || `User #${ord.user_id}`}
                      </td>
                      <td className="p-4 text-xs text-slate-600">{ord.items?.length || 0} item(s)</td>
                      <td className="p-4 font-bold text-slate-900">{formatPrice(ord.total_amount)}</td>
                      <td className="p-4">
                        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                          {ord.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <select
                          value={ord.status}
                          onChange={(e) =>
                            handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)
                          }
                          className="text-xs border border-slate-200 rounded-lg p-1.5 bg-white font-medium focus:ring-1 focus:ring-primary-500"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 4: USER MANAGEMENT */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'users' && (
          <div className="space-y-5">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">User Accounts</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage customer accounts and role privileges</p>
            </div>

            <div className="card overflow-x-auto shadow-sm">
              <table className="w-full text-left text-sm border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 tracking-wider">
                    <th className="p-4">User</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Orders Placed</th>
                    <th className="p-4">Total Spent</th>
                    <th className="p-4">Joined Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">
                            {u.first_name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">
                              {u.first_name} {u.last_name}
                            </p>
                            <p className="text-[11px] text-slate-400">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-600">{u.email}</td>
                      <td className="p-4">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-bold text-slate-800">{u.order_count}</td>
                      <td className="p-4 text-xs font-bold text-slate-900">
                        {formatPrice(u.total_spent)}
                      </td>
                      <td className="p-4 text-xs text-slate-400">{formatDate(u.created_at)}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleUserRole(u)}
                          className="btn-secondary py-1 px-3 text-xs"
                        >
                          {u.role === 'ADMIN' ? 'Demote' : 'Promote to Admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 5: COUPONS MANAGEMENT */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'coupons' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Create Coupon Form */}
            <div className="card p-6">
              <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary-600" /> Create Discount Coupon
              </h3>
              <form onSubmit={handleCreateCoupon} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FLASH25"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="input-field text-sm uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Type
                    </label>
                    <select
                      value={couponType}
                      onChange={(e) => setCouponType(e.target.value as any)}
                      className="input-field text-sm bg-white"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Discount Value *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="1"
                      placeholder="e.g. 20"
                      value={couponValue}
                      onChange={(e) => setCouponValue(e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Minimum Order Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={couponMinAmount}
                    onChange={(e) => setCouponMinAmount(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreatingCoupon}
                  className="btn-primary w-full py-2.5 text-sm font-semibold"
                >
                  {isCreatingCoupon ? 'Creating…' : 'Add Coupon'}
                </button>
              </form>
            </div>

            {/* Coupons List */}
            <div className="lg:col-span-2 card p-6">
              <h3 className="font-bold text-slate-900 text-base mb-4">Active Promo Coupons</h3>
              {coupons.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">No coupons created yet.</p>
              ) : (
                <div className="space-y-3">
                  {coupons.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-xl border border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                          <Tag className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-mono font-bold text-slate-900 text-sm">{c.code}</p>
                          <p className="text-xs text-slate-500">
                            {c.discount_type === 'percentage'
                              ? `${c.discount_value}% off`
                              : `${formatPrice(c.discount_value)} off`}
                            {c.minimum_order_amount > 0 &&
                              ` • Min order ${formatPrice(c.minimum_order_amount)}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-400">Used {c.used_count} time(s)</span>
                        <button
                          onClick={() => handleDeleteCoupon(c.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete coupon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modals for Product CRUD */}
        {/* Create Product Modal */}
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Create New Product"
        >
          <ProductForm
            mode="create"
            onSubmit={handleCreateProduct}
            onCancel={() => setCreateModalOpen(false)}
            isSubmitting={isSubmitting}
          />
        </Modal>

        {/* Edit Product Modal */}
        <Modal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedProduct(null);
          }}
          title="Edit Product"
        >
          {selectedProduct && (
            <ProductForm
              mode="edit"
              initialData={selectedProduct}
              onSubmit={handleEditProduct}
              onCancel={() => {
                setEditModalOpen(false);
                setSelectedProduct(null);
              }}
              isSubmitting={isSubmitting}
            />
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedProduct(null);
          }}
          onConfirm={handleDeleteProduct}
          productName={selectedProduct?.name ?? ''}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
}
