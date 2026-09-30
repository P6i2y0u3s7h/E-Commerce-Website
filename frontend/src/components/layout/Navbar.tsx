/** Top navigation bar — responsive with real-time debounced autocomplete search, wishlist & compare badges. */
import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShoppingCart,
  User,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  Zap,
  Search,
  Heart,
  Scale,
  ShoppingBag,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';
import { productsApi } from '../../services/api';
import type { SearchSuggestion } from '../../types';
import { formatPrice, getImageUrl } from '../../utils';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { totalItems } = useCart();
  const { totalWishlist } = useWishlist();
  const { totalCompare } = useCompare();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Sync search input with URL search param
  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setSearchQuery(q);
  }, [searchParams]);

  // Debounced search autocomplete
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await productsApi.getSuggestions(searchQuery.trim());
        setSuggestions(results);
        setShowDropdown(true);
      } catch (err) {
        console.error('Autocomplete error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowDropdown(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/');
    setMobileMenuOpen(false);
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-primary-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="page-container">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Desktop Nav */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-2 text-slate-900 font-bold text-xl flex-shrink-0"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-sm">
                <Zap className="w-5 h-5 text-white" />
              </div>
              ShopWave
            </Link>

            <nav className="hidden lg:flex items-center gap-5">
              <NavLink to="/" className={navLinkClass} end>
                Home
              </NavLink>
              {isAuthenticated && (
                <NavLink to="/products" className={navLinkClass}>
                  Products
                </NavLink>
              )}
              {isAuthenticated && (
                <NavLink to="/orders" className={navLinkClass}>
                  My Orders
                </NavLink>
              )}
              {isAdmin && (
                <NavLink to="/admin" className={navLinkClass}>
                  Admin
                </NavLink>
              )}
            </nav>
          </div>

          {/* Centered Search Bar — only shown to authenticated users */}
          <div ref={searchContainerRef} className={`flex-1 max-w-md hidden sm:block relative ${!isAuthenticated ? 'invisible pointer-events-none' : ''}`}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowDropdown(true);
                }}
                placeholder="Search products, categories, brands..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />

              {/* Loading spinner or clear button */}
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
                {isSearching ? (
                  <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
                ) : searchQuery ? (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>
            </form>

            {/* Autocomplete Dropdown */}
            {showDropdown && searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-fade-in">
                {suggestions.length > 0 ? (
                  <div>
                    <div className="px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100">
                      Suggestions
                    </div>
                    {suggestions.map((item) => (
                      <Link
                        key={item.id}
                        to={`/products/${item.id}`}
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0"
                      >
                        <img
                          src={getImageUrl(item.image_url)}
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded-lg bg-slate-100 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                          <p className="text-xs text-slate-400">{item.category}</p>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">
                          {formatPrice(item.price)}
                        </span>
                      </Link>
                    ))}
                    <button
                      onClick={handleSearchSubmit}
                      className="w-full text-center py-2.5 text-xs font-medium text-primary-600 bg-primary-50/50 hover:bg-primary-50 transition-colors"
                    >
                      View all results for "{searchQuery}"
                    </button>
                  </div>
                ) : !isSearching ? (
                  <div className="p-4 text-center text-sm text-slate-500">
                    No products found for "{searchQuery}"
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated && (
              <>
                {/* Compare Badge */}
                {totalCompare > 0 && (
                  <Link
                    to="/compare"
                    className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    title="Product Comparison"
                  >
                    <Scale className="w-5 h-5 text-primary-600" />
                    <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {totalCompare}
                    </span>
                  </Link>
                )}

                {/* Wishlist */}
                <Link
                  to="/wishlist"
                  className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="My Wishlist"
                >
                  <Heart className="w-5 h-5" />
                  {totalWishlist > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {totalWishlist > 9 ? '9+' : totalWishlist}
                    </span>
                  )}
                </Link>

                {/* Cart */}
                <Link
                  to="/cart"
                  className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="Shopping Cart"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {totalItems > 9 ? '9+' : totalItems}
                    </span>
                  )}
                </Link>

                {/* Profile + Logout */}
                <div className="flex items-center gap-1.5 ml-1">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-7 h-7 bg-primary-100 text-primary-700 font-bold text-xs rounded-full flex items-center justify-center">
                      {user?.first_name?.[0] || 'U'}
                    </div>
                    <span className="max-w-[100px] truncate">{user?.first_name}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {/* Guest buttons */}
            {!isAuthenticated && (
              <div className="flex items-center gap-2 ml-2">
                <Link to="/login" className="btn-secondary text-sm py-2 px-4">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && (
              <>
                <Link to="/wishlist" className="relative p-2 text-slate-600">
                  <Heart className="w-5 h-5" />
                  {totalWishlist > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {totalWishlist}
                    </span>
                  )}
                </Link>
                <Link to="/cart" className="relative p-2 text-slate-600">
                  <ShoppingCart className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute top-0 right-0 bg-primary-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Link>
              </>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="sm:hidden pb-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-3 animate-fade-in">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `block py-2 text-base font-medium ${isActive ? 'text-primary-600 font-semibold' : 'text-slate-700'}`
            }
            onClick={() => setMobileMenuOpen(false)}
            end
          >
            Home
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink
                to="/products"
                className={({ isActive }) =>
                  `block py-2 text-base font-medium ${isActive ? 'text-primary-600 font-semibold' : 'text-slate-700'}`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                All Products
              </NavLink>
              <NavLink
                to="/wishlist"
                className={({ isActive }) =>
                  `block py-2 text-base font-medium ${isActive ? 'text-primary-600 font-semibold' : 'text-slate-700'}`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                Wishlist ({totalWishlist})
              </NavLink>
              {totalCompare > 0 && (
                <NavLink
                  to="/compare"
                  className={({ isActive }) =>
                    `block py-2 text-base font-medium ${isActive ? 'text-primary-600 font-semibold' : 'text-slate-700'}`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Compare ({totalCompare})
                </NavLink>
              )}
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <NavLink
                  to="/orders"
                  className="flex items-center gap-2 py-2 text-base text-slate-700 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ShoppingBag className="w-4 h-4" /> My Orders
                </NavLink>
                <NavLink
                  to="/profile"
                  className="flex items-center gap-2 py-2 text-base text-slate-700 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4" /> My Profile ({user?.first_name})
                </NavLink>
                {isAdmin && (
                  <NavLink
                    to="/admin"
                    className="flex items-center gap-2 py-2 text-base text-primary-600 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
                  </NavLink>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 py-2 text-base text-red-600 font-medium w-full text-left"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
              <Link
                to="/login"
                className="btn-secondary w-full text-center py-2.5"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn-primary w-full text-center py-2.5"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
