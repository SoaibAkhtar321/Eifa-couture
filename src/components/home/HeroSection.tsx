'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, type Variants } from 'framer-motion';

const heroVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.5,
    },
  },
};

const childVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
    },
  },
};

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5], [0.55, 0.8]);

  return (
    <section
      ref={containerRef}
      className="relative h-screen min-h-[700px] w-full overflow-hidden"
      aria-label="Hero banner"
    >
      <motion.div
        className="absolute inset-0 h-[125%] w-full"
        style={{ y: backgroundY }}
      >
        <img
          src="/images/hero/hero-1.png"
          alt="Luxury Chikankari fashion from Eifa Couture"
          className="h-full w-full object-cover object-center"
          loading="eager"
        />
      </motion.div>

      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(43,43,43,0.3) 0%, rgba(90,11,34,0.45) 50%, rgba(43,43,43,0.75) 100%)',
          opacity: overlayOpacity,
        }}
      />

      <div className="absolute left-0 right-0 top-0 z-10 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.div
          variants={heroVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl"
        >
          <motion.div
            variants={childVariants}
            className="mb-8 flex items-center justify-center gap-4"
          >
            <span className="block h-px w-12 bg-gold/70 md:w-20" />
            <span className="font-body text-xs uppercase tracking-[0.35em] text-gold">
              Est. 1998
            </span>
            <span className="block h-px w-12 bg-gold/70 md:w-20" />
          </motion.div>

          <motion.h1
            variants={childVariants}
            className="font-heading text-5xl font-semibold leading-[0.95] tracking-wide text-white md:text-7xl lg:text-8xl xl:text-9xl"
          >
            <span className="block">EIFA</span>
            <span className="mt-1 block md:mt-2">COUTURE</span>
          </motion.h1>

          <motion.div
            variants={childVariants}
            className="my-6 flex items-center justify-center gap-3 md:my-8"
          >
            <span className="block h-px w-16 bg-gold/50 md:w-24" />
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              className="shrink-0 text-gold"
              aria-hidden="true"
            >
              <path
                d="M8 0L9.79 6.21L16 8L9.79 9.79L8 16L6.21 9.79L0 8L6.21 6.21L8 0Z"
                fill="currentColor"
                opacity="0.7"
              />
            </svg>
            <span className="block h-px w-16 bg-gold/50 md:w-24" />
          </motion.div>

          <motion.p
            variants={childVariants}
            className="mx-auto max-w-2xl font-subheading text-xl italic leading-relaxed tracking-wide text-white/90 md:text-2xl lg:text-3xl"
          >
            Luxury Handcrafted Chikankari Since 1998
          </motion.p>

          <motion.div variants={childVariants} className="mt-10 md:mt-14">
            <Link
              href="/shop"
              className="inline-flex items-center gap-3 border border-white/60 bg-transparent px-10 py-4 text-sm uppercase tracking-[0.2em] text-white transition-all duration-500 hover:bg-white hover:text-charcoal"
            >
              Explore Collection
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.8 }}
      >
        <span className="font-body text-[10px] uppercase tracking-[0.3em] text-white/50">
          Scroll
        </span>

        <motion.div
          className="h-8 w-px bg-gradient-to-b from-gold/60 to-transparent"
          animate={{ scaleY: [1, 0.5, 1] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 z-10 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
    </section>
  );
}