/** User profile page with personal info editing, address management, and password change. */
import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  User,
  Mail,
  Calendar,
  Shield,
  ShoppingBag,
  Heart,
  LogOut,
  MapPin,
  Lock,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Save,
  X,
  Star,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { authApi, addressesApi, reviewsApi } from '../services/api';
import type { Address, Review } from '../types';
import { formatDate } from '../utils';
import toast from 'react-hot-toast';

interface ProfilePageProps {
  initialTab?: 'info' | 'addresses' | 'security' | 'reviews';
}

export default function ProfilePage({ initialTab }: ProfilePageProps = {}) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { totalWishlist } = useWishlist();

  const [activeTab, setActiveTab] = useState<'info' | 'addresses' | 'security' | 'reviews'>(initialTab || 'info');

  // Personal Info Form State
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Address State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addrName, setAddrName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrZip, setAddrZip] = useState('');
  const [addrCountry, setAddrCountry] = useState('United States');
  const [addrDefault, setAddrDefault] = useState(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Reviews State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editTitle, setEditTitle] = useState('');
  const [editComment, setEditComment] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name);
      setLastName(user.last_name);
      setEmail(user.email);
    }
  }, [user]);

  // Load addresses
  const loadAddresses = () => {
    addressesApi
      .getAll()
      .then(setAddresses)
      .catch((err) => console.error('Failed to load addresses:', err));
  };

  useEffect(() => {
    if (isAuthenticated) loadAddresses();
  }, [isAuthenticated]);

  const loadReviews = () => {
    setIsLoadingReviews(true);
    reviewsApi
      .getMyReviews()
      .then(setReviews)
      .catch((err) => console.error('Failed to load reviews:', err))
      .finally(() => setIsLoadingReviews(false));
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === 'reviews') {
      loadReviews();
    }
  }, [isAuthenticated, activeTab]);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: { pathname: '/profile' } }} replace />;
  }

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await authApi.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
      });
      toast.success('Profile details updated successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Address Save
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddressId) {
        await addressesApi.update(editingAddressId, {
          full_name: addrName,
          phone: addrPhone,
          street_address: addrStreet,
          city: addrCity,
          state: addrState,
          postal_code: addrZip,
          country: addrCountry,
          is_default: addrDefault,
        });
        toast.success('Address updated.');
      } else {
        await addressesApi.create({
          full_name: addrName,
          phone: addrPhone,
          street_address: addrStreet,
          city: addrCity,
          state: addrState,
          postal_code: addrZip,
          country: addrCountry,
          is_default: addrDefault || addresses.length === 0,
        });
        toast.success('New address added.');
      }
      setShowAddressModal(false);
      resetAddressForm();
      loadAddresses();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to save address.');
    }
  };

  const resetAddressForm = () => {
    setEditingAddressId(null);
    setAddrName('');
    setAddrPhone('');
    setAddrStreet('');
    setAddrCity('');
    setAddrState('');
    setAddrZip('');
    setAddrCountry('United States');
    setAddrDefault(false);
  };

  const handleEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddrName(addr.full_name);
    setAddrPhone(addr.phone);
    setAddrStreet(addr.street_address);
    setAddrCity(addr.city);
    setAddrState(addr.state);
    setAddrZip(addr.postal_code);
    setAddrCountry(addr.country);
    setAddrDefault(addr.is_default);
    setShowAddressModal(true);
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm('Are you sure you want to remove this address?')) return;
    try {
      await addressesApi.delete(id);
      toast.success('Address removed.');
      loadAddresses();
    } catch {
      toast.error('Failed to remove address.');
    }
  };

  const handleSetDefaultAddress = async (id: number) => {
    try {
      await addressesApi.setDefault(id);
      toast.success('Default address updated.');
      loadAddresses();
    } catch {
      toast.error('Failed to set default address.');
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle Review Edit
  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditTitle(review.title);
    setEditComment(review.comment);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    try {
      await reviewsApi.update(editingReview.id, {
        rating: editRating,
        title: editTitle,
        comment: editComment,
      });
      toast.success('Review updated successfully!');
      setEditingReview(null);
      loadReviews();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to update review.');
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('Delete this review? This cannot be undone.')) return;
    try {
      await reviewsApi.delete(reviewId);
      toast.success('Review deleted.');
      loadReviews();
    } catch {
      toast.error('Failed to delete review.');
    }
  };

  const renderStars = (rating: number, interactive = false, onSet?: (v: number) => void) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && onSet && onSet(star)}
          className={`${
            interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default pointer-events-none'
          } transition-transform`}
          tabIndex={interactive ? 0 : -1}
        >
          <Star
            className={`w-4 h-4 ${
              star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="section">
      <div className="page-container max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">
          Account Settings
        </h1>

        {/* Profile Card Header */}
        <div className="card p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600 text-3xl font-extrabold shadow-sm">
              {user.first_name[0]}
              {user.last_name[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {user.first_name} {user.last_name}
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">@{user.username} • {user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-primary-100 text-primary-700'
                  }`}
                >
                  <Shield className="w-3 h-3" /> {user.role}
                </span>
                <span className="text-xs text-slate-400">
                  Joined {formatDate(user.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick shortcuts */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              to="/orders"
              className="btn-secondary text-xs py-2 px-3.5 flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4" /> My Orders
            </Link>
            <Link
              to="/wishlist"
              className="btn-secondary text-xs py-2 px-3.5 flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
            >
              <Heart className="w-4 h-4 text-red-500" /> Wishlist ({totalWishlist})
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 mb-8 space-x-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'info'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" /> Personal Information
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'addresses'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" /> Saved Addresses ({addresses.length})
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'security'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" /> Change Password
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'reviews'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> My Reviews
            {reviews.length > 0 && (
              <span className="ml-1 bg-primary-100 text-primary-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {reviews.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Personal Info */}
        {activeTab === 'info' && (
          <div className="card p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Edit Profile Details</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  disabled
                  value={user.username}
                  className="input-field text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-400 mt-1">Username cannot be changed.</p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="btn-primary py-2.5 px-6 text-sm font-semibold flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isUpdatingProfile ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Addresses */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Shipping Address Book</h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Manage addresses used during quick checkout
                </p>
              </div>
              <button
                onClick={() => {
                  resetAddressForm();
                  setShowAddressModal(true);
                }}
                className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="card p-12 text-center text-slate-400">
                <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-700">No saved addresses yet.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Add your primary address to speed up checkout.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`card p-5 relative border-2 ${
                      addr.is_default ? 'border-primary-600 bg-primary-50/20' : 'border-slate-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-bold text-slate-900 text-sm">{addr.full_name}</span>
                      {addr.is_default ? (
                        <span className="text-[10px] font-bold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-[11px] text-primary-600 hover:underline font-semibold"
                        >
                          Make Default
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                      {addr.street_address}, {addr.city}, {addr.state} {addr.postal_code}
                      <br />
                      {addr.country} • Tel: {addr.phone}
                    </p>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleEditAddress(addr)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Security & Password */}
        {activeTab === 'security' && (
          <div className="card p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Change Account Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field text-sm"
                />
                <p className="text-[11px] text-slate-400 mt-1">Must be at least 8 characters long.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field text-sm"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="btn-primary py-2.5 px-6 text-sm font-semibold"
                >
                  {isChangingPassword ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 4: My Reviews */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">My Product Reviews</h3>
                <p className="text-slate-500 text-xs mt-0.5">Reviews you've submitted for purchased products</p>
              </div>
              <Link to="/products" className="btn-secondary py-2 px-3.5 text-xs font-semibold">
                Browse Products
              </Link>
            </div>

            {isLoadingReviews ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="card p-5 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
                    <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="card p-12 text-center">
                <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-700">No reviews written yet.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Purchase products and share your experience to help other shoppers!
                </p>
                <Link to="/products" className="btn-primary py-2 px-5 text-xs font-semibold mt-4 inline-flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" /> Shop Products
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="card p-5">
                    {editingReview?.id === review.id ? (
                      // Inline Edit Form
                      <form onSubmit={handleSaveReview} className="space-y-3">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs font-semibold text-slate-600">Rating:</span>
                          {renderStars(editRating, true, setEditRating)}
                        </div>
                        <input
                          type="text"
                          required
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Review title"
                          className="input-field text-sm w-full"
                        />
                        <textarea
                          required
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          rows={3}
                          placeholder="Your review..."
                          className="input-field text-sm w-full resize-none"
                        />
                        <div className="flex gap-2 pt-1">
                          <button type="submit" className="btn-primary py-1.5 px-4 text-xs font-semibold flex items-center gap-1.5">
                            <Save className="w-3.5 h-3.5" /> Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingReview(null)}
                            className="btn-secondary py-1.5 px-4 text-xs font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      // Review Display
                      <>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            {review.product && (
                              <Link
                                to={`/products/${review.product_id}`}
                                className="text-xs font-bold text-primary-600 hover:underline mb-1 block"
                              >
                                {review.product.name || `Product #${review.product_id}`}
                              </Link>
                            )}
                            {renderStars(review.rating)}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleEditReview(review)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-slate-100 text-xs flex items-center gap-1"
                              title="Edit review"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteReview(review.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs flex items-center gap-1"
                              title="Delete review"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="font-semibold text-slate-900 text-sm">{review.title}</p>
                        <p className="text-slate-600 text-xs mt-1 leading-relaxed">{review.comment}</p>
                        <p className="text-[11px] text-slate-400 mt-2">{formatDate(review.created_at)}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Address Modal */}
        {showAddressModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowAddressModal(false)}
            />
            <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl z-10 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
                <h3 className="font-bold text-slate-900 text-lg">
                  {editingAddressId ? 'Edit Address' : 'Add New Address'}
                </h3>
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={addrName}
                      onChange={(e) => setAddrName(e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={addrPhone}
                      onChange={(e) => setAddrPhone(e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={addrStreet}
                    onChange={(e) => setAddrStreet(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={addrCity}
                      onChange={(e) => setAddrCity(e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={addrState}
                      onChange={(e) => setAddrState(e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Zip Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={addrZip}
                      onChange={(e) => setAddrZip(e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addrDefault}
                    onChange={(e) => setAddrDefault(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-xs text-slate-700 font-medium">Set as default shipping address</span>
                </label>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="btn-secondary py-2 px-4 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary py-2 px-5 text-xs font-semibold">
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
