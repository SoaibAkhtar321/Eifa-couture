'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useScrollAnimation, luxuryTransition } from '@/hooks/useScrollAnimation';

export default function HeritageSection() {
  const { ref, isInView } = useScrollAnimation({ margin: '-100px' });
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ['8%', '-8%']);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-maroon text-white section-padding"
      aria-labelledby="heritage-heading"
    >
      {/* Subtle texture overlay */}
      <div className="texture-grain absolute inset-0" />

      <div className="luxury-container relative z-10" ref={ref}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center">
          {/* ── Content Side ── */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ ...luxuryTransition, duration: 1 }}
          >
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="w-10 h-px bg-gold" />
              <span className="text-gold text-xs tracking-[0.3em] uppercase font-body">
                Our Legacy
              </span>
            </div>

            <h2 id="heritage-heading" className="font-heading text-3xl md:text-5xl lg:text-6xl text-white leading-[1.1]">
              A Heritage of
              <br />
              <span className="text-gold">Artistry</span>
            </h2>

            <div className="w-16 h-px bg-gold/40 my-6 md:my-8" />

            <p className="font-subheading text-base md:text-xl text-white/80 leading-relaxed italic">
              Since 1998, Eifa Couture has been at the heart of Lucknow&apos;s Chikankari tradition.
            </p>

            <p className="font-body text-xs md:text-sm text-white/60 mt-4 md:mt-6 leading-relaxed">
              Chikankari, an embroidery art from the Mughal era, is one of India&apos;s most refined textile traditions. At Eifa Couture, we honour this 400-year legacy.
            </p>

            <p className="font-body text-xs md:text-sm text-white/60 mt-3 leading-relaxed hidden md:block">
              Our atelier works with over 50 skilled karigars across Lucknow, each specializing in specific stitches.
            </p>

            {/* Heritage Stats — Mobile optimized */}
            <div className="grid grid-cols-3 gap-3 md:gap-6 mt-8 md:mt-10 pt-6 md:pt-8 border-t border-white/10">
              <div>
                <span className="font-heading text-2xl md:text-4xl text-gold">25+</span>
                <p className="font-body text-[9px] md:text-xs tracking-[0.1em] uppercase text-white/40 mt-1">
                  Years
                </p>
              </div>
              <div>
                <span className="font-heading text-2xl md:text-4xl text-gold">50+</span>
                <p className="font-body text-[9px] md:text-xs tracking-[0.1em] uppercase text-white/40 mt-1">
                  Artisans
                </p>
              </div>
              <div>
                <span className="font-heading text-2xl md:text-4xl text-gold">36</span>
                <p className="font-body text-[9px] md:text-xs tracking-[0.1em] uppercase text-white/40 mt-1">
                  Stitch Types
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── Image Side ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ ...luxuryTransition, duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="relative overflow-hidden aspect-[3/4] md:aspect-[4/5]">
              <motion.div className="absolute inset-0" style={{ y: imageY }}>
                <img
                  src="/images/about/heritage.png"
                  alt="Artisan handcrafting Chikankari embroidery"
                  className="w-full h-[120%] object-cover"
                  loading="lazy"
                />
              </motion.div>
            </div>

            {/* Decorative gold frame */}
            <div className="absolute -top-4 -right-4 w-full h-full border-2 border-gold/20 -z-10 hidden lg:block" />

            {/* Quote overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-maroon-dark/90 to-transparent p-4 md:p-8">
              <blockquote className="font-subheading text-xs md:text-lg text-white/80 italic leading-relaxed">
                &ldquo;Every thread we weave carries the whisper of a 400-year legacy.&rdquo;
              </blockquote>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
