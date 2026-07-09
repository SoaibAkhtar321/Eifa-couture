'use client';

/* ============================================
   EIFA COUTURE — Cart Sync Provider
   ============================================
   Bridges `useAuth()` transitions into the Zustand cart store, same
   placement pattern as `AuthProvider` (root layout, renders no UI).

   - Guest → signed in: merge the local (guest) cart into the user's
     server cart, then replace local state with the server's
     resolved view (stock-clamped, deduped).
   - Signed in → signed out: drop local cart state back to an empty
     guest cart, so the next guest on this device never sees the
     previous user's items.
   - App loads with an existing session: hydrate straight from the
     server (skips the merge step — there's nothing local to merge on
     a fresh load, and a stale localStorage cart from a previous
     guest session should not silently re-attach to this account).

   Tracks the previous user id in a ref purely to detect *transitions*
   (null → id, id → null) rather than re-running on every render while
   already signed in.
   ============================================ */

import { useEffect, useRef } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/store/cart-store';

export default function CartSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const previousUserId = useRef<string | null | undefined>(undefined);

  const mergeGuestCartToServer = useCartStore((state) => state.mergeGuestCartToServer);
  const hydrateFromServer = useCartStore((state) => state.hydrateFromServer);
  const resetToGuest = useCartStore((state) => state.resetToGuest);

  useEffect(() => {
    if (isLoading) return;

    const currentUserId = user?.id ?? null;
    const prevUserId = previousUserId.current;

    // First resolved auth state after mount.
    if (prevUserId === undefined) {
      previousUserId.current = currentUserId;
      if (currentUserId) {
        void hydrateFromServer(currentUserId);
      }
      return;
    }

    if (!prevUserId && currentUserId) {
      // Guest → signed in.
      void mergeGuestCartToServer(currentUserId);
    } else if (prevUserId && !currentUserId) {
      // Signed in → signed out.
      resetToGuest();
    } else if (prevUserId && currentUserId && prevUserId !== currentUserId) {
      // Defensive: switched accounts without an intermediate sign-out.
      void hydrateFromServer(currentUserId);
    }

    previousUserId.current = currentUserId;
  }, [user, isLoading, mergeGuestCartToServer, hydrateFromServer, resetToGuest]);

  return <>{children}</>;
}
