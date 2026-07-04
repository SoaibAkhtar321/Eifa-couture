'use client';

/* ============================================
   EIFA COUTURE — useAuth Hook
   ============================================
   Single entry point components should use to read auth state or
   perform auth actions. Keeps the Supabase client and the Zustand
   store as implementation details — UI code should never import
   `lib/supabase/*` or `store/auth-store` directly.

   This is architecture only for now: no login/register UI is wired
   up yet, so `signOut` is the only action exposed today. Future
   `signInWithPassword`, `signUp`, `resetPasswordForEmail`, etc. will
   be added here as those flows are built, keeping this file the one
   place components call into for auth.
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

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signOut,
  };
}
