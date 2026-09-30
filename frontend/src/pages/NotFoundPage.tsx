/** 404 Not Found Page */
import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="section min-h-[60vh] flex items-center justify-center">
      <div className="page-container text-center max-w-md">
        <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-sm">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">404</h1>
        <h2 className="text-xl font-semibold text-slate-700 mb-3">Page Not Found</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Oops! The page you're looking for doesn't exist, may have been removed, or is temporarily unavailable.
        </p>
        <Link
          to="/"
          className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
