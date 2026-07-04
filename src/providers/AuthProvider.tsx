'use client';

/* ============================================
   EIFA COUTURE — Auth Provider
   ============================================
   Mounts once at the root layout. Owns the single browser Supabase
   client instance for the session, fetches the initial auth state,
   and subscribes to `onAuthStateChange` to keep `auth-store` in sync
   for the lifetime of the app.

   This component renders no UI of its own — it is purely a data-sync
   boundary, matching the project's existing pattern of keeping
   cross-cutting logic (see `useBodyScrollLock`) out of visual
   components. It does not gate rendering on `isLoading`; guest
   browsing must keep working immediately (see project requirements —
   guests can browse/search/cart without auth), so children always
   render and consumers read `isLoading` from `useAuth` only where
   they need to.
   ============================================ */

import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [supabase] = useState(() => createClient());
  const setSession = useAuthStore((state) => state.setSession);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    setLoading(true);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, setSession, setLoading]);

  return <>{children}</>;
}
