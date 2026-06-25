'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useScrollAnimation, luxuryTransition } from '@/hooks/useScrollAnimation';
import { getBestSellers } from '@/lib/mock-data';
import { formatPrice, getDiscountPercentage } from '@/lib/utils';

export default function BestSellersSection() {
  const { ref, isInView } = useScrollAnimation({ margin: '-50px' });
  const products = getBestSellers().slice(0, 4);

  const productImages = [
    '/images/products/product-1.png',
    '/images/products/product-3.png',
    '/images/products/product-5.png',
    '/images/products/palazzo-green.png',
  ];

  return (
    <section className="section-padding bg-ivory" aria-labelledby="bestsellers-heading">
      <div className="luxury-container" ref={ref}>
        {/* ── Section Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={luxuryTransition}
          className="text-center mb-16 md:mb-24"
        >
          <span className="text-gold text-xs tracking-[0.3em] uppercase font-body block mb-4">
            Most Loved
          </span>
          <h2 id="bestsellers-heading" className="font-heading text-3xl md:text-5xl lg:text-6xl text-charcoal">
            Best Sellers
          </h2>
          <div className="divider-gold w-24 mx-auto mt-6" />
        </motion.div>

        {/* ── Responsive Layout ── */}
        <div className="space-y-8 md:space-y-0">
          {products.map((product, idx) => {
            const discount = product.compareAtPrice
              ? getDiscountPercentage(product.compareAtPrice, product.price)
              : 0;
            const isEven = idx % 2 === 0;

            return (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 60 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ ...luxuryTransition, delay: idx * 0.15 }}
                className="group"
              >
                <Link href={`/product/${product.slug}`} className="block">
                  <div
                    className={`grid grid-cols-1 md:grid-cols-2 gap-0 items-stretch border-t border-beige ${
                      idx === products.length - 1 ? 'border-b' : ''
                    }`}
                  >
                    {/* Image Side */}
                    <div className={`img-zoom relative aspect-[4/3] md:aspect-auto md:min-h-[400px] overflow-hidden bg-beige ${isEven ? 'md:order-1' : 'md:order-2'}`}>
                      <img
                        src={productImages[idx]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />

                      {/* Large number overlay - hidden on mobile, shown on md+ */}
                      <span className="absolute top-6 left-6 md:top-8 md:left-8 hidden md:block font-heading text-7xl md:text-9xl text-white/20 font-bold leading-none select-none">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Content Side */}
                    <div className={`flex flex-col justify-center p-6 md:p-12 lg:p-16 bg-white ${isEven ? 'md:order-2' : 'md:order-1'}`}>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <span className="text-gold text-[11px] tracking-[0.25em] uppercase font-body">
                            #{idx + 1} Best Seller
                          </span>
                          {discount > 0 && (
                            <>
                              <span className="text-charcoal/20 hidden sm:inline">·</span>
                              <span className="text-maroon text-[11px] tracking-[0.15em] uppercase font-body">
                                {discount}% Off
                              </span>
                            </>
                          )}
                        </div>

                        <h3 className="font-heading text-xl md:text-3xl lg:text-4xl text-charcoal group-hover:text-maroon transition-colors duration-300 leading-tight">
                          {product.name}
                        </h3>

                        <p className="font-body text-charcoal/60 text-sm md:text-base mt-3 md:mt-4 leading-relaxed max-w-md line-clamp-2 md:line-clamp-none">
                          {product.shortDescription}
                        </p>

                        <div className="flex items-center gap-3 mt-4 md:mt-6">
                          <span className="font-subheading text-xl md:text-3xl text-charcoal font-semibold">
                            {formatPrice(product.price)}
                          </span>
                          {product.compareAtPrice && (
                            <span className="font-body text-sm md:text-base text-charcoal/40 line-through">
                              {formatPrice(product.compareAtPrice)}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-charcoal/40 tracking-[0.15em] uppercase font-body mt-2">
                          {product.fabric}
                        </p>

                        <div className="mt-6 md:mt-8">
                          <span className="btn-luxury btn-luxury-primary text-xs">
                            Shop Now
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
