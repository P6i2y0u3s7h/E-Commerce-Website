/**
 * Wishlist Context: Manages customer wishlist items.
 * Syncs with backend for authenticated users, and localStorage for guests.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Product, WishlistItem } from '../types';
import { wishlistApi } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface WishlistContextValue {
  wishlist: Product[];
  isInWishlist: (productId: number) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  isLoading: boolean;
  totalWishlist: number;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);
const STORAGE_KEY = 'shopwave_guest_wishlist';

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load wishlist from backend or localStorage
  const loadWishlist = useCallback(async () => {
    if (isAuthenticated) {
      setIsLoading(true);
      try {
        const items = await wishlistApi.getAll();
        setWishlist(items.map((i: WishlistItem) => i.product));
      } catch (err) {
        console.error('Failed to load wishlist:', err);
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        setWishlist(stored ? JSON.parse(stored) : []);
      } catch {
        setWishlist([]);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  // Persist guest wishlist
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
    }
  }, [wishlist, isAuthenticated]);

  const isInWishlist = useCallback(
    (productId: number) => wishlist.some((p) => p.id === productId),
    [wishlist]
  );

  const toggleWishlist = async (product: Product) => {
    const exists = isInWishlist(product.id);
    if (exists) {
      await removeFromWishlist(product.id);
    } else {
      if (isAuthenticated) {
        try {
          await wishlistApi.add(product.id);
          setWishlist((prev) => [...prev, product]);
          toast.success(`Added ${product.name} to wishlist`);
        } catch {
          toast.error('Failed to add to wishlist');
        }
      } else {
        setWishlist((prev) => [...prev, product]);
        toast.success(`Added ${product.name} to wishlist`);
      }
    }
  };

  const removeFromWishlist = async (productId: number) => {
    if (isAuthenticated) {
      try {
        await wishlistApi.remove(productId);
        setWishlist((prev) => prev.filter((p) => p.id !== productId));
        toast.success('Removed from wishlist');
      } catch {
        toast.error('Failed to remove from wishlist');
      }
    } else {
      setWishlist((prev) => prev.filter((p) => p.id !== productId));
      toast.success('Removed from wishlist');
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        isLoading,
        totalWishlist: wishlist.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
