/**
 * LandingPage — public marketing / introduction page.
 *
 * Accessible to everyone without authentication.
 * Does NOT call any authenticated API endpoints.
 *
 * CTA behaviour:
 *  - Logged-in user  → "Explore Products" goes to /products
 *  - Guest           → "Explore Products" goes to /login?redirect=/products
 *  - "Create Account" always goes to /register
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ShoppingBag,
  Shield,
  Truck,
  Star,
  Zap,
  Package,
  Tag,
  Headphones,
  RefreshCcw,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Static content ──────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'Free delivery on all orders over ₹499. Fast, reliable logistics.',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Your payment information is always encrypted and protected.',
  },
  {
    icon: Star,
    title: 'Quality Products',
    description: 'Hand-picked products from trusted brands you can rely on.',
  },
];

const CATEGORIES = [
  { name: 'Electronics', icon: Zap, color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' },
  { name: 'Fashion', icon: Tag, color: 'bg-purple-50 text-purple-600', border: 'border-purple-100' },
  { name: 'Home & Garden', icon: Package, color: 'bg-green-50 text-green-600', border: 'border-green-100' },
  { name: 'Sports', icon: Star, color: 'bg-orange-50 text-orange-600', border: 'border-orange-100' },
];

const BENEFITS = [
  { icon: CheckCircle, text: 'No hidden fees — transparent pricing always' },
  { icon: RefreshCcw, text: '30-day hassle-free returns' },
  { icon: Headphones, text: '24/7 customer support' },
  { icon: Shield, text: 'Buyer protection on every order' },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Smart "Explore Products" handler
  const handleExplore = () => {
    if (isAuthenticated) {
      navigate('/products');
    } else {
      navigate('/login?redirect=%2Fproducts');
    }
  };

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 text-white overflow-hidden">
        {/* Background blobs */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 25%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 75% 75%, #6366f1 0%, transparent 50%)',
          }}
        />

        <div className="page-container relative py-24 md:py-32 lg:py-40">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-500/20 border border-primary-500/30 rounded-full text-primary-300 text-sm font-medium mb-6">
              <ShoppingBag className="w-4 h-4" />
              New arrivals every week
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              Discover Products
              <br />
              <span className="text-primary-400">You'll Love</span>
            </h1>

            <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-lg">
              Shop quality products at great prices. From electronics to fashion,
              we've got everything you need — delivered fast and securely.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              {/* Primary CTA — smart routing */}
              <button
                id="landing-explore-btn"
                onClick={handleExplore}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-500 transition-all duration-200 shadow-lg shadow-primary-600/30 disabled:opacity-70"
              >
                Explore Products
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Secondary CTA */}
              {!isAuthenticated && (
                <Link
                  to="/register"
                  id="landing-register-btn"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 border border-white/20 transition-all duration-200 backdrop-blur-sm"
                >
                  Create Account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Short Store Introduction ──────────────────────────────────── */}
      <section className="bg-white border-b border-slate-100">
        <div className="page-container py-14 text-center max-w-3xl mx-auto">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-5">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
            Welcome to ShopWave
          </h2>
          <p className="mt-4 text-slate-500 leading-relaxed text-base md:text-lg">
            ShopWave is your one-stop destination for curated, high-quality products across
            hundreds of categories. We partner with trusted brands to bring you the best
            selection at competitive prices — with fast shipping and easy returns.
          </p>
        </div>
      </section>

      {/* ── Features strip ───────────────────────────────────────────── */}
      <section className="border-b border-slate-100 bg-slate-50">
        <div className="page-container py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
                  <p className="text-slate-500 text-sm mt-0.5">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Categories ───────────────────────────────────────── */}
      <section className="section bg-white">
        <div className="page-container">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Featured Categories</h2>
            <p className="text-slate-500 mt-2">Browse our most popular departments</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORIES.map(({ name, icon: Icon, color, border }) => (
              <button
                key={name}
                id={`landing-cat-${name.toLowerCase().replace(/\s/g, '-')}`}
                onClick={handleExplore}
                className={`group flex flex-col items-center gap-3 p-6 rounded-2xl border ${border} bg-white hover:shadow-md transition-all duration-200 cursor-pointer`}
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="w-7 h-7" />
                </div>
                <span className="font-semibold text-slate-800 text-sm">{name}</span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  Shop now <ArrowRight className="w-3 h-3" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ────────────────────────────────────────────── */}
      <section className="section bg-slate-50">
        <div className="page-container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                Why choose ShopWave?
              </h2>
              <p className="text-slate-500 leading-relaxed mb-6">
                We're obsessed with making your shopping experience smooth, safe, and
                satisfying. Here's what sets us apart from the rest.
              </p>
              <ul className="space-y-3">
                {BENEFITS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-primary-600 shrink-0" />
                    <span className="text-slate-700 text-sm">{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Happy Customers', value: '50K+' },
                { label: 'Products Available', value: '10K+' },
                { label: 'Brands Partnered', value: '200+' },
                { label: 'Orders Delivered', value: '1M+' },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="card p-6 text-center"
                >
                  <p className="text-3xl font-bold text-primary-600">{value}</p>
                  <p className="text-slate-500 text-sm mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Call to Action ────────────────────────────────────────────── */}
      <section className="bg-primary-600 text-white">
        <div className="page-container py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold">Ready to start shopping?</h2>
          <p className="text-primary-100 mt-3 max-w-md mx-auto">
            Create a free account and get access to exclusive deals and a faster checkout experience.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {isAuthenticated ? (
              <Link
                to="/products"
                id="landing-cta-products-btn"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors"
              >
                Browse Products <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  id="landing-cta-register-btn"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors"
                >
                  Create Free Account
                </Link>
                <button
                  id="landing-cta-explore-btn"
                  onClick={handleExplore}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-400 border border-primary-400 transition-colors"
                >
                  Explore Products
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
