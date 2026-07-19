/* ============================================
   EIFA COUTURE — Auth Store (Zustand)
   ============================================
   Holds the *current* Supabase auth state (user, session, loading)
   plus the user's app role. This store is intentionally NOT persisted
   to localStorage — Supabase already persists the session via cookies
   (see lib/supabase/client.ts and lib/supabase/server.ts), and
   mirroring it into localStorage as well would create a second,
   potentially stale source of truth.

   `role` is NOT part of the Supabase session/user object — it lives
   in the `profiles` table. It's fetched and synced separately by
   `AuthProvider` after the session resolves. Treat this store's role
   as UI-only convenience (e.g. showing an "Admin" link); the actual
   security gate for `/admin/*` is the server-side check in
   `lib/admin/auth.ts`, which re-queries `profiles` on every request.

   This store is populated exclusively by `AuthProvider`, which
   subscribes to Supabase's `onAuthStateChange` and keeps it in sync.
   Components should read auth state via the `useAuth` hook rather
   than importing this store directly, so the Supabase client details
   stay out of UI code.
   ============================================ */

import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

import type { UserRole } from '@/types/database';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  /** True until the initial session check has resolved. */
  isLoading: boolean;

  setSession: (session: Session | null) => void;
  setRole: (role: UserRole | null) => void;
  setLoading: (isLoading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  session: null,
  role: null,
  isLoading: true,

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      isLoading: false,
      // Session gone (sign-out) → role is definitely stale, clear it
      // immediately rather than waiting on the async role fetch.
      ...(session === null ? { role: null } : {}),
    }),

  setRole: (role) => set({ role }),

  setLoading: (isLoading) => set({ isLoading }),

  reset: () =>
    set({
      user: null,
      session: null,
      role: null,
      isLoading: false,
    }),
}));