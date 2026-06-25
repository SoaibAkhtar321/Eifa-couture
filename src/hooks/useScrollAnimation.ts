"use client";

import { useRef } from "react";
import { useInView, type UseInViewOptions } from "framer-motion";

interface UseScrollAnimationOptions {
  once?: boolean;
  margin?: UseInViewOptions["margin"];
  amount?: UseInViewOptions["amount"];
}

export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const { once = true, margin = "0px", amount = 0.1 } = options;

  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin, amount });

  return { ref, isInView };
}

export const scrollAnimationVariants = {
  fadeIn: {
    hidden: { opacity: 1 },
    visible: { opacity: 1 },
  },
  fadeInUp: {
    hidden: { opacity: 1, y: 0 },
    visible: { opacity: 1, y: 0 },
  },
  fadeInDown: {
    hidden: { opacity: 1, y: 0 },
    visible: { opacity: 1, y: 0 },
  },
  fadeInLeft: {
    hidden: { opacity: 1, x: 0 },
    visible: { opacity: 1, x: 0 },
  },
  fadeInRight: {
    hidden: { opacity: 1, x: 0 },
    visible: { opacity: 1, x: 0 },
  },
  scaleIn: {
    hidden: { opacity: 1, scale: 1 },
    visible: { opacity: 1, scale: 1 },
  },
  staggerChildren: {
    visible: {
      transition: { staggerChildren: 0.05 },
    },
  },
} as const;

export const luxuryTransition = {
  duration: 0.5,
  ease: "easeOut",
} as const;