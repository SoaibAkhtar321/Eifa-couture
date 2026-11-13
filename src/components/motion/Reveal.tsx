'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

import { DURATION, EASE, REVEAL_DISTANCE, VIEWPORT } from './presets';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Seconds to wait before the animation starts. */
  delay?: number;
  /** Vertical travel in px (negative slides down into place). */
  y?: number;
}

/**
 * Fades and slides its content up the first time it scrolls into view.
 * Renders a plain <div> when the visitor prefers reduced motion.
 */
export default function Reveal({ children, className, delay = 0, y = REVEAL_DISTANCE }: RevealProps) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: DURATION.base, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}
