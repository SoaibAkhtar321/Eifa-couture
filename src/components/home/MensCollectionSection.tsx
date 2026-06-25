'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { useScrollAnimation, luxuryTransition } from '@/hooks/useScrollAnimation';

export default function MensCollectionSection() {
  const { ref, isInView } = useScrollAnimation({ margin: '-100px' });
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1, 1.05]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-charcoal text-white"
      aria-labelledby="mens-heading"
    >
      <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px] lg:min-h-[800px]">
        {/* ── Content Side (Left) — reversed from Women's ── */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ ...luxuryTransition, duration: 1 }}
          className="flex items-center px-8 py-16 md:px-12 lg:px-16 xl:px-24 order-2 lg:order-1"
        >
          <div className="max-w-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-px bg-gold" />
              <span className="text-gold text-xs tracking-[0.3em] uppercase font-body">
                For Him
              </span>
            </div>

            <h2 id="mens-heading" className="font-heading text-4xl md:text-5xl lg:text-6xl text-white leading-[1.1]">
              The Men&apos;s
              <br />
              <span className="text-gradient-gold">Edit</span>
            </h2>

            <div className="w-16 h-px bg-gold/40 my-8" />

            <p className="font-subheading text-lg md:text-xl text-white/70 leading-relaxed italic">
              Refined silhouettes for the modern gentleman. Our men&apos;s collection features 
              distinguished kurtas in premium cotton lawn, silk, and linen — each adorned with 
              subtle Chikankari that speaks of understated luxury.
            </p>

            <p className="font-body text-sm text-white/40 mt-6 leading-relaxed">
              From crisp whites for summer to regal silks for celebrations — 
              every piece is crafted to command quiet admiration.
            </p>

            <div className="mt-10 flex items-center gap-6">
              <Link href="/shop/mens-kurtas" className="btn-luxury bg-gold border-gold text-white hover:bg-gold-dark hover:border-gold-dark text-sm">
                Shop Men&apos;s Collection
              </Link>
            </div>

            {/* Fabric types */}
            <div className="flex flex-wrap gap-4 mt-12 pt-8 border-t border-white/10">
              {['Cotton Lawn', 'Pure Silk', 'Chanderi', 'Linen Blend'].map((fabric) => (
                <span
                  key={fabric}
                  className="text-[11px] tracking-[0.15em] uppercase font-body text-white/50 border border-white/15 px-4 py-2"
                >
                  {fabric}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Image Side (Right) ── */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ ...luxuryTransition, duration: 1, delay: 0.2 }}
          className="relative overflow-hidden aspect-[3/4] lg:aspect-auto order-1 lg:order-2"
        >
          <motion.div className="absolute inset-0" style={{ scale: imageScale }}>
            <img
              src="/images/collections/men.png"
              alt="Men's Chikankari Collection"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </motion.div>

          {/* Subtle overlay */}
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-charcoal/20 lg:to-charcoal/30" />

          {/* Gold corner accent — bottom right for visual variety */}
          <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-gold/40" />
        </motion.div>
      </div>
    </section>
  );
}
