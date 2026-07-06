'use client';

/* ============================================
   EIFA COUTURE — Register Form
   ============================================
   Mirrors the exact card layout, spacing, and classes of LoginForm —
   no new visual language introduced. Rendered by
   src/app/register/page.tsx.
   ============================================ */

import { useState } from 'react';
import Link from 'next/link';

import { useAuth } from '@/hooks/useAuth';
import { isValidEmail } from '@/lib/utils';
import GoogleAuthButton from './GoogleAuthButton';

export default function RegisterForm() {
  const { signUp, signInWithGoogle } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const { error: signUpError } = await signUp(email, password);
    setIsSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setSuccessMessage(
      'Account created. Please check your email to confirm your address before signing in.'
    );
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    const { error: oauthError } = await signInWithGoogle();

    if (oauthError) {
      setError(oauthError.message);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 sm:px-6">
      <div className="w-full max-w-md bg-white p-8 border border-beige shadow-sm">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl text-charcoal mb-3">Create Account</h1>
          <p className="font-body text-sm text-charcoal/60">
            Join us to save your wishlist, track orders, and checkout faster.
          </p>
        </div>

        {/* ── Social Login ── */}
        <div className="mb-6">
          <GoogleAuthButton
            onClick={handleGoogleSignIn}
            isLoading={isGoogleLoading}
            label="Continue with Google"
          />
        </div>

        {/* ── Divider ── */}
        <div className="relative flex py-4 items-center mb-4">
          <div className="flex-grow border-t border-beige"></div>
          <span className="flex-shrink mx-4 font-body text-[10px] uppercase tracking-[0.2em] text-charcoal/35">
            Or Use Email
          </span>
          <div className="flex-grow border-t border-beige"></div>
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

        {/* ── Registration Form ── */}
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="fullName"
              className="block font-body text-[10px] uppercase tracking-[0.15em] text-charcoal/60 mb-2"
            >
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              placeholder="Enter your full name"
              className="w-full border border-beige bg-ivory px-4 py-3 font-body text-sm text-charcoal outline-none transition-colors focus:border-gold placeholder:text-charcoal/30"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

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

          <div>
            <label
              htmlFor="password"
              className="block font-body text-[10px] uppercase tracking-[0.15em] text-charcoal/60 mb-2"
            >
              Password
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
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Re-enter your password"
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
            {isSubmitting ? 'Creating Account…' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-beige pt-6">
          <p className="font-body text-xs text-charcoal/50 mb-4">
            Already have an account?
          </p>
          <Link href="/login" className="btn-luxury btn-luxury-secondary w-full">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}