'use client';

/* ============================================
   EIFA COUTURE — useAuth Hook
   ============================================
   Single entry point components should use to read auth state or
   perform auth actions. Keeps the Supabase client and the Zustand
   store as implementation details — UI code should never import
   `lib/supabase/*` or `store/auth-store` directly.

   Login, register, forgot-password, and Google OAuth all call into
   this hook rather than touching Supabase directly — components stay
   ignorant of the client/session plumbing.
   ============================================ */

import { useMemo } from 'react';

import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Memoized per-hook-call rather than reused from AuthProvider's
  // instance — auth actions are stateless calls against the same
  // underlying session, so a lightweight local client is sufficient
  // here and avoids threading the provider's instance through context.
  const supabase = useMemo(() => createClient(), []);

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const resetPasswordForEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
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
    isLoading,
    isAuthenticated: !!user,
    signInWithPassword,
    signUp,
    signInWithGoogle,
    resetPasswordForEmail,
    updatePassword,
    signOut,
  };
}