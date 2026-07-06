'use client';

/* ============================================
   EIFA COUTURE — Reset Password Form
   ============================================
   Landing page for the link sent by ForgotPasswordForm. Supabase
   establishes a temporary recovery session when the user follows that
   link, which lets `updateUser({ password })` set a new password.
   Mirrors the LoginForm card styling.
   ============================================ */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';

export default function ResetPasswordForm() {
  const router = useRouter();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const { error: updateError } = await updatePassword(password);
    setIsSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccessMessage('Password updated. Redirecting to sign in…');
    setTimeout(() => router.push('/login'), 1500);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 sm:px-6">
      <div className="w-full max-w-md bg-white p-8 border border-beige shadow-sm">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl text-charcoal mb-3">Set New Password</h1>
          <p className="font-body text-sm text-charcoal/60">
            Choose a new password for your account.
          </p>
        </div>

        {error && (
          <p className="mb-4 font-body text-xs text-red-700 bg-red-50 border border-red-200 px-4 py-3">
            {error}
          </p>
        )}

        {successMessage && (
          <p className="mb-4 font-body text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-3">
            {successMessage}
          </p>
        )}

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="password"
              className="block font-body text-[10px] uppercase tracking-[0.15em] text-charcoal/60 mb-2"
            >
              New Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="At least 8 characters"
              className="w-full border border-beige bg-ivory px-4 py-3 font-body text-sm text-charcoal outline-none transition-colors focus:border-gold placeholder:text-charcoal/30"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block font-body text-[10px] uppercase tracking-[0.15em] text-charcoal/60 mb-2"
            >
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Re-enter your new password"
              className="w-full border border-beige bg-ivory px-4 py-3 font-body text-sm text-charcoal outline-none transition-colors focus:border-gold placeholder:text-charcoal/30"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-luxury btn-luxury-primary w-full mt-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}