"use client";

/* ============================================
   EIFA COUTURE — Media Query Hook
   Responsive breakpoint detection
   ============================================ */

import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for responsive design breakpoint detection.
 * Uses window.matchMedia for efficient media query matching.
 *
 * @param query — CSS media query string
 * @returns boolean indicating whether the query matches
 *
 * @example
 * ```tsx
 * function ResponsiveComponent() {
 *   const isMobile = useMediaQuery("(max-width: 767px)");
 *   const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
 *   const isDesktop = useMediaQuery("(min-width: 1024px)");
 *
 *   return <div>{isMobile ? "Mobile Layout" : "Desktop Layout"}</div>;
 * }
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const getMatches = useCallback((): boolean => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  }, [query]);

  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [query, getMatches]);

  return matches;
}

/* ── Pre-defined Breakpoint Hooks ── */

/** Matches screens ≤ 639px (mobile) */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 639px)");
}

/** Matches screens 640px–767px (small tablet) */
export function useIsSmallTablet(): boolean {
  return useMediaQuery("(min-width: 640px) and (max-width: 767px)");
}

/** Matches screens 768px–1023px (tablet) */
export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
}

/** Matches screens ≥ 1024px (desktop) */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

/** Matches screens ≥ 1280px (large desktop) */
export function useIsLargeDesktop(): boolean {
  return useMediaQuery("(min-width: 1280px)");
}

/** Matches user's prefers-reduced-motion setting */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
