"use client";

/* ============================================
   EIFA COUTURE — Cart Store (Zustand)
   Persistent shopping cart with localStorage
   ============================================ */

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { CartItem, Product } from "@/types";

const CART_STORAGE_KEY = "eifa-couture-cart";
const CART_STORAGE_VERSION = 2;

// Hard outer ceiling regardless of stock — sanity limit, not a business
// target. Real availability (passed in as `availableStock`) is the
// binding constraint whenever it's lower than this.
const MAX_ITEM_QUANTITY = 10;

interface CartState {
  items: CartItem[];
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

      addItem: (product, size, color, quantity = 1, availableStock) => {
        // Real stock (when known) always wins over the flat ceiling.
        const ceiling =
          typeof availableStock === "number"
            ? Math.min(availableStock, MAX_ITEM_QUANTITY)
            : MAX_ITEM_QUANTITY;

        const safeQuantity = clampQuantity(quantity, ceiling);

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

            updatedItems[existingIndex] = {
              ...existingItem,
              product,
              // Combined quantity is clamped against the same ceiling —
              // adding more of an item already in the cart still can't
              // exceed real stock for that variant.
              quantity: Math.min(existingItem.quantity + safeQuantity, ceiling),
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
      },

      clearCart: () => {
        set({ items: [] });
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
    }),
    {
      name: CART_STORAGE_KEY,
      version: CART_STORAGE_VERSION,

      /*
        Version 2 resets old persisted cart data once.
        This removes old picsum/mountain images already saved in localStorage.
      */
      migrate: () => {
        return { items: [] };
      },

      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);