'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { useScrollAnimation, luxuryTransition } from '@/hooks/useScrollAnimation';

export default function WomensCollectionSection() {
  const { ref, isInView } = useScrollAnimation({ margin: '-100px' });
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ['5%', '-5%']);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-ivory"
      aria-labelledby="womens-heading"
    >
      <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px] lg:min-h-[800px]">
        {/* ── Image Side (Left) ── */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ ...luxuryTransition, duration: 1 }}
          className="relative overflow-hidden aspect-[3/4] lg:aspect-auto"
        >
          <motion.div className="absolute inset-0" style={{ y: imageY }}>
            <img
              src="/images/collections/women.png"
              alt="Women's Chikankari Collection"
              className="w-full h-[110%] object-cover"
              loading="lazy"
            />
          </motion.div>

          {/* Subtle overlay on image */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-ivory/10 lg:to-ivory/20" />

          {/* Gold corner accent */}
          <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-gold/40" />
        </motion.div>

        {/* ── Content Side (Right) ── */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ ...luxuryTransition, duration: 1, delay: 0.2 }}
          className="flex items-center px-8 py-16 md:px-12 lg:px-16 xl:px-24"
        >
          <div className="max-w-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-px bg-gold" />
              <span className="text-gold text-xs tracking-[0.3em] uppercase font-body">
                For Her
              </span>
            </div>

            <h2 id="womens-heading" className="font-heading text-4xl md:text-5xl lg:text-6xl text-charcoal leading-[1.1]">
              The Women&apos;s
              <br />
              <span className="text-gradient-gold">Collection</span>
            </h2>

            <div className="w-16 h-px bg-gold/40 my-8" />

            <p className="font-subheading text-lg md:text-xl text-charcoal/70 leading-relaxed italic">
              From ethereal kurtas to opulent bridal ensembles — every piece is a canvas of Lucknowi artistry. 
              Our women&apos;s collection celebrates femininity with delicate tepchi, bakhiya, and shadow work 
              that have adorned royalty for centuries.
            </p>

            <p className="font-body text-sm text-charcoal/50 mt-6 leading-relaxed">
              Each garment takes 15 to 45 days of meticulous hand-embroidery, 
              ensuring every stitch carries the soul of our master karigars.
            </p>

            <div className="mt-10">
              <Link href="/shop/womens-kurtas" className="btn-luxury btn-luxury-primary">
                Explore Women&apos;s Edit
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 mt-12 pt-8 border-t border-beige">
              <div>
                <span className="font-heading text-3xl text-gradient-gold">200+</span>
                <p className="font-body text-xs tracking-[0.1em] uppercase text-charcoal/50 mt-1">Designs</p>
              </div>
              <div className="w-px h-10 bg-beige" />
              <div>
                <span className="font-heading text-3xl text-gradient-gold">12</span>
                <p className="font-body text-xs tracking-[0.1em] uppercase text-charcoal/50 mt-1">Categories</p>
              </div>
              <div className="w-px h-10 bg-beige" />
              <div>
                <span className="font-heading text-3xl text-gradient-gold">50+</span>
                <p className="font-body text-xs tracking-[0.1em] uppercase text-charcoal/50 mt-1">Artisans</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
