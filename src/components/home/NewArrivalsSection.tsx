'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useScrollAnimation, luxuryTransition } from '@/hooks/useScrollAnimation';
import { getNewArrivals } from '@/lib/mock-data';
import { formatPrice } from '@/lib/utils';

export default function NewArrivalsSection() {
  const { ref, isInView } = useScrollAnimation({ margin: '-50px' });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const products = getNewArrivals();

  const productImages = [
    '/images/products/product-2.png',
    '/images/products/product-4.png',
    '/images/products/product-5.png',
    '/images/products/saree-pink.png',
    '/images/products/kurta-white.png',
    '/images/products/dupatta-cream.png',
  ];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="section-padding bg-cream" aria-labelledby="new-arrivals-heading">
      <div ref={ref}>
        {/* ── Section Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={luxuryTransition}
          className="luxury-container flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-px bg-gold" />
              <span className="text-gold text-xs tracking-[0.3em] uppercase font-body">
                Just Arrived
              </span>
            </div>
            <h2 id="new-arrivals-heading" className="font-heading text-3xl md:text-5xl text-charcoal">
              New Arrivals
            </h2>
            <p className="font-subheading text-lg text-charcoal/60 mt-3 italic max-w-md">
              Fresh silhouettes inspired by Mughal gardens and Lucknowi heritage
            </p>
          </div>

          {/* Scroll Controls - Hidden on mobile, shown on md+ */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => scroll('left')}
              className="hidden md:flex w-12 h-12 border border-charcoal/20 items-center justify-center hover:border-gold hover:text-gold transition-colors duration-300 flex-shrink-0"
              aria-label="Scroll left"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll('right')}
              className="hidden md:flex w-12 h-12 border border-charcoal/20 items-center justify-center hover:border-gold hover:text-gold transition-colors duration-300 flex-shrink-0"
              aria-label="Scroll right"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </motion.div>

        {/* ── Responsive Grid/Carousel ── */}
        <div
          ref={scrollContainerRef}
          className="hidden md:flex gap-6 overflow-x-auto scrollbar-hide px-6 md:px-12 lg:px-16 pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product, idx) => (
            <motion.article
              key={product.id}
              initial={{ opacity: 0, x: 40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ ...luxuryTransition, delay: idx * 0.1 }}
              className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[340px] lg:w-[380px] snap-start group"
            >
              <Link href={`/product/${product.slug}`} className="block h-full">
                {/* Image */}
                <div className="img-zoom relative aspect-[3/4] overflow-hidden bg-beige">
                  <img
                    src={productImages[idx % productImages.length]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* New Badge */}
                  <span className="absolute top-4 left-4 bg-gold text-white text-[10px] tracking-[0.2em] uppercase px-4 py-1.5 font-body font-medium z-10">
                    New
                  </span>

                  {/* Quick view on hover */}
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-charcoal/60 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                    <span className="text-white text-xs tracking-[0.15em] uppercase font-body">
                      Quick View →
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="mt-5">
                  <p className="text-[11px] text-gold/80 tracking-[0.2em] uppercase font-body mb-1.5">
                    {product.fabric}
                  </p>
                  <h3 className="font-heading text-base md:text-lg text-charcoal group-hover:text-maroon transition-colors duration-300 line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="font-subheading text-lg text-charcoal font-semibold">
                      {formatPrice(product.price)}
                    </span>
                    {product.compareAtPrice && (
                      <span className="font-body text-sm text-charcoal/40 line-through">
                        {formatPrice(product.compareAtPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>

        {/* ── Mobile Grid (2 columns) ── */}
        <motion.div
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="md:hidden grid grid-cols-2 gap-4 px-4"
        >
          {products.slice(0, 4).map((product, idx) => (
            <motion.article
              key={product.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: luxuryTransition },
              }}
              className="group"
            >
              <Link href={`/product/${product.slug}`} className="block">
                {/* Image */}
                <div className="img-zoom relative aspect-[3/4] overflow-hidden bg-beige mb-3">
                  <img
                    src={productImages[idx % productImages.length]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* New Badge */}
                  <span className="absolute top-2 left-2 bg-gold text-white text-[9px] tracking-[0.2em] uppercase px-2.5 py-1 font-body font-medium z-10">
                    New
                  </span>
                </div>

                {/* Product Info */}
                <div>
                  <p className="text-[10px] text-gold/80 tracking-[0.15em] uppercase font-body mb-1">
                    {product.fabric}
                  </p>
                  <h3 className="font-heading text-sm text-charcoal group-hover:text-maroon transition-colors duration-300 line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="font-subheading text-base text-charcoal font-semibold">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </motion.div>

        {/* View All link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center mt-12"
        >
          <Link href="/new-arrivals" className="link-luxury font-body text-sm tracking-[0.15em] uppercase">
            View All New Arrivals
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
