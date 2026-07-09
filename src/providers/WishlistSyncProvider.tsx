'use client';

/* ============================================
   EIFA COUTURE — Wishlist Sync Provider
   ============================================
   Bridges `useAuth()` transitions into the Zustand wishlist store.
   Identical placement/transition logic to `CartSyncProvider` — see
   that file for the full rationale. Mounted alongside it in
   `layout.tsx`, both inside `AuthProvider`.
   ============================================ */

import { useEffect, useRef } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useWishlistStore } from '@/store/wishlist-store';

export default function WishlistSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const previousUserId = useRef<string | null | undefined>(undefined);

  const mergeGuestWishlistToServer = useWishlistStore(
    (state) => state.mergeGuestWishlistToServer
  );
  const hydrateFromServer = useWishlistStore((state) => state.hydrateFromServer);
  const resetToGuest = useWishlistStore((state) => state.resetToGuest);

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
      void mergeGuestWishlistToServer(currentUserId);
    } else if (prevUserId && !currentUserId) {
      // Signed in → signed out.
      resetToGuest();
    } else if (prevUserId && currentUserId && prevUserId !== currentUserId) {
      // Defensive: switched accounts without an intermediate sign-out.
      void hydrateFromServer(currentUserId);
    }

    previousUserId.current = currentUserId;
  }, [user, isLoading, mergeGuestWishlistToServer, hydrateFromServer, resetToGuest]);

  return <>{children}</>;
}
