/** Enhanced site footer with rich links, social icons, and newsletter CTA. */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const API_DOCS_URL = `${(import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')}/docs`;
import { Zap, ExternalLink, Mail, ArrowRight, ShieldCheck, Truck, RefreshCw, Share2 } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto">
      {/* Trust Bar */}
      <div className="border-b border-slate-800">
        <div className="page-container py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-sm">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-primary-400" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-white text-sm">Free Shipping</p>
                <p className="text-slate-500 text-xs">On orders over ₹499</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-primary-400" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-white text-sm">Easy Returns</p>
                <p className="text-slate-500 text-xs">30-day hassle-free returns</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-primary-400" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-white text-sm">Secure Payments</p>
                <p className="text-slate-500 text-xs">256-bit SSL encryption</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="page-container py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand & Newsletter */}
          <div className="md:col-span-2 space-y-5">
            <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl">
              <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              ShopWave
            </Link>
            <p className="text-sm leading-relaxed max-w-xs text-slate-400">
              A modern full-stack e-commerce platform powered by FastAPI and React.
              Quality products, fast delivery, exceptional service.
            </p>

            {/* Newsletter */}
            <div>
              <p className="text-white text-xs font-semibold mb-2 uppercase tracking-wider">
                Stay in the loop
              </p>
              {subscribed ? (
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                  <ShieldCheck className="w-4 h-4" /> Thanks for subscribing!
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                  />
                  <button
                    type="submit"
                    className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg transition-colors"
                    aria-label="Subscribe"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Twitter / X"
              >
                <Share2 className="w-4 h-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors"
                aria-label="GitHub"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="mailto:support@shopwave.com"
                className="w-9 h-9 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Email support"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Shop</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/products?category=Electronics" className="hover:text-white transition-colors">Electronics</Link></li>
              <li><Link to="/products?category=Clothing" className="hover:text-white transition-colors">Clothing</Link></li>
              <li><Link to="/products?in_stock=true" className="hover:text-white transition-colors">In Stock</Link></li>
              <li><Link to="/compare" className="hover:text-white transition-colors">Compare Products</Link></li>
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Account</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/profile" className="hover:text-white transition-colors">My Profile</Link></li>
              <li><Link to="/orders" className="hover:text-white transition-colors">My Orders</Link></li>
              <li><Link to="/wishlist" className="hover:text-white transition-colors">Wishlist</Link></li>
              <li><Link to="/addresses" className="hover:text-white transition-colors">Saved Addresses</Link></li>
              <li><Link to="/reviews" className="hover:text-white transition-colors">My Reviews</Link></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Support</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href={API_DOCS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  API Documentation
                </a>
              </li>
              <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Create Account</Link></li>
              <li><Link to="/forgot-password" className="hover:text-white transition-colors">Reset Password</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© 2026 ShopWave. Built for full-stack development learning.</p>
          <div className="flex items-center gap-6">
            <span className="text-slate-600">Privacy Policy</span>
            <span className="text-slate-600">Terms of Service</span>
            <a
              href={API_DOCS_URL}
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              API Docs ↗
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
