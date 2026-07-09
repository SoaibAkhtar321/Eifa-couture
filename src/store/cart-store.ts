"use client";

/* ============================================
   EIFA COUTURE — Cart Store (Zustand)
   Guest carts persist to localStorage; signed-in carts persist to
   Supabase (`cart_items`), with localStorage kept only as an
   optimistic-UI cache so the drawer never flashes empty on reload.
   ============================================ */

import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  clearServerCart,
  fetchServerCart,
  mergeGuestCartIntoServer,
  removeServerCartItem,
  upsertServerCartItem,
  type GuestCartLine,
} from "@/lib/cart";
import { createClient } from "@/lib/supabase/client";
import type { CartItem, Product } from "@/types";

const CART_STORAGE_KEY = "eifa-couture-cart";
const CART_STORAGE_VERSION = 3;

// Hard outer ceiling regardless of stock — sanity limit, not a business
// target. Real availability (passed in as `availableStock`) is the
// binding constraint whenever it's lower than this.
const MAX_ITEM_QUANTITY = 10;

interface CartState {
  items: CartItem[];
  /** Signed-in user id this store is currently synced to, or null for guests. */
  userId: string | null;
  /** True while a hydrate/merge round-trip to Supabase is in flight. */
  isSyncing: boolean;

  /**
   * `availableStock` is the live stock count for this exact
   * size/color combination (i.e. `product.stock[`${size}-${color}`]`).
   * When provided, the resulting cart quantity is clamped to it —
   * added quantity can never exceed what's actually in stock, even
   * if the item is already partially in the cart. When omitted, only
   * the flat MAX_ITEM_QUANTITY ceiling applies (kept optional so
   * existing callers don't break, but every call site should pass it).
   */
  addItem: (
    product: Product,
    size: string,
    color: string,
    quantity?: number,
    availableStock?: number
  ) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (
    productId: string,
    size: string,
    color: string,
    quantity: number,
    availableStock?: number
  ) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;

  /**
   * Called by `CartSyncProvider` on sign-in: pushes whatever is
   * currently in the (guest) store to the server, merged with
   * whatever the user already had there, then replaces local state
   * with the server's resolved view. Idempotent — safe to call once
   * per sign-in transition.
   */
  mergeGuestCartToServer: (userId: string) => Promise<void>;
  /** Called on sign-out: drops local state back to an empty guest cart. */
  resetToGuest: () => void;
  /** Re-pulls the authoritative server cart (e.g. after external changes). */
  hydrateFromServer: (userId: string) => Promise<void>;
}

function clampQuantity(quantity: number, ceiling: number) {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(Math.max(Math.floor(quantity), 1), Math.max(ceiling, 0));
}

function getCartItemKey(productId: string, size: string, color: string) {
  return `${productId}-${size}-${color}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      userId: null,
      isSyncing: false,

      addItem: (product, size, color, quantity = 1, availableStock) => {
        // Real stock (when known) always wins over the flat ceiling.
        const ceiling =
          typeof availableStock === "number"
            ? Math.min(availableStock, MAX_ITEM_QUANTITY)
            : MAX_ITEM_QUANTITY;

        const safeQuantity = clampQuantity(quantity, ceiling);
        let resultingQuantity = safeQuantity;

        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) =>
              getCartItemKey(
                item.product.id,
                item.selectedSize,
                item.selectedColor
              ) === getCartItemKey(product.id, size, color)
          );

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            const existingItem = updatedItems[existingIndex];
            resultingQuantity = Math.min(
              existingItem.quantity + safeQuantity,
              ceiling
            );

            updatedItems[existingIndex] = {
              ...existingItem,
              product,
              quantity: resultingQuantity,
            };

            return { items: updatedItems };
          }

          return {
            items: [
              ...state.items,
              {
                product,
                selectedSize: size,
                selectedColor: color,
                quantity: safeQuantity,
              },
            ],
          };
        });

        const { userId } = get();
        if (userId) {
          void upsertServerCartItem(userId, product.id, size, color, resultingQuantity);
        }
      },

      removeItem: (productId, size, color) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              getCartItemKey(
                item.product.id,
                item.selectedSize,
                item.selectedColor
              ) !== getCartItemKey(productId, size, color)
          ),
        }));

        const { userId } = get();
        if (userId) {
          void removeServerCartItem(userId, productId, size, color);
        }
      },

      updateQuantity: (productId, size, color, quantity, availableStock) => {
        if (quantity <= 0) {
          get().removeItem(productId, size, color);
          return;
        }

        const ceiling =
          typeof availableStock === "number"
            ? Math.min(availableStock, MAX_ITEM_QUANTITY)
            : MAX_ITEM_QUANTITY;

        const safeQuantity = clampQuantity(quantity, ceiling);

        set((state) => ({
          items: state.items.map((item) =>
            getCartItemKey(
              item.product.id,
              item.selectedSize,
              item.selectedColor
            ) === getCartItemKey(productId, size, color)
              ? { ...item, quantity: safeQuantity }
              : item
          ),
        }));

        const { userId } = get();
        if (userId) {
          void upsertServerCartItem(userId, productId, size, color, safeQuantity);
        }
      },

      clearCart: () => {
        set({ items: [] });

        const { userId } = get();
        if (userId) {
          void clearServerCart(userId);
        }
      },

      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      mergeGuestCartToServer: async (userId: string) => {
        set({ isSyncing: true });

        const guestLines: GuestCartLine[] = get().items.map((item) => ({
          productId: item.product.id,
          size: item.selectedSize,
          color: item.selectedColor,
          quantity: item.quantity,
        }));

        await mergeGuestCartIntoServer(userId, guestLines);
        const serverItems = await fetchServerCart(
          createClient(),
          userId
        );

        set({ items: serverItems, userId, isSyncing: false });
      },

      resetToGuest: () => {
        set({ items: [], userId: null, isSyncing: false });
      },

      hydrateFromServer: async (userId) => {
        set({ isSyncing: true });
        const serverItems = await fetchServerCart(
          createClient(),
          userId
        );
        set({ items: serverItems, userId, isSyncing: false });
      },
    }),
    {
      name: CART_STORAGE_KEY,
      version: CART_STORAGE_VERSION,

      // Version 3 resets old persisted cart data once, same reasoning
      // as the v2 bump: avoid stale shapes surviving a schema change.
      migrate: () => {
        return { items: [], userId: null, isSyncing: false };
      },

      // `userId`/`isSyncing` are runtime sync state, not cart content —
      // never persist them, or a stale userId could survive a
      // sign-out and misattribute a later guest's cart writes.
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);