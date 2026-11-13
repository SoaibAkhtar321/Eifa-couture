'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

import { DURATION, EASE, REVEAL_DISTANCE, STAGGER, VIEWPORT } from './presets';

const groupVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: REVEAL_DISTANCE },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE } },
};

/** Container: children animate in one after another when it scrolls into view. */
export function StaggerGroup({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={groupVariants}
      initial={reduced ? false : 'hidden'}
      whileInView="show"
      viewport={VIEWPORT}
    >
      {children}
    </motion.div>
  );
}

/** Child of StaggerGroup. Rendered as an <article> so product cards stay semantic. */
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.article className={className} variants={itemVariants}>
      {children}
    </motion.article>
  );
}
