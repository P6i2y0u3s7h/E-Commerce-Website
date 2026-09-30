/** Admin product form — create or edit a product with category and brand fields. */
import React, { useState, useEffect } from 'react';
import type { Product, ProductCreate, ProductUpdate } from '../../types';

interface ProductFormProps {
  initialData?: Product;
  onSubmit: (data: ProductCreate | ProductUpdate) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  mode: 'create' | 'edit';
}

interface FormErrors {
  name?: string;
  price?: string;
  stock_quantity?: string;
}

export default function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  mode,
}: ProductFormProps) {
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    category: initialData?.category ?? 'Electronics',
    brand: initialData?.brand ?? '',
    price: initialData?.price?.toString() ?? '',
    image_url: initialData?.image_url ?? '',
    stock_quantity: initialData?.stock_quantity?.toString() ?? '0',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        description: initialData.description ?? '',
        category: initialData.category ?? 'Electronics',
        brand: initialData.brand ?? '',
        price: initialData.price.toString(),
        image_url: initialData.image_url ?? '',
        stock_quantity: initialData.stock_quantity.toString(),
      });
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = 'Product name is required.';
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) newErrors.price = 'Enter a valid non-negative price.';
    const stock = parseInt(form.stock_quantity, 10);
    if (isNaN(stock) || stock < 0) newErrors.stock_quantity = 'Enter a valid non-negative quantity.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: ProductCreate = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      category: form.category.trim() || 'General',
      brand: form.brand.trim() || undefined,
      price: parseFloat(form.price),
      image_url: form.image_url.trim() || undefined,
      stock_quantity: parseInt(form.stock_quantity, 10),
    };

    await onSubmit(payload);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label htmlFor="prod-name" className="input-label">
          Product Name <span className="text-red-500">*</span>
        </label>
        <input
          id="prod-name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          className="input-field text-sm"
          placeholder="e.g. Sony WH-1000XM5 Headphones"
        />
        {errors.name && <p className="input-error">{errors.name}</p>}
      </div>

      {/* Category + Brand */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="prod-category" className="input-label">
            Category
          </label>
          <input
            id="prod-category"
            name="category"
            type="text"
            value={form.category}
            onChange={handleChange}
            className="input-field text-sm"
            placeholder="e.g. Electronics"
          />
        </div>
        <div>
          <label htmlFor="prod-brand" className="input-label">
            Brand
          </label>
          <input
            id="prod-brand"
            name="brand"
            type="text"
            value={form.brand}
            onChange={handleChange}
            className="input-field text-sm"
            placeholder="e.g. Sony"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="prod-description" className="input-label">
          Description
        </label>
        <textarea
          id="prod-description"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          className="input-field resize-none text-sm"
          placeholder="Describe the product..."
        />
      </div>

      {/* Price + Stock */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="prod-price" className="input-label">
            Product Price (₹) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">
              ₹
            </span>
            <input
              id="prod-price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              className="input-field text-sm pl-7"
              placeholder="1499"
            />
          </div>
          {errors.price && <p className="input-error">{errors.price}</p>}
        </div>
        <div>
          <label htmlFor="prod-stock" className="input-label">
            Stock Quantity <span className="text-red-500">*</span>
          </label>
          <input
            id="prod-stock"
            name="stock_quantity"
            type="number"
            min="0"
            value={form.stock_quantity}
            onChange={handleChange}
            className="input-field text-sm"
            placeholder="25"
          />
          {errors.stock_quantity && (
            <p className="input-error">{errors.stock_quantity}</p>
          )}
        </div>
      </div>

      {/* Image URL */}
      <div>
        <label htmlFor="prod-image" className="input-label">
          Image URL
        </label>
        <input
          id="prod-image"
          name="image_url"
          type="url"
          value={form.image_url}
          onChange={handleChange}
          className="input-field text-sm"
          placeholder="https://images.unsplash.com/photo-..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1 text-sm py-2"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary flex-1 text-sm py-2"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? mode === 'create'
              ? 'Creating…'
              : 'Saving…'
            : mode === 'create'
            ? 'Create Product'
            : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
