'use client';

/* ============================================
   EIFA COUTURE — Login Form
   ============================================
   Same markup/classes as the original static /login page — only
   difference is real state and Supabase calls wired in. Rendered by
   src/app/login/page.tsx.
   ============================================ */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';
import { isValidEmail } from '@/lib/utils';
import GoogleAuthButton from './GoogleAuthButton';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInWithPassword, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const redirectTo = searchParams.get('redirect') || '/account';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    const { error: signInError } = await signInWithPassword(email, password);
    setIsSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    const { error: oauthError } = await signInWithGoogle();

    if (oauthError) {
      setError(oauthError.message);
      setIsGoogleLoading(false);
    }
    // On success the browser is redirected to Google, so no further
    // local state update is needed here.
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 sm:px-6">
      <div className="w-full max-w-md bg-white p-8 border border-beige shadow-sm">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl text-charcoal mb-3">Welcome Back</h1>
          <p className="font-body text-sm text-charcoal/60">
            Sign in to access your wishlist and track orders.
          </p>
        </div>

        {/* ── Social Login ── */}
        <div className="mb-6">
          <GoogleAuthButton
            onClick={handleGoogleSignIn}
            isLoading={isGoogleLoading}
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

        {/* ── Email Credentials Form ── */}
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

          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="password"
                className="block font-body text-[10px] uppercase tracking-[0.15em] text-charcoal/60"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="font-body text-[9px] uppercase tracking-wider text-charcoal/40 hover:text-maroon transition-colors"
              >
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              className="w-full border border-beige bg-ivory px-4 py-3 font-body text-sm text-charcoal outline-none transition-colors focus:border-gold placeholder:text-charcoal/30"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-luxury btn-luxury-primary w-full mt-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Signing In…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-beige pt-6">
          <p className="font-body text-xs text-charcoal/50 mb-4">
            Don&apos;t have an account yet?
          </p>
          <Link href="/register" className="btn-luxury btn-luxury-secondary w-full">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}