/** Main application component with routing and providers. */
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { CompareProvider } from './context/CompareContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected pages (require authentication)
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProfilePage from './pages/ProfilePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import WishlistPage from './pages/WishlistPage';
import ComparePage from './pages/ComparePage';
import AdminDashboardPage from './pages/AdminDashboardPage';

/** Helper to scroll to top on route change */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WishlistProvider>
          <CompareProvider>
            <CartProvider>
              <ScrollToTop />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3500,
                  style: {
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '14px',
                    fontWeight: 500,
                    borderRadius: '12px',
                    boxShadow:
                      '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #f1f5f9',
                    padding: '12px 16px',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#ffffff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#ffffff',
                    },
                  },
                }}
              />
              <Routes>
                <Route path="/" element={<MainLayout />}>

                  {/* ── PUBLIC ROUTES ─────────────────────────────── */}
                  {/* Root: always-public landing/marketing page */}
                  <Route index element={<LandingPage />} />

                  {/* Auth routes */}
                  <Route path="login" element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                  <Route path="forgot-password" element={<ForgotPasswordPage />} />

                  {/* ── PROTECTED E-COMMERCE ROUTES ───────────────── */}
                  {/* Wrap all authenticated routes in ProtectedRoute */}
                  <Route element={<ProtectedRoute />}>
                    {/* Authenticated home (product catalog, dashboard) */}
                    <Route path="home" element={<HomePage />} />

                    {/* Products */}
                    <Route path="products" element={<ProductsPage />} />
                    <Route path="products/:id" element={<ProductDetailPage />} />

                    {/* Shopping */}
                    <Route path="cart" element={<CartPage />} />
                    <Route path="checkout" element={<CheckoutPage />} />
                    <Route path="wishlist" element={<WishlistPage />} />
                    <Route path="compare" element={<ComparePage />} />

                    {/* Orders & Tracking */}
                    <Route path="orders" element={<OrdersPage />} />
                    <Route path="orders/:id" element={<OrdersPage />} />

                    {/* Account, Addresses & Reviews */}
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="addresses" element={<ProfilePage initialTab="addresses" />} />
                    <Route path="reviews" element={<ProfilePage initialTab="reviews" />} />

                    {/* Admin (also requires ADMIN role — enforced in the component itself) */}
                    <Route path="admin" element={<AdminDashboardPage />} />
                    <Route path="admin/*" element={<AdminDashboardPage />} />
                  </Route>

                  {/* 404 catch-all */}
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </CartProvider>
          </CompareProvider>
        </WishlistProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
