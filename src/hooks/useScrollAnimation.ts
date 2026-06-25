"use client";

/* ============================================
   EIFA COUTURE — Scroll Animation Hook
   Uses Framer Motion useInView for scroll-triggered animations
   ============================================ */

import { useRef } from "react";
import { useInView, type UseInViewOptions } from "framer-motion";

interface UseScrollAnimationOptions {
  /** Trigger only once (default: true) */
  once?: boolean;
  /** Viewport margin — triggers before element is fully visible (default: "-100px") */
  margin?: UseInViewOptions["margin"];
  /** Amount of the element that must be visible: "some" | "all" | number (default: "some") */
  amount?: UseInViewOptions["amount"];
}

/**
 * Custom hook for scroll-triggered animations using Framer Motion's useInView.
 *
 * @example
 * ```tsx
 * function FadeInSection() {
 *   const { ref, isInView } = useScrollAnimation();
 *   return (
 *     <motion.div
 *       ref={ref}
 *       initial={{ opacity: 0, y: 30 }}
 *       animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
 *       transition={{ duration: 0.6, ease: "easeOut" }}
 *     >
 *       Content fades in on scroll
 *     </motion.div>
 *   );
 * }
 * ```
 */
export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const { once = true, margin = "-100px", amount = "some" } = options;

  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin, amount });

  return { ref, isInView };
}

/**
 * Pre-defined animation variants for common scroll effects.
 */
export const scrollAnimationVariants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  fadeInUp: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  fadeInDown: {
    hidden: { opacity: 0, y: -40 },
    visible: { opacity: 1, y: 0 },
  },
  fadeInLeft: {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  fadeInRight: {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  },
  staggerChildren: {
    visible: {
      transition: { staggerChildren: 0.1 },
    },
  },
} as const;

/**
 * Default luxury-feel transition for scroll animations.
 */
export const luxuryTransition = {
  duration: 0.7,
  ease: [0.25, 0.46, 0.45, 0.94] as const,
};
