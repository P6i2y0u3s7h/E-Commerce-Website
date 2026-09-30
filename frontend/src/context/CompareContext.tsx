/**
 * Compare Context: Manages product comparison list (max 4 products).
 * Persisted in localStorage.
 */
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Product } from '../types';
import toast from 'react-hot-toast';

interface CompareContextValue {
  compareList: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: number) => void;
  isInCompare: (productId: number) => boolean;
  clearCompare: () => void;
  totalCompare: number;
}

const CompareContext = createContext<CompareContextValue | null>(null);
const STORAGE_KEY = 'shopwave_compare_list';

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareList, setCompareList] = useState<Product[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compareList));
  }, [compareList]);

  const isInCompare = (productId: number) => compareList.some((p) => p.id === productId);

  const addToCompare = (product: Product) => {
    if (isInCompare(product.id)) {
      removeFromCompare(product.id);
      return;
    }
    if (compareList.length >= 4) {
      toast.error('You can compare a maximum of 4 products at a time.');
      return;
    }
    setCompareList((prev) => [...prev, product]);
    toast.success(`Added ${product.name} to comparison list`);
  };

  const removeFromCompare = (productId: number) => {
    setCompareList((prev) => prev.filter((p) => p.id !== productId));
    toast.success('Removed from comparison');
  };

  const clearCompare = () => {
    setCompareList([]);
    toast.success('Comparison list cleared');
  };

  return (
    <CompareContext.Provider
      value={{
        compareList,
        addToCompare,
        removeFromCompare,
        isInCompare,
        clearCompare,
        totalCompare: compareList.length,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}
