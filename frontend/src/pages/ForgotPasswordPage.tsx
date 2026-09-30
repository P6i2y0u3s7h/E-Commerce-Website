/** Forgot Password and Password Reset flow. */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Mail, ArrowLeft, CheckCircle, ShieldCheck, Zap } from 'lucide-react';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Reset form state
  const [tokenInput, setTokenInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  const navigate = useNavigate();

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      toast.success(res.message);
      if (res.reset_token) {
        setResetToken(res.reset_token);
        setTokenInput(res.reset_token);
      }
    } catch {
      toast.error('Failed to process reset request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsResetting(true);
    try {
      const res = await authApi.resetPassword(tokenInput.trim(), newPassword);
      toast.success(res.message);
      setResetComplete(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to reset password. Token may be invalid or expired.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="section">
      <div className="page-container max-w-md mx-auto py-12">
        <div className="card p-8 shadow-xl">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reset Password</h1>
            <p className="text-slate-500 text-xs mt-1">
              Enter your account email to receive a password reset token
            </p>
          </div>

          {resetComplete ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Password Changed!</h2>
              <p className="text-sm text-slate-500">
                Your password has been successfully updated. You can now log in with your new credentials.
              </p>
              <Link to="/login" className="btn-primary w-full py-2.5 text-sm inline-block">
                Sign In Now
              </Link>
            </div>
          ) : resetToken ? (
            /* Step 2: Enter new password with token */
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                <p className="font-semibold mb-1">⚡ Demo Mode — Reset Token Ready:</p>
                <p className="font-mono text-[10px] break-all bg-white p-2 rounded border border-amber-200">
                  {resetToken}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reset Token</label>
                <input
                  type="text"
                  required
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="input-field text-xs font-mono"
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
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isResetting}
                className="btn-primary w-full py-2.5 text-sm font-semibold"
              >
                {isResetting ? 'Resetting…' : 'Set New Password'}
              </button>
            </form>
          ) : (
            /* Step 1: Request reset */
            <form onSubmit={handleRequestToken} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field text-sm pl-9"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-2.5 text-sm font-semibold"
              >
                {isSubmitting ? 'Sending Instructions…' : 'Send Reset Instructions'}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs text-primary-600 hover:underline font-semibold inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
