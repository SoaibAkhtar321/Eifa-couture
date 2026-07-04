/* ============================================
   EIFA COUTURE — Auth Store (Zustand)
   ============================================
   Holds the *current* Supabase auth state (user, session, loading).
   This store is intentionally NOT persisted to localStorage — Supabase
   already persists the session via cookies (see lib/supabase/client.ts
   and lib/supabase/server.ts), and mirroring it into localStorage as
   well would create a second, potentially stale source of truth.

   This store is populated exclusively by `AuthProvider`, which
   subscribes to Supabase's `onAuthStateChange` and keeps it in sync.
   Components should read auth state via the `useAuth` hook rather
   than importing this store directly, so the Supabase client details
   stay out of UI code.
   ============================================ */

import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  /** True until the initial session check has resolved. */
  isLoading: boolean;

  setSession: (session: Session | null) => void;
  setLoading: (isLoading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  session: null,
  isLoading: true,

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      isLoading: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  reset: () =>
    set({
      user: null,
      session: null,
      isLoading: false,
    }),
}));
