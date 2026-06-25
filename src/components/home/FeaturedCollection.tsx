'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useScrollAnimation, luxuryTransition } from '@/hooks/useScrollAnimation';
import { getFeaturedProducts } from '@/lib/mock-data';
import { formatPrice, getDiscountPercentage } from '@/lib/utils';

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...luxuryTransition, duration: 0.8 },
  },
};

export default function FeaturedCollection() {
  const { ref, isInView } = useScrollAnimation({ margin: '-50px' });
  const products = getFeaturedProducts().slice(0, 4);

  // Map product indices to local images
  const productImages = [
    '/images/products/product-1.png',
    '/images/products/product-2.png',
    '/images/products/product-3.png',
    '/images/products/product-4.png',
  ];

  return (
    <section className="section-padding bg-ivory" aria-labelledby="featured-heading">
      <div className="luxury-container">
        {/* ── Section Header ── */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={luxuryTransition}
          className="text-center mb-16 md:mb-24"
        >
          <span className="text-gold text-xs tracking-[0.3em] uppercase font-body block mb-4">
            Curated for You
          </span>
          <h2 id="featured-heading" className="font-heading text-3xl md:text-5xl lg:text-6xl text-charcoal">
            Featured Collection
          </h2>
          <div className="divider-gold w-24 mx-auto mt-6" />
          <p className="font-subheading text-lg md:text-xl text-charcoal/60 mt-6 max-w-xl mx-auto italic">
            Handpicked masterpieces that define the art of Lucknowi Chikankari
          </p>
        </motion.div>

        {/* ── Responsive Grid Layout ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8"
        >
          {products.map((product, idx) => {
            const discount = product.compareAtPrice
              ? getDiscountPercentage(product.compareAtPrice, product.price)
              : 0;

            // Image aspect ratios
            const imageAspects = [
              'aspect-[3/4]',
              'aspect-[3/4]',
              'aspect-[3/4]',
              'aspect-[3/4]',
            ];

            return (
              <motion.article
                key={product.id}
                variants={itemVariants}
                className="group"
              >
                <Link href={`/product/${product.slug}`} className="block h-full">
                  <div className="card-luxury overflow-hidden h-full flex flex-col">
                    {/* Image */}
                    <div className={`img-zoom relative ${imageAspects[idx]} overflow-hidden bg-beige flex-shrink-0`}>
                      <img
                        src={productImages[idx]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />

                      {/* Discount badge */}
                      {discount > 0 && (
                        <span className="absolute top-4 left-4 bg-maroon text-white text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 font-body z-10">
                          {discount}% Off
                        </span>
                      )}

                      {/* Hover overlay with Add to Cart */}
                      <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/30 transition-all duration-500 flex items-end justify-center pb-8 opacity-0 group-hover:opacity-100">
                        <button
                          className="btn-luxury bg-white text-charcoal border-white hover:bg-gold hover:border-gold hover:text-white text-xs px-8 py-3 translate-y-4 group-hover:translate-y-0 transition-all duration-500"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-5 md:p-6 flex-grow flex flex-col justify-between">
                      <div>
                        <p className="text-[11px] text-gold tracking-[0.2em] uppercase font-body mb-2">
                          {product.fabric}
                        </p>
                        <h3 className="font-heading text-lg md:text-xl text-charcoal group-hover:text-maroon transition-colors duration-300 leading-snug">
                          {product.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 mt-4">
                        <span className="font-subheading text-xl md:text-2xl text-charcoal font-semibold">
                          {formatPrice(product.price)}
                        </span>
                        {product.compareAtPrice && (
                          <span className="font-body text-sm text-charcoal/40 line-through">
                            {formatPrice(product.compareAtPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.article>
            );
          })}
        </motion.div>

        {/* ── View All CTA ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center mt-16"
        >
          <Link href="/shop" className="btn-luxury btn-luxury-secondary">
            View All Collection
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
