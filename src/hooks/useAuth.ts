'use client';

/* ============================================
   EIFA COUTURE — useAuth Hook
   ============================================
 
   ============================================ */

import { useMemo } from 'react';

import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';

export function useAuth() {
  const sessionUser = useAuthStore((state) => state.user);
  // A guest-checkout (anonymous) session is a real Supabase session, but
  // the rest of the app must treat the shopper as signed out. `user` is
  // therefore null for guests; `sessionUser` is the raw session user and
  // is only used by checkout / order confirmation / order tracking.
  const isGuest = !!sessionUser?.is_anonymous;
  const user = isGuest ? null : sessionUser;
  const session = useAuthStore((state) => state.session);
  const role = useAuthStore((state) => state.role);
  const isLoading = useAuthStore((state) => state.isLoading);

  const supabase = useMemo(() => createClient(), []);

  // Login, signup, and password-reset requests are proxied through
  // our own rate-limited Route Handlers (src/app/api/auth/*) instead
  // of calling supabase.auth.* directly from the browser — Supabase
  // Auth itself isn't behind anything we can rate-limit, so brute
  // force / abuse protection has to happen on our server first. On
  // success, the tokens returned are handed to `supabase.auth.setSession`
  // so the browser client and auth store hydrate exactly as before.
  const signInWithPassword = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json().catch(() => ({ error: { message: 'Something went wrong. Please try again.' } }));

    if (json.error) {
      return { error: json.error };
    }

    if (json.session) {
      await supabase.auth.setSession({
        access_token: json.session.access_token,
        refresh_token: json.session.refresh_token,
      });
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json().catch(() => ({ error: { message: 'Something went wrong. Please try again.' } }));

    if (json.error) {
      return { error: json.error };
    }

    if (json.session) {
      await supabase.auth.setSession({
        access_token: json.session.access_token,
        refresh_token: json.session.refresh_token,
      });
    }

    return { error: null };
  };

  const resetPasswordForEmail = async (email: string) => {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const json = await res.json().catch(() => ({ error: { message: 'Something went wrong. Please try again.' } }));

    return { error: json.error ?? null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  const updateProfile = async (data: {
    full_name?: string;
    phone?: string;
    gender?: string;
    date_of_birth?: string;
  }) => {
    const { error } = await supabase.auth.updateUser({ data });
    return { error };
  };

  /** Makes sure a Supabase session exists (creating an anonymous guest
   *  session if needed) so a not-signed-in shopper can place an order. */
  const ensureGuestSession = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) return { error: null };

    const res = await fetch('/api/auth/guest', { method: 'POST' });
    const json = await res
      .json()
      .catch(() => ({ error: { message: 'Something went wrong. Please try again.' } }));

    if (json.error) return { error: json.error as { message: string } };

    if (json.session) {
      const { error } = await supabase.auth.setSession({
        access_token: json.session.access_token,
        refresh_token: json.session.refresh_token,
      });
      if (error) return { error: { message: error.message } };
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async (redirectTo?: string) => {
    // Remember where to return in a short-lived cookie instead of a query
    // string on `redirectTo`: Supabase only honours redirect URLs that match
    // its allow-list exactly, and otherwise falls back to the Site URL (the
    // home page). The callback route reads this cookie after sign-in.
    if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
      document.cookie = `eifa_auth_next=${encodeURIComponent(redirectTo)}; path=/; max-age=600; SameSite=Lax`;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    return { error };
  };

  return {
    user,
    sessionUser,
    isGuest,
    ensureGuestSession,
    session,
    role,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: role === 'admin' || role === 'superadmin',
    signInWithPassword,
    signUp,
    signInWithGoogle,
    resetPasswordForEmail,
    updatePassword,
    updateProfile,
    signOut,
  };
}