'use client';

/* ============================================
   EIFA COUTURE — useAuth Hook
   ============================================
 
   ============================================ */

import { useMemo } from 'react';

import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
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

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async (redirectTo?: string) => {
    const params = redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : '';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback${params}` },
    });
    return { error };
  };

  return {
    user,
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