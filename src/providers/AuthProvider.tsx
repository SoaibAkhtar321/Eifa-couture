'use client';

/* ============================================
   EIFA COUTURE — Auth Provider
   ============================================
   Mounts once at the root layout. Owns the single browser Supabase
   client instance for the session, fetches the initial auth state,
   and subscribes to `onAuthStateChange` to keep `auth-store` in sync
   for the lifetime of the app.

   Also resolves and syncs the user's `role` from `profiles` whenever
   the session changes — this is UI-only convenience state (see
   auth-store.ts comment). It does not gate rendering on `isLoading`;
   guest browsing must keep working immediately (see project
   requirements — guests can browse/search/cart without auth), so
   children always render and consumers read `isLoading` from
   `useAuth` only where they need to.
   ============================================ */

import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import type { UserRole } from '@/types/database';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [supabase] = useState(() => createClient());
  const setSession = useAuthStore((state) => state.setSession);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setRole = useAuthStore((state) => state.setRole);

  useEffect(() => {
    let cancelled = false;

    const syncRole = async (userId: string | undefined) => {
      if (!userId) {
        setRole(null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (cancelled) return;

      if (error || !data) {
        setRole(null);
        return;
      }

      setRole((data as { role: UserRole }).role);
    };

    setLoading(true);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setSession(session);
      void syncRole(session?.user?.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      void syncRole(session?.user?.id);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, setSession, setLoading, setRole]);

  return <>{children}</>;
}