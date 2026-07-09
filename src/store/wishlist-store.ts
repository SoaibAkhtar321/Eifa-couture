"use client";

/* ============================================
   EIFA COUTURE — Wishlist Store (Zustand)
   Guest wishlists persist to localStorage; signed-in wishlists
   persist to Supabase (`wishlist_items`), with localStorage kept
   only as an optimistic-UI cache so the wishlist page/badge never
   flashes empty on reload. Mirrors the cart-store pattern exactly.
   ============================================ */

import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  addServerWishlistItem,
  clearServerWishlist,
  fetchServerWishlist,
  mergeGuestWishlistIntoServer,
  removeServerWishlistItem,
} from "@/lib/wishlist";

const WISHLIST_STORAGE_KEY = "eifa-couture-wishlist";
const WISHLIST_STORAGE_VERSION = 2;

interface WishlistState {
  items: string[];
  /** Signed-in user id this store is currently synced to, or null for guests. */
  userId: string | null;
  /** True while a hydrate/merge round-trip to Supabase is in flight. */
  isSyncing: boolean;

  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  toggleItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  getItemCount: () => number;

  /**
   * Called by `WishlistSyncProvider` on sign-in: pushes whatever is
   * currently in the (guest) store to the server, merged with
   * whatever the user already had there, then replaces local state
   * with the server's resolved view. Idempotent — safe to call once
   * per sign-in transition.
   */
  mergeGuestWishlistToServer: (userId: string) => Promise<void>;
  /** Called on sign-out: drops local state back to an empty guest wishlist. */
  resetToGuest: () => void;
  /** Re-pulls the authoritative server wishlist (e.g. fresh load with an existing session). */
  hydrateFromServer: (userId: string) => Promise<void>;
}

function cleanWishlistItems(items: unknown): string[] {
  if (!Array.isArray(items)) return [];

  return Array.from(
    new Set(
      items.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0
      )
    )
  );
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      userId: null,
      isSyncing: false,

      addItem: (productId) => {
        if (!productId) return;

        set((state) => {
          if (state.items.includes(productId)) return state;

          return {
            items: [...state.items, productId],
          };
        });

        const { userId } = get();
        if (userId) {
          void addServerWishlistItem(userId, productId);
        }
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((id) => id !== productId),
        }));

        const { userId } = get();
        if (userId) {
          void removeServerWishlistItem(userId, productId);
        }
      },

      toggleItem: (productId) => {
        if (!productId) return;

        let wasAdded = false;

        set((state) => {
          const exists = state.items.includes(productId);
          wasAdded = !exists;

          return {
            items: exists
              ? state.items.filter((id) => id !== productId)
              : [...state.items, productId],
          };
        });

        const { userId } = get();
        if (userId) {
          void (wasAdded
            ? addServerWishlistItem(userId, productId)
            : removeServerWishlistItem(userId, productId));
        }
      },

      isInWishlist: (productId) => {
        return get().items.includes(productId);
      },

      clearWishlist: () => {
        set({ items: [] });

        const { userId } = get();
        if (userId) {
          void clearServerWishlist(userId);
        }
      },

      getItemCount: () => {
        return get().items.length;
      },

      mergeGuestWishlistToServer: async (userId: string) => {
        set({ isSyncing: true });

        const guestProductIds = get().items;

        await mergeGuestWishlistIntoServer(userId, guestProductIds);
        const serverItems = await fetchServerWishlist(userId);

        set({ items: serverItems, userId, isSyncing: false });
      },

      resetToGuest: () => {
        set({ items: [], userId: null, isSyncing: false });
      },

      hydrateFromServer: async (userId) => {
        set({ isSyncing: true });
        const serverItems = await fetchServerWishlist(userId);
        set({ items: serverItems, userId, isSyncing: false });
      },
    }),
    {
      name: WISHLIST_STORAGE_KEY,
      version: WISHLIST_STORAGE_VERSION,

      migrate: (persistedState) => {
        if (
          persistedState &&
          typeof persistedState === "object" &&
          "items" in persistedState
        ) {
          return {
            items: cleanWishlistItems(
              (persistedState as { items?: unknown }).items
            ),
          };
        }

        return {
          items: [],
        };
      },

      // `userId`/`isSyncing` are runtime sync state, not wishlist
      // content — never persist them, or a stale userId could
      // survive a sign-out and misattribute a later guest's writes.
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);