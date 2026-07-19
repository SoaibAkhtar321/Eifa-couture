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