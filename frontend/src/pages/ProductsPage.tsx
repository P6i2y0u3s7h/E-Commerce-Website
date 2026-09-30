/** Products listing page with professional desktop sidebar and mobile slide-over filter panel. */
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Package,
  SlidersHorizontal,
  X,
  Star,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import ProductCard from '../components/products/ProductCard';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import { productsApi } from '../services/api';
import type { Product, FilterMeta } from '../types';
import { formatPrice } from '../utils';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || 'All');
  const [minPrice, setMinPrice] = useState<number | undefined>(
    searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined
  );
  const [maxPrice, setMaxPrice] = useState<number | undefined>(
    searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined
  );
  const [inStockOnly, setInStockOnly] = useState(searchParams.get('in_stock') === 'true');
  const [minRating, setMinRating] = useState<number | undefined>(
    searchParams.get('min_rating') ? Number(searchParams.get('min_rating')) : undefined
  );
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');

  // UI state
  const [products, setProducts] = useState<Product[]>([]);
  const [filterMeta, setFilterMeta] = useState<FilterMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state if URL changes (e.g. from header search)
  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null && q !== search) {
      setSearch(q);
    }
  }, [searchParams]);

  // Load filter metadata
  useEffect(() => {
    productsApi
      .getFilterMeta()
      .then(setFilterMeta)
      .catch((err) => console.error('Failed to load filter metadata:', err));
  }, []);

  // Fetch products from backend with current filters & sort
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await productsApi.getAll({
        search: search.trim() || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        brand: selectedBrand !== 'All' ? selectedBrand : undefined,
        min_price: minPrice,
        max_price: maxPrice,
        in_stock: inStockOnly ? true : undefined,
        min_rating: minRating,
        sort,
      });
      setProducts(data);
    } catch {
      setError('Failed to load products. Please check if the server is running.');
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCategory, selectedBrand, minPrice, maxPrice, inStockOnly, minRating, sort]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedBrand('All');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setInStockOnly(false);
    setMinRating(undefined);
    setSort('newest');
    setSearchParams({});
  };

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedCategory !== 'All' ||
    selectedBrand !== 'All' ||
    minPrice !== undefined ||
    maxPrice !== undefined ||
    inStockOnly ||
    minRating !== undefined ||
    sort !== 'newest';

  const filterContent = (
    <div className="space-y-6">
      {/* Header with Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary-600" />
          Filter Products
        </h3>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">Category</h4>
        <div className="space-y-1">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
              selectedCategory === 'All'
                ? 'bg-primary-50 text-primary-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>All Categories</span>
            {selectedCategory === 'All' && <Check className="w-3.5 h-3.5 text-primary-600" />}
          </button>
          {filterMeta?.categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
                selectedCategory === cat
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{cat}</span>
              {selectedCategory === cat && <Check className="w-3.5 h-3.5 text-primary-600" />}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">Price Range (₹)</h4>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">₹</span>
            <input
              type="number"
              placeholder="Min"
              value={minPrice ?? ''}
              onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-6 pr-2.5 py-1.5 text-sm"
            />
          </div>
          <span className="text-slate-400 text-xs">to</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">₹</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice ?? ''}
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-6 pr-2.5 py-1.5 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Brand Filter */}
      {filterMeta?.brands && filterMeta.brands.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">Brand</h4>
          <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
            <button
              onClick={() => setSelectedBrand('All')}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
                selectedBrand === 'All'
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>All Brands</span>
              {selectedBrand === 'All' && <Check className="w-3.5 h-3.5 text-primary-600" />}
            </button>
            {filterMeta.brands.map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBrand(b)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
                  selectedBrand === b
                    ? 'bg-primary-50 text-primary-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{b}</span>
                {selectedBrand === b && <Check className="w-3.5 h-3.5 text-primary-600" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Customer Rating Filter */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">Rating</h4>
        <div className="space-y-1.5">
          {[4, 3, 2].map((r) => (
            <button
              key={r}
              onClick={() => setMinRating(minRating === r ? undefined : r)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
                minRating === r
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < r ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs">& up</span>
              </div>
              {minRating === r && <Check className="w-3.5 h-3.5 text-primary-600" />}
            </button>
          ))}
        </div>
      </div>

      {/* Availability Filter */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">Availability</h4>
        <label className="flex items-center gap-2.5 cursor-pointer py-1 px-1">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
          />
          <span className="text-sm text-slate-700">In Stock Only</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="section">
      <div className="page-container">
        {/* Page Title & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Browse Products</h1>
            <p className="text-slate-500 text-sm mt-1">
              {isLoading ? 'Loading catalog…' : `${products.length} products found`}
            </p>
          </div>

          {/* Mobile Filter Toggle Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="btn-secondary py-2 px-3.5 text-sm flex items-center gap-2 flex-1 sm:flex-initial"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-primary-600 ml-1"></span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar + Sort Header */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="product-search"
              type="text"
              placeholder="Search products by title, description, category, or brand…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 pr-9 text-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Sorting Dropdown */}
          <div className="relative flex-shrink-0">
            <SlidersHorizontal className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              id="product-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="input-field pl-10 pr-8 cursor-pointer bg-white text-sm min-w-[210px]"
            >
              <option value="newest">Sort: Newest</option>
              <option value="popular">Sort: Popular</option>
              <option value="rating">Sort: Highest Rated</option>
              <option value="price_asc">Sort: Price Low → High</option>
              <option value="price_desc">Sort: Price High → Low</option>
              <option value="name_asc">Sort: Name A → Z</option>
            </select>
          </div>
        </div>

        {/* Active Filter Pills */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs text-slate-400 font-medium">Active filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                Search: "{search}"
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSearch('')} />
              </span>
            )}
            {selectedCategory !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                {selectedCategory}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory('All')} />
              </span>
            )}
            {selectedBrand !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                Brand: {selectedBrand}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedBrand('All')} />
              </span>
            )}
            {(minPrice !== undefined || maxPrice !== undefined) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                {minPrice !== undefined ? formatPrice(minPrice) : '₹0'} – {maxPrice !== undefined ? formatPrice(maxPrice) : '∞'}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => {
                    setMinPrice(undefined);
                    setMaxPrice(undefined);
                  }}
                />
              </span>
            )}
            {inStockOnly && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                In Stock Only
                <X className="w-3 h-3 cursor-pointer" onClick={() => setInStockOnly(false)} />
              </span>
            )}
            {minRating && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                {minRating}★ & above
                <X className="w-3 h-3 cursor-pointer" onClick={() => setMinRating(undefined)} />
              </span>
            )}
            <button
              onClick={resetFilters}
              className="text-xs text-primary-600 hover:underline font-semibold ml-1"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Main Layout: Desktop Sidebar + Product Grid */}
        <div className="flex gap-8 items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="w-64 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hidden lg:block flex-shrink-0 sticky top-20">
            {filterContent}
          </aside>

          {/* Product Grid Area */}
          <main className="flex-1 min-w-0">
            {isLoading ? (
              <ProductGridSkeleton count={8} />
            ) : error ? (
              <div className="text-center py-20 card p-8">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-red-500 font-semibold">{error}</p>
                <button onClick={fetchProducts} className="btn-secondary mt-4 text-sm">
                  Retry
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 card p-8">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-800 text-lg">No matching products found</h3>
                <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
                  Try adjusting your keywords, broadening price limits, or clearing applied filters.
                </p>
                <button onClick={resetFilters} className="btn-primary mt-5 text-sm py-2 px-5">
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Slide-Over Filter Panel */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full p-6 shadow-2xl flex flex-col z-10 overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Filters</h2>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {filterContent}
            <div className="mt-8 pt-4 border-t border-slate-100">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="btn-primary w-full py-2.5"
              >
                View {products.length} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
