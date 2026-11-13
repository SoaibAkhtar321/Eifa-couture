/* ============================================
   EIFA COUTURE — Shared motion presets
   ============================================
   ONE motion language for the whole storefront. Every section reuses
   these values (and Reveal / Stagger) instead of inventing its own.
   ============================================ */

/** Soft "expo out" easing: quick start, long gentle settle. */
export const EASE = [0.22, 1, 0.36, 1] as const;

export const DURATION = {
  fast: 0.4,
  base: 0.7,
  slow: 1.1,
} as const;

/** Distance (px) elements travel while fading up. */
export const REVEAL_DISTANCE = 28;

/** Play once, slightly before the element is fully in view. */
export const VIEWPORT = { once: true, margin: '-70px' } as const;

/** Delay between siblings in a staggered group (seconds). */
export const STAGGER = 0.08;
