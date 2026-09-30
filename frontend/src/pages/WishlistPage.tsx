/** Wishlist Page: Manage saved favorite products with quick add to cart, add all, and removal. */
import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowLeft, Package, ShoppingBag } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { formatPrice, getImageUrl } from '../utils';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addItem, items: cartItems } = useCart();

  const handleAddToCart = (product: any) => {
    if (product.stock_quantity <= 0) {
      toast.error('Item is out of stock.');
      return;
    }
    const added = addItem(product);
    if (added) {
      toast.success(`${product.name} added to cart!`);
    }
  };

  const handleAddAllToCart = () => {
    const inStockItems = wishlist.filter((p) => p.stock_quantity > 0);
    if (inStockItems.length === 0) {
      toast.error('No in-stock items to add.');
      return;
    }
    let addedCount = 0;
    inStockItems.forEach((product) => {
      const added = addItem(product);
      if (added) addedCount++;
    });
    if (addedCount > 0) {
      toast.success(`${addedCount} item${addedCount > 1 ? 's' : ''} added to cart!`);
    }
  };

  const isInCart = (productId: number) =>
    cartItems.some((item) => item.product.id === productId);

  const inStockCount = wishlist.filter((p) => p.stock_quantity > 0).length;

  if (wishlist.length === 0) {
    return (
      <div className="section">
        <div className="page-container text-center py-20 card p-8 max-w-lg mx-auto">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Your wishlist is empty</h1>
          <p className="text-slate-500 text-sm mb-6">
            Save items you love by tapping the heart icon on any product card!
          </p>
          <Link to="/products" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Discover Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="page-container">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Heart className="w-7 h-7 text-red-500 fill-red-500" />
              My Wishlist
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved
              {inStockCount < wishlist.length && (
                <span className="ml-2 text-amber-600 font-semibold">
                  ({wishlist.length - inStockCount} out of stock)
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {inStockCount > 0 && (
              <button
                onClick={handleAddAllToCart}
                className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5"
              >
                <ShoppingBag className="w-4 h-4" />
                Add All to Cart ({inStockCount})
              </button>
            )}
            <Link to="/products" className="btn-secondary py-2 px-4 text-xs font-semibold">
              Continue Shopping
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((product) => {
            const inStock = product.stock_quantity > 0;
            const inCart = isInCart(product.id);
            return (
              <div key={product.id} className="card-hover flex flex-col group">
                <div className="relative aspect-square bg-slate-100 overflow-hidden">
                  <Link to={`/products/${product.id}`}>
                    <img
                      src={getImageUrl(product.image_url)}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 text-red-500 hover:bg-white hover:scale-110 shadow-sm transition-all"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {!inStock && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="badge-red text-xs px-2.5 py-1">Out of Stock</span>
                    </div>
                  )}
                  {inCart && inStock && (
                    <div className="absolute top-2.5 left-2.5">
                      <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                        In Cart
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <span className="text-xs font-semibold text-primary-600 uppercase mb-1">
                    {product.category || 'General'}
                  </span>
                  <Link
                    to={`/products/${product.id}`}
                    className="font-bold text-slate-900 text-sm hover:text-primary-600 transition-colors line-clamp-2 mb-1"
                  >
                    {product.name}
                  </Link>
                  {product.brand && (
                    <p className="text-xs text-slate-400 mb-2">{product.brand}</p>
                  )}

                  <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-50">
                    <span className="text-lg font-extrabold text-slate-900">
                      {formatPrice(product.price)}
                    </span>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={!inStock}
                      className="btn-primary py-1.5 px-3 text-xs font-semibold disabled:opacity-40 flex items-center gap-1.5"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      {inCart ? 'Add Again' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary bar */}
        {wishlist.length > 0 && (
          <div className="mt-10 card p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-slate-700">
              <span className="font-bold text-slate-900">{wishlist.length} items</span> in wishlist
              {inStockCount > 0 && (
                <span className="ml-2 text-emerald-700 font-semibold">
                  • {inStockCount} available
                </span>
              )}
              <span className="ml-3 text-slate-500">
                Estimated total:{' '}
                <span className="font-bold text-slate-900">
                  {formatPrice(wishlist.reduce((sum, p) => sum + p.price, 0))}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/cart" className="btn-secondary py-2 px-4 text-xs font-semibold flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4" /> View Cart
              </Link>
              {inStockCount > 0 && (
                <button
                  onClick={handleAddAllToCart}
                  className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Add All to Cart
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
