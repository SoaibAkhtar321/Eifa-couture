'use client';

/* ============================================
   EIFA COUTURE — Forgot Password Form
   ============================================
   Mirrors the LoginForm card styling. Sends a password reset email
   via Supabase; the link in that email lands on /reset-password,
   which is the second half of this flow.
   ============================================ */

import { useState } from 'react';
import Link from 'next/link';

import { useAuth } from '@/hooks/useAuth';
import { isValidEmail } from '@/lib/utils';

export default function ForgotPasswordForm() {
  const { resetPasswordForEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    const { error: resetError } = await resetPasswordForEmail(email);
    setIsSubmitting(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSuccessMessage(
      'If an account exists for that email, a password reset link has been sent.'
    );
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 sm:px-6">
      <div className="w-full max-w-md bg-white p-8 border border-beige shadow-sm">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl text-charcoal mb-3">Reset Password</h1>
          <p className="font-body text-sm text-charcoal/60">
            Enter your email and we&apos;ll send you a link to reset your password.
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
              htmlFor="email"
              className="block font-body text-[10px] uppercase tracking-[0.15em] text-charcoal/60 mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              className="w-full border border-beige bg-ivory px-4 py-3 font-body text-sm text-charcoal outline-none transition-colors focus:border-gold placeholder:text-charcoal/30"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-luxury btn-luxury-primary w-full mt-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Sending Link…' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-beige pt-6">
          <Link
            href="/login"
            className="font-body text-xs uppercase tracking-wider text-charcoal/50 hover:text-maroon transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}