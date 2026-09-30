/** Product card component shown in grids with wishlist, rating, and stock indicators. */
import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye, Package, Heart, Star, Scale } from 'lucide-react';
import type { Product } from '../../types';
import { formatPrice, getImageUrl, truncate } from '../../utils';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInCompare, addToCompare } = useCompare();

  const inStock = product.stock_quantity > 0;
  const isLowStock = inStock && product.stock_quantity <= 10;
  const wishlisted = isInWishlist(product.id);
  const compared = isInCompare(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!inStock) return;
    const added = addItem(product);
    if (added) {
      toast.success(`${product.name} added to cart!`, { duration: 2000 });
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCompare(product);
  };

  return (
    <div className="card-hover group flex flex-col relative">
      {/* Product image container */}
      <Link to={`/products/${product.id}`} className="block overflow-hidden relative">
        <div className="relative h-56 bg-slate-100">
          <img
            src={getImageUrl(product.image_url)}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=600';
            }}
          />

          {/* Out of Stock overlay */}
          {!inStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
              <span className="badge-red text-sm px-3 py-1 font-semibold">Out of Stock</span>
            </div>
          )}

          {/* Category Pill */}
          {product.category && (
            <span className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-900/70 text-white backdrop-blur-md">
              {product.category}
            </span>
          )}

          {/* Action buttons (Wishlist & Compare) */}
          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
            {/* Wishlist Heart */}
            <button
              onClick={handleWishlistToggle}
              className={`p-2 rounded-full shadow-sm transition-all duration-200 ${
                wishlisted
                  ? 'bg-white text-red-500 hover:scale-110'
                  : 'bg-white/90 text-slate-400 hover:text-red-500 hover:bg-white'
              }`}
              title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-label="Wishlist"
            >
              <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500' : ''}`} />
            </button>

            {/* Compare Toggle */}
            <button
              onClick={handleCompareToggle}
              className={`p-2 rounded-full shadow-sm transition-all duration-200 ${
                compared
                  ? 'bg-primary-600 text-white hover:scale-110'
                  : 'bg-white/90 text-slate-400 hover:text-primary-600 hover:bg-white'
              }`}
              title={compared ? 'Remove from compare' : 'Compare product'}
              aria-label="Compare"
            >
              <Scale className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        {/* Brand & Rating row */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
            {product.brand || 'ShopWave'}
          </span>
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-slate-700">
              {product.rating ? product.rating.toFixed(1) : '5.0'}
            </span>
            <span className="text-xs text-slate-400">({product.review_count || 0})</span>
          </div>
        </div>

        <Link to={`/products/${product.id}`} className="group/link">
          <h3 className="font-semibold text-slate-900 text-base leading-snug group-hover/link:text-primary-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {product.description && (
          <p className="text-slate-500 text-sm mt-1.5 line-clamp-2">
            {truncate(product.description, 75)}
          </p>
        )}

        {/* Stock info */}
        <div className="flex items-center gap-1.5 mt-2.5">
          <Package className="w-3.5 h-3.5 text-slate-400" />
          <span
            className={`text-xs font-medium ${
              !inStock
                ? 'text-red-500'
                : isLowStock
                ? 'text-amber-600 font-semibold'
                : 'text-emerald-600'
            }`}
          >
            {!inStock
              ? 'Out of stock'
              : isLowStock
              ? `Only ${product.stock_quantity} left in stock!`
              : `${product.stock_quantity} in stock`}
          </span>
        </div>

        {/* Price + actions */}
        <div className="mt-auto pt-4 flex items-center justify-between gap-2 border-t border-slate-50">
          <span className="text-xl font-bold text-slate-900">
            {formatPrice(product.price)}
          </span>
          <div className="flex gap-2">
            <Link
              to={`/products/${product.id}`}
              className="p-2 rounded-xl text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
              title="View details"
            >
              <Eye className="w-5 h-5" />
            </Link>
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="btn-primary py-2 px-3 text-sm disabled:opacity-40"
              title={inStock ? 'Add to cart' : 'Out of stock'}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
