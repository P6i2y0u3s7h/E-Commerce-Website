/** Home page — hero section + featured products. */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Shield, Truck, Star } from 'lucide-react';
import ProductCard from '../components/products/ProductCard';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import { useProducts } from '../hooks/useProducts';

const FEATURES = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'Free delivery on all orders over ₹499.',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Your payment information is always protected.',
  },
  {
    icon: Star,
    title: 'Quality Products',
    description: 'Hand-picked products from trusted brands.',
  },
];

export default function HomePage() {
  const { products, isLoading, error } = useProducts();
  const featured = products.slice(0, 8);

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 text-white overflow-hidden">
        {/* Background pattern */}
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
              Discover Products<br />
              <span className="text-primary-400">You'll Love</span>
            </h1>
            <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-lg">
              Shop quality products at great prices. From electronics to fashion,
              we've got everything you need — delivered fast.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-500 transition-all duration-200 shadow-lg shadow-primary-600/30"
              >
                Shop Now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 border border-white/20 transition-all duration-200 backdrop-blur-sm"
              >
                Explore Products
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features strip ── */}
      <section className="border-b border-slate-100 bg-white">
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

      {/* ── Featured Products ── */}
      <section className="section">
        <div className="page-container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                Featured Products
              </h2>
              <p className="text-slate-500 mt-1">
                Hand-picked just for you
              </p>
            </div>
            <Link
              to="/products"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <ProductGridSkeleton count={8} />
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-500 font-medium">{error}</p>
              <p className="text-slate-500 text-sm mt-1">
                Make sure the backend server is running on{' '}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded">
                  http://localhost:8000
                </code>
              </p>
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center py-16 card">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No products yet.</p>
              <p className="text-slate-400 text-sm mt-1">
                Run <code className="bg-slate-100 px-1 rounded">python populate_db.py</code>{' '}
                to seed sample products.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {products.length > 8 && (
            <div className="text-center mt-10">
              <Link to="/products" className="btn-secondary">
                View All {products.length} Products
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="bg-primary-600 text-white">
        <div className="page-container py-14 text-center">
          <h2 className="text-2xl md:text-3xl font-bold">
            Ready to start shopping?
          </h2>
          <p className="text-primary-100 mt-3 max-w-md mx-auto">
            Create a free account and get access to exclusive deals and fast checkout.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors"
            >
              Create Free Account
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-400 border border-primary-400 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
