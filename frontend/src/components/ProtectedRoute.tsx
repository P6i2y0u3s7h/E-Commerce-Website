/**
 * ProtectedRoute — wraps routes that require authentication.
 *
 * Behaviour:
 *  - While auth is initialising (isLoading=true) → shows a centred spinner.
 *  - If not authenticated → redirects to /login, preserving the intended
 *    destination in ?redirect= so the login page can send the user back.
 *  - If authenticated → renders the child route normally.
 *
 * Usage in App.tsx:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="products" element={<ProductsPage />} />
 *   </Route>
 */
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Still initialising — don't redirect yet, show spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Checking authentication…</p>
      </div>
    );
  }

  // Not authenticated — redirect to login with return path
  if (!isAuthenticated) {
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return (
      <Navigate
        to={`/login?redirect=${redirectTo}`}
        replace
        state={{ from: location }}
      />
    );
  }

  // Authenticated — render the protected content
  return <Outlet />;
}
