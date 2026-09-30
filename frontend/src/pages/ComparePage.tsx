/** Product Comparison Page: Side-by-side comparison for up to 4 products with horizontally scrollable table on mobile. */
import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, Trash2, ShoppingCart, ArrowLeft, Star, CheckCircle, XCircle } from 'lucide-react';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';
import { formatPrice, getImageUrl } from '../utils';
import toast from 'react-hot-toast';

export default function ComparePage() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const { addItem } = useCart();

  const handleAddToCart = (product: any) => {
    if (product.stock_quantity <= 0) {
      toast.error('Product is out of stock.');
      return;
    }
    const added = addItem(product);
    if (added) {
      toast.success(`${product.name} added to cart!`);
    }
  };

  if (compareList.length === 0) {
    return (
      <div className="section">
        <div className="page-container text-center py-20 card p-8 max-w-lg mx-auto">
          <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Scale className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">No Products to Compare</h1>
          <p className="text-slate-500 text-sm mb-6">
            Compare specs, pricing, and ratings side-by-side by selecting up to 4 items in the catalog.
          </p>
          <Link to="/products" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Explore Catalog
          </Link>
        </div>
      </div>
    );
  }

  // Collect all unique specification keys across compared products
  const allSpecKeys = Array.from(
    new Set(
      compareList.flatMap((p) => {
        if (!p.specs) return [];
        try {
          return Object.keys(JSON.parse(p.specs));
        } catch {
          return [];
        }
      })
    )
  );

  return (
    <div className="section">
      <div className="page-container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Product Comparison
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Comparing {compareList.length} of 4 maximum items
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={clearCompare}
              className="btn-ghost text-red-500 hover:text-red-600 hover:bg-red-50 text-xs font-semibold"
            >
              Clear Comparison
            </button>
            <Link to="/products" className="btn-secondary py-2 px-3 text-xs font-semibold">
              + Add More Products
            </Link>
          </div>
        </div>

        {/* Scrollable Container (no window-level overflow) */}
        <div className="card border border-slate-100 overflow-x-auto shadow-sm">
          <table className="w-full min-w-[700px] border-collapse text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="p-4 w-44 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Product
                </th>
                {compareList.map((p) => (
                  <th key={p.id} className="p-4 w-60 align-top">
                    <div className="relative group">
                      <button
                        onClick={() => removeFromCompare(p.id)}
                        className="absolute -top-1 -right-1 p-1 rounded-full bg-slate-200 text-slate-600 hover:bg-red-100 hover:text-red-600 transition-colors z-10"
                        title="Remove from comparison"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="aspect-square w-full rounded-xl bg-slate-100 overflow-hidden mb-3">
                        <img
                          src={getImageUrl(p.image_url)}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <Link
                        to={`/products/${p.id}`}
                        className="font-bold text-slate-900 text-sm hover:text-primary-600 transition-colors line-clamp-2 mb-2 block"
                      >
                        {p.name}
                      </Link>

                      <div className="text-lg font-black text-slate-900 mb-3">
                        {formatPrice(p.price)}
                      </div>

                      <button
                        onClick={() => handleAddToCart(p)}
                        disabled={p.stock_quantity <= 0}
                        className="btn-primary w-full py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Category */}
              <tr>
                <td className="p-4 font-semibold text-slate-500 text-xs uppercase">Category</td>
                {compareList.map((p) => (
                  <td key={p.id} className="p-4 font-medium text-slate-800">
                    {p.category || 'General'}
                  </td>
                ))}
              </tr>

              {/* Brand */}
              <tr>
                <td className="p-4 font-semibold text-slate-500 text-xs uppercase">Brand</td>
                {compareList.map((p) => (
                  <td key={p.id} className="p-4 font-medium text-slate-800">
                    {p.brand || 'ShopWave'}
                  </td>
                ))}
              </tr>

              {/* Rating */}
              <tr>
                <td className="p-4 font-semibold text-slate-500 text-xs uppercase">Rating</td>
                {compareList.map((p) => (
                  <td key={p.id} className="p-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-slate-800 text-xs">
                        {p.rating ? p.rating.toFixed(1) : '5.0'}
                      </span>
                      <span className="text-[11px] text-slate-400">({p.review_count || 0})</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Availability */}
              <tr>
                <td className="p-4 font-semibold text-slate-500 text-xs uppercase">Availability</td>
                {compareList.map((p) => (
                  <td key={p.id} className="p-4">
                    {p.stock_quantity > 0 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                        <CheckCircle className="w-3.5 h-3.5" /> In Stock ({p.stock_quantity})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-500 font-semibold text-xs">
                        <XCircle className="w-3.5 h-3.5" /> Out of Stock
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Specifications Rows */}
              {allSpecKeys.map((specKey) => (
                <tr key={specKey}>
                  <td className="p-4 font-semibold text-slate-500 text-xs">{specKey}</td>
                  {compareList.map((p) => {
                    let val = '—';
                    if (p.specs) {
                      try {
                        const parsed = JSON.parse(p.specs);
                        val = parsed[specKey] || '—';
                      } catch {
                        val = '—';
                      }
                    }
                    return (
                      <td key={p.id} className="p-4 text-slate-700 font-medium">
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
