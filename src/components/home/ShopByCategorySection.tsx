'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useScrollAnimation, luxuryTransition } from '@/hooks/useScrollAnimation';
import { MOCK_CATEGORIES } from '@/lib/mock-data';

// Local images for categories
const CATEGORY_IMAGES: Record<string, string> = {
  anarkalis: '/images/categories/anarkali.png',
  'womens-kurtas': '/images/categories/kurtas.png',
  'mens-kurtas': '/images/categories/men-kurtas.png',
  sarees: '/images/categories/sarees.png',
  dupattas: '/images/categories/dupattas.png',
  'palazzo-sets': '/images/categories/palazzo.png',
  'bridal-collection': '/images/categories/bridal.png',
  accessories: '/images/categories/dupattas.png',
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { ...luxuryTransition, duration: 0.6 },
  },
};

export default function ShopByCategorySection() {
  const { ref, isInView } = useScrollAnimation({ margin: '-50px' });
  // Take first 6 categories for the grid
  const categories = MOCK_CATEGORIES.filter((c) => c.isActive).slice(0, 6);

  return (
    <section className="section-padding bg-beige" aria-labelledby="categories-heading">
      <div className="luxury-container" ref={ref}>
        {/* ── Section Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={luxuryTransition}
          className="text-center mb-12 md:mb-20"
        >
          <span className="text-gold text-xs tracking-[0.3em] uppercase font-body block mb-4">
            Explore
          </span>
          <h2 id="categories-heading" className="font-heading text-3xl md:text-5xl lg:text-6xl text-charcoal">
            Shop by Category
          </h2>
          <div className="divider-gold w-24 mx-auto mt-6" />
        </motion.div>

        {/* ── Category Grid — Responsive ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6"
        >
          {categories.map((category) => (
            <motion.div key={category.id} variants={itemVariants}>
              <Link
                href={`/shop/${category.slug}`}
                className="group block relative overflow-hidden aspect-[3/4]"
              >
                {/* Background Image with Zoom */}
                <div className="absolute inset-0 img-zoom">
                  <img
                    src={CATEGORY_IMAGES[category.slug] || category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/20 to-transparent group-hover:from-maroon/60 group-hover:via-maroon/20 transition-all duration-500" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-3 md:p-6 lg:p-8">
                  <div className="transform transition-transform duration-500 group-hover:-translate-y-2">
                    <h3 className="font-heading text-base md:text-xl lg:text-2xl text-white leading-tight">
                      {category.name}
                    </h3>
                    <p className="font-body text-white/0 text-xs md:text-sm mt-1 md:mt-2 max-w-xs leading-relaxed group-hover:text-white/80 transition-all duration-500 hidden sm:block">
                      {category.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 md:mt-3 text-gold opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <span className="text-xs tracking-[0.2em] uppercase font-body">
                        Explore
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Gold accent line at top */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
