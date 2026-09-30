/** Registration page. */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import toast from 'react-hot-toast';

// ── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

interface FormErrors {
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  confirm_password?: string;
}

// ── Stable Field component — MUST live outside RegisterPage ──────────────────
//
// ROOT CAUSE OF THE FOCUS BUG:
//   When a component (e.g. `const Field = () => ...`) is *defined inside* a
//   parent component, React sees a brand-new component *type* on every render.
//   That forces a full unmount + remount of the DOM node, which destroys focus
//   after every keystroke.
//
// FIX:
//   Declare Field as a top-level named function. Its identity is stable across
//   renders, so React reconciles it in-place (no remount, no focus loss).
//   `value`, `error`, and `onChange` are passed as explicit props.
// ─────────────────────────────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  name: keyof FormState;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  value: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function Field({
  id,
  name,
  label,
  type = 'text',
  placeholder,
  autoComplete,
  value,
  error,
  onChange,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="input-label">
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        className={`input-field ${error ? 'border-red-300 focus:ring-red-400' : ''}`}
        placeholder={placeholder}
      />
      {error && <p className="input-error">{error}</p>}
    </div>
  );
}

// ── Page component ───────────────────────────────────────────────────────────

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Already authenticated — redirect
  if (isAuthenticated) {
    navigate('/products', { replace: true });
    return null;
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.username.trim() || form.username.length < 3)
      newErrors.username = 'Username must be at least 3 characters.';
    if (!form.first_name.trim())
      newErrors.first_name = 'First name is required.';
    if (!form.last_name.trim())
      newErrors.last_name = 'Last name is required.';
    if (!form.email.trim() || !form.email.includes('@'))
      newErrors.email = 'Enter a valid email address.';
    if (form.password.length < 8)
      newErrors.password = 'Password must be at least 8 characters.';
    if (form.password !== form.confirm_password)
      newErrors.confirm_password = 'Passwords do not match.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setApiError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
      });
      toast.success('Account created! Welcome aboard 🎉');
      navigate('/products', { replace: true });
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg">
        <div className="card p-8">
          {/* Logo / header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
            <p className="text-slate-500 text-sm mt-1">
              Join thousands of happy ShopWave customers
            </p>
          </div>

          {/* API-level error banner */}
          {apiError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <Field
              id="reg-username"
              name="username"
              label="Username"
              placeholder="johndoe"
              autoComplete="username"
              value={form.username}
              error={errors.username}
              onChange={handleChange}
            />

            {/* First / Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <Field
                id="reg-first-name"
                name="first_name"
                label="First Name"
                placeholder="John"
                autoComplete="given-name"
                value={form.first_name}
                error={errors.first_name}
                onChange={handleChange}
              />
              <Field
                id="reg-last-name"
                name="last_name"
                label="Last Name"
                placeholder="Doe"
                autoComplete="family-name"
                value={form.last_name}
                error={errors.last_name}
                onChange={handleChange}
              />
            </div>

            {/* Email */}
            <Field
              id="reg-email"
              name="email"
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={form.email}
              error={errors.email}
              onChange={handleChange}
            />

            {/* Password (with show/hide toggle) */}
            <div>
              <label htmlFor="reg-password" className="input-label">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  className={`input-field pr-11 ${errors.password ? 'border-red-300' : ''}`}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="input-error">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="reg-confirm-password" className="input-label">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                id="reg-confirm-password"
                name="confirm_password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.confirm_password}
                onChange={handleChange}
                className={`input-field ${errors.confirm_password ? 'border-red-300' : ''}`}
                placeholder="Repeat your password"
              />
              {errors.confirm_password && (
                <p className="input-error">{errors.confirm_password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary w-full py-3 text-base mt-2"
              disabled={isLoading}
              id="register-submit-btn"
            >
              <UserPlus className="w-5 h-5" />
              {isLoading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary-600 font-medium hover:text-primary-700 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
