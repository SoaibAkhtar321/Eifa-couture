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
const MAX_ITEM_QUANTITY = 10;

interface CartState {
  items: CartItem[];
  addItem: (
    product: Product,
    size: string,
    color: string,
    quantity?: number
  ) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (
    productId: string,
    size: string,
    color: string,
    quantity: number
  ) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

function normalizeQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) return 1;

  return Math.min(Math.max(Math.floor(quantity), 1), MAX_ITEM_QUANTITY);
}

function getCartItemKey(productId: string, size: string, color: string) {
  return `${productId}-${size}-${color}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, size, color, quantity = 1) => {
        const safeQuantity = normalizeQuantity(quantity);

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
              quantity: Math.min(
                existingItem.quantity + safeQuantity,
                MAX_ITEM_QUANTITY
              ),
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

      updateQuantity: (productId, size, color, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, size, color);
          return;
        }

        const safeQuantity = normalizeQuantity(quantity);

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