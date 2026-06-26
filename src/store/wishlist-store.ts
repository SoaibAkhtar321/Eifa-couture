"use client";

/* ============================================
   EIFA COUTURE — Wishlist Store (Zustand)
   Persistent wishlist with localStorage
   ============================================ */

import { create } from "zustand";
import { persist } from "zustand/middleware";

const WISHLIST_STORAGE_KEY = "eifa-couture-wishlist";
const WISHLIST_STORAGE_VERSION = 2;

interface WishlistState {
  items: string[];
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  toggleItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  getItemCount: () => number;
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

      addItem: (productId) => {
        if (!productId) return;

        set((state) => {
          if (state.items.includes(productId)) return state;

          return {
            items: [...state.items, productId],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((id) => id !== productId),
        }));
      },

      toggleItem: (productId) => {
        if (!productId) return;

        set((state) => {
          const exists = state.items.includes(productId);

          return {
            items: exists
              ? state.items.filter((id) => id !== productId)
              : [...state.items, productId],
          };
        });
      },

      isInWishlist: (productId) => {
        return get().items.includes(productId);
      },

      clearWishlist: () => {
        set({ items: [] });
      },

      getItemCount: () => {
        return get().items.length;
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

      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);