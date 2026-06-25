"use client";

/* ============================================
   EIFA COUTURE — UI Store (Zustand)
   Global UI state management
   ============================================ */

import { create } from "zustand";

interface UIState {
  isCartOpen: boolean;
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;

  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  openMobileMenu: () => void;
  closeMobileMenu: () => void;

  openSearch: () => void;
  closeSearch: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isCartOpen: false,
  isMobileMenuOpen: false,
  isSearchOpen: false,

  openCart: () =>
    set({ isCartOpen: true, isMobileMenuOpen: false, isSearchOpen: false }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () =>
    set((state) => ({
      isCartOpen: !state.isCartOpen,
      isMobileMenuOpen: false,
      isSearchOpen: false,
    })),

  openMobileMenu: () =>
    set({ isMobileMenuOpen: true, isCartOpen: false, isSearchOpen: false }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  openSearch: () =>
    set({ isSearchOpen: true, isCartOpen: false, isMobileMenuOpen: false }),
  closeSearch: () => set({ isSearchOpen: false }),
}));
