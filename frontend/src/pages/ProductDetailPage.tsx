/** Product detail page — comprehensive gallery, stock status, reviews, specs, and recommendations. */
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShoppingCart,
  ArrowLeft,
  Package,
  CheckCircle,
  XCircle,
  Minus,
  Plus,
  Heart,
  Scale,
  Star,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  MessageSquare,
  Trash2,
  Edit2,
  AlertTriangle,
} from 'lucide-react';
import type { Product, ReviewStats, ProductRecommendations, ProductVariant } from '../types';
import { productsApi, reviewsApi } from '../services/api';
import { formatPrice, getImageUrl } from '../utils';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';
import { useAuth } from '../context/AuthContext';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import ProductCard from '../components/products/ProductCard';
import { ProductDetailSkeleton } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);

  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInCompare, addToCompare } = useCompare();
  const { isAuthenticated, user, isAdmin } = useAuth();
  const { recentlyViewed, addProduct: trackRecentlyViewed } = useRecentlyViewed();

  const [product, setProduct] = useState<Product | null>(null);
  const [recommendations, setRecommendations] = useState<ProductRecommendations | null>(null);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>();

  // Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);

  // Load product, reviews, and recommendations
  useEffect(() => {
    if (!productId) return;
    setIsLoading(true);
    setNotFound(false);
    setActiveImageIndex(0);
    setQuantity(1);

    Promise.all([
      productsApi.getById(productId),
      reviewsApi.getByProduct(productId).catch(() => null),
      productsApi.getRecommendations(productId).catch(() => null),
    ])
      .then(([prodData, revData, recData]) => {
        setProduct(prodData);
        trackRecentlyViewed(prodData);
        if (revData) setReviewStats(revData);
        if (recData) setRecommendations(recData);
        if (prodData.variants && prodData.variants.length > 0) {
          setSelectedVariant(prodData.variants[0]);
        }
      })
      .catch((err: any) => {
        if (err?.response?.status === 404) setNotFound(true);
      })
      .finally(() => setIsLoading(false));
  }, [productId, trackRecentlyViewed]);

  if (isLoading) {
    return (
      <div className="section">
        <div className="page-container">
          <ProductDetailSkeleton />
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="section">
        <div className="page-container text-center py-20 card p-8 max-w-lg mx-auto">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Product Not Found</h2>
          <p className="text-slate-500 mb-6">
            The item you are searching for does not exist or may have been unlisted.
          </p>
          <Link to="/products" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Products
          </Link>
        </div>
      </div>
    );
  }

  // Stock status
  const maxStock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;
  const inStock = maxStock > 0;
  const isLowStock = inStock && maxStock <= 10;
  const wishlisted = isInWishlist(product.id);
  const compared = isInCompare(product.id);

  // Gallery image list
  const galleryImages: string[] = [];
  if (product.image_url) galleryImages.push(product.image_url);
  if (product.images && product.images.length > 0) {
    product.images.forEach((img) => {
      if (!galleryImages.includes(img.image_url)) {
        galleryImages.push(img.image_url);
      }
    });
  }
  if (galleryImages.length === 0) {
    galleryImages.push('https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=600');
  }

  const currentImageUrl = galleryImages[activeImageIndex] || galleryImages[0];

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
  };

  const handleAddToCart = () => {
    if (!inStock) return;
    const added = addItem(product, quantity, selectedVariant);
    if (added) {
      toast.success(`Added ${quantity} × ${product.name} to cart!`);
    }
  };

  // Parse specifications
  let parsedSpecs: Record<string, string> = {};
  if (product.specs) {
    try {
      parsedSpecs = JSON.parse(product.specs);
    } catch {
      parsedSpecs = {};
    }
  }

  // Review submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim() || !reviewComment.trim()) {
      toast.error('Please enter a review headline and comment.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      if (editingReviewId) {
        await reviewsApi.update(editingReviewId, {
          rating: reviewRating,
          title: reviewTitle.trim(),
          comment: reviewComment.trim(),
        });
        toast.success('Review updated successfully!');
      } else {
        await reviewsApi.create(product.id, {
          rating: reviewRating,
          title: reviewTitle.trim(),
          comment: reviewComment.trim(),
        });
        toast.success('Thank you! Your review has been published.');
      }
      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
      setEditingReviewId(null);
      // Refresh review stats
      const updated = await reviewsApi.getByProduct(product.id);
      setReviewStats(updated);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await reviewsApi.delete(reviewId);
      toast.success('Review deleted.');
      const updated = await reviewsApi.getByProduct(product.id);
      setReviewStats(updated);
    } catch {
      toast.error('Failed to delete review.');
    }
  };

  const startEditReview = (r: any) => {
    setEditingReviewId(r.id);
    setReviewRating(r.rating);
    setReviewTitle(r.title);
    setReviewComment(r.comment);
    window.scrollTo({ top: document.getElementById('review-form-section')?.offsetTop || 0, behavior: 'smooth' });
  };

  return (
    <div className="section">
      <div className="page-container">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link to="/" className="hover:text-slate-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/products" className="hover:text-slate-900 transition-colors">
            Products
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-medium truncate max-w-xs">{product.name}</span>
        </div>

        {/* Product Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Left: Image Gallery */}
          <div className="space-y-4">
            <div className="card overflow-hidden bg-slate-100 relative group aspect-square flex items-center justify-center">
              <img
                src={getImageUrl(currentImageUrl)}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-300"
              />

              {/* Prev / Next controls */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md text-slate-700 flex items-center justify-center hover:bg-white transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md text-slate-700 flex items-center justify-center hover:bg-white transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Row */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {galleryImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                      activeImageIndex === idx
                        ? 'border-primary-600 ring-2 ring-primary-100'
                        : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={getImageUrl(imgUrl)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details & Actions */}
          <div className="flex flex-col">
            {/* Category & Brand badge */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2.5 py-1 rounded-md">
                {product.category || 'General'}
              </span>
              {product.brand && (
                <span className="text-xs font-semibold text-slate-500">{product.brand}</span>
              )}
            </div>

            {/* Product Name */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
              {product.name}
            </h1>

            {/* Ratings Summary */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(product.rating || 5)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                ))}
                <span className="font-bold text-sm text-slate-800 ml-1.5">
                  {product.rating ? product.rating.toFixed(1) : '5.0'}
                </span>
              </div>
              <span className="text-slate-300">•</span>
              <a
                href="#reviews-section"
                className="text-sm text-primary-600 hover:underline font-medium"
              >
                {reviewStats?.total_reviews ?? product.review_count ?? 0} reviews
              </a>
            </div>

            {/* Price */}
            <div className="text-3xl font-extrabold text-slate-900 mb-5">
              {formatPrice(product.price + (selectedVariant?.price_adjustment || 0))}
            </div>

            {/* Stock status indicator */}
            <div className="flex items-center gap-2 mb-6">
              {!inStock ? (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg text-sm font-semibold">
                  <XCircle className="w-4 h-4" />
                  Currently Out of Stock
                </div>
              ) : isLowStock ? (
                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg text-sm font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Low Stock — Only {maxStock} left in stock!
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg text-sm font-semibold">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  In Stock ({maxStock} units ready to ship)
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-slate-600 leading-relaxed mb-6 text-sm sm:text-base border-t border-slate-100 pt-5">
                {product.description}
              </p>
            )}

            {/* Variants Selector if available */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Select {product.variants[0].name}:
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3.5 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                        selectedVariant?.id === v.id
                          ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-sm'
                          : 'border-slate-200 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {v.value}
                      {v.price_adjustment > 0 && ` (+${formatPrice(v.price_adjustment)})`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector + Add to Cart */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
              <div className="flex items-center justify-between border border-slate-200 rounded-xl bg-slate-50 px-3 py-2 sm:w-36">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || !inStock}
                  className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-semibold text-slate-900 px-3">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                  disabled={quantity >= maxStock || !inStock}
                  className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!inStock}
                className="btn-primary flex-1 py-3 text-base font-semibold shadow-lg shadow-primary-500/20"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart • {formatPrice((product.price + (selectedVariant?.price_adjustment || 0)) * quantity)}
              </button>
            </div>

            {/* Action Buttons: Wishlist & Compare */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => toggleWishlist(product)}
                className={`btn-secondary text-sm py-2 px-4 flex items-center gap-2 flex-1 justify-center ${
                  wishlisted ? 'text-red-600 border-red-200 bg-red-50/50' : ''
                }`}
              >
                <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                {wishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
              </button>

              <button
                onClick={() => addToCompare(product)}
                className={`btn-secondary text-sm py-2 px-4 flex items-center gap-2 flex-1 justify-center ${
                  compared ? 'text-primary-600 border-primary-200 bg-primary-50/50' : ''
                }`}
              >
                <Scale className="w-4 h-4" />
                {compared ? 'In Comparison' : 'Compare'}
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 pt-6 mt-6 border-t border-slate-100 text-center">
              <div className="flex flex-col items-center gap-1">
                <Truck className="w-5 h-5 text-primary-600" />
                <span className="text-xs font-semibold text-slate-800">Fast Shipping</span>
                <span className="text-[11px] text-slate-400">Free on orders ₹499+</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-5 h-5 text-primary-600" />
                <span className="text-xs font-semibold text-slate-800">100% Authentic</span>
                <span className="text-[11px] text-slate-400">Guaranteed quality</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <RotateCcw className="w-5 h-5 text-primary-600" />
                <span className="text-xs font-semibold text-slate-800">Easy Returns</span>
                <span className="text-[11px] text-slate-400">30-day return policy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications Table */}
        {Object.keys(parsedSpecs).length > 0 && (
          <div className="card p-6 sm:p-8 mb-16">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Technical Specifications</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3">
              {Object.entries(parsedSpecs).map(([key, val]) => (
                <div key={key} className="flex justify-between py-2 border-b border-slate-100 text-sm">
                  <span className="text-slate-500 font-medium">{key}</span>
                  <span className="text-slate-900 font-semibold text-right">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customer Reviews Section */}
        <section id="reviews-section" className="card p-6 sm:p-8 mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Customer Reviews</h2>
              <p className="text-slate-500 text-sm mt-1">
                Based on {reviewStats?.total_reviews ?? 0} verified customer rating(s)
              </p>
            </div>

            {/* Overall Rating Display */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-black text-slate-900 leading-none">
                  {reviewStats?.average_rating ? reviewStats.average_rating.toFixed(1) : '5.0'}
                </div>
                <div className="flex items-center justify-center gap-1 my-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.round(reviewStats?.average_rating || 5)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-[11px] text-slate-400">out of 5 stars</div>
              </div>

              {/* Rating Distribution Bars */}
              {reviewStats && (
                <div className="space-y-1 w-48 sm:w-56 text-xs">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviewStats.rating_distribution[String(stars)] || 0;
                    const percent =
                      reviewStats.total_reviews > 0 ? (count / reviewStats.total_reviews) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-2">
                        <span className="w-3 text-right text-slate-600 font-semibold">{stars}★</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-6 text-slate-400 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Write / Edit Review Form */}
          <div id="review-form-section" className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
            <h3 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-600" />
              {editingReviewId ? 'Edit Your Review' : 'Write a Review'}
            </h3>

            {isAuthenticated ? (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Interactive Star Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Your Rating:
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= reviewRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300 hover:text-amber-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-2">
                      {reviewRating} out of 5 stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Review Headline
                  </label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g. Fantastic build quality and performance"
                    required
                    className="input-field text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Review Details
                  </label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell other shoppers what you liked or disliked about this product..."
                    required
                    className="input-field text-sm"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="btn-primary py-2 px-5 text-sm"
                  >
                    {isSubmittingReview
                      ? 'Submitting…'
                      : editingReviewId
                      ? 'Update Review'
                      : 'Post Review'}
                  </button>
                  {editingReviewId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingReviewId(null);
                        setReviewTitle('');
                        setReviewComment('');
                        setReviewRating(5);
                      }}
                      className="btn-secondary py-2 px-4 text-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-600 mb-3">
                  Please log in to your account to share your product experience.
                </p>
                <Link to="/login" className="btn-secondary py-2 px-4 text-sm">
                  Sign In to Review
                </Link>
              </div>
            )}
          </div>

          {/* Reviews List */}
          {reviewStats?.reviews && reviewStats.reviews.length > 0 ? (
            <div className="space-y-4">
              {reviewStats.reviews.map((r) => {
                const isAuthor = user?.id === r.user_id;
                return (
                  <div key={r.id} className="p-5 rounded-xl border border-slate-100 bg-white">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">
                          {r.user.first_name[0]}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 text-sm">
                            {r.user.first_name} {r.user.last_name}
                          </span>
                          <span className="text-xs text-slate-400 ml-2">Verified Buyer</span>
                        </div>
                      </div>

                      {/* Author Edit / Delete */}
                      {(isAuthor || isAdmin) && (
                        <div className="flex items-center gap-1.5">
                          {isAuthor && (
                            <button
                              onClick={() => startEditReview(r)}
                              className="p-1.5 text-slate-400 hover:text-primary-600 rounded-lg hover:bg-slate-50"
                              title="Edit review"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReview(r.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Delete review"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{r.title}</h4>
                    </div>

                    <p className="text-slate-600 text-sm leading-relaxed">{r.comment}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              No customer reviews yet. Be the first to review this product!
            </div>
          )}
        </section>

        {/* Similar Products */}
        {recommendations?.similar && recommendations.similar.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Similar Products</h2>
                <p className="text-slate-500 text-sm">More items in {product.category}</p>
              </div>
              <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="text-sm font-semibold text-primary-600 hover:underline">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations.similar.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Customers Also Viewed */}
        {recommendations?.also_viewed && recommendations.also_viewed.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Customers Also Viewed</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations.also_viewed.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Recently Viewed Products */}
        {recentlyViewed.filter((p) => p.id !== product.id).length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Recently Viewed</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {recentlyViewed
                .filter((p) => p.id !== product.id)
                .slice(0, 6)
                .map((p) => (
                  <Link
                    key={p.id}
                    to={`/products/${p.id}`}
                    className="card p-3 group hover:shadow-card-hover transition-all flex flex-col"
                  >
                    <div className="aspect-square rounded-lg bg-slate-100 overflow-hidden mb-2">
                      <img
                        src={getImageUrl(p.image_url)}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <p className="text-xs font-medium text-slate-900 line-clamp-1 group-hover:text-primary-600">
                      {p.name}
                    </p>
                    <p className="text-xs font-bold text-slate-900 mt-1">{formatPrice(p.price)}</p>
                  </Link>
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
