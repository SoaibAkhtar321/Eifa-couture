'use client';

import { motion } from 'framer-motion';
import { useScrollAnimation, luxuryTransition } from '@/hooks/useScrollAnimation';

const USP_DATA = [
  {
    title: 'Handcrafted Artistry',
    description: 'Every stitch is handcrafted by master karigars of Lucknow, preserving centuries-old techniques.',
    icon: (
      <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 4C13 4 4 13 4 24s9 20 20 20 20-9 20-20S35 4 24 4z" />
        <path d="M24 14c-3 0-6 2-6 5 0 4 6 4 6 8 0 2-2 3-4 3" />
        <circle cx="24" cy="34" r="1" fill="currentColor" />
        <path d="M16 20s-2-3 0-6M32 20s2-3 0-6" />
        <path d="M18 16c2-3 5-5 6-5s4 2 6 5" />
      </svg>
    ),
  },
  {
    title: 'Premium Fabrics',
    description: 'Only the finest Chanderi silk, muslin cotton, georgette, and organza make it to our looms.',
    icon: (
      <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 8h32v32H8z" />
        <path d="M8 8l16 16M24 24l16-16M8 40l16-16M24 24l16 16" />
        <path d="M8 24h32M24 8v32" />
      </svg>
    ),
  },
  {
    title: 'Heritage Since 1998',
    description: 'Over 25 years of preserving and promoting the art of Lucknowi Chikankari worldwide.',
    icon: (
      <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 4v4M24 40v4M4 24h4M40 24h4" />
        <circle cx="24" cy="24" r="16" />
        <circle cx="24" cy="24" r="8" />
        <path d="M24 16v8l6 4" />
      </svg>
    ),
  },
  {
    title: 'Free Shipping',
    description: 'Complimentary shipping on all orders above ₹2,999. Hand-packed with love and care.',
    icon: (
      <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 8h28v24H4z" />
        <path d="M32 16h8l4 8v8h-12" />
        <circle cx="14" cy="36" r="4" />
        <circle cx="38" cy="36" r="4" />
        <path d="M18 32H4" />
        <path d="M34 32h-2" />
      </svg>
    ),
  },
  {
    title: 'Easy Returns',
    description: '7-day hassle-free returns and 15-day exchanges. Your satisfaction is our promise.',
    icon: (
      <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20l8-8 8 8" />
        <path d="M12 12v16c0 6 4 10 12 10s12-4 12-10V12" />
        <path d="M44 28l-8 8-8-8" />
      </svg>
    ),
  },
  {
    title: 'Secure Payments',
    description: 'Shop with confidence — 100% secure transactions with multiple payment options.',
    icon: (
      <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="16" width="40" height="24" rx="4" />
        <path d="M24 28v4M20 28v4M28 28v4" />
        <path d="M16 16V12a8 8 0 0116 0v4" />
      </svg>
    ),
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...luxuryTransition },
  },
};

export default function WhyChooseUsSection() {
  const { ref, isInView } = useScrollAnimation({ margin: '-50px' });

  return (
    <section className="section-padding bg-cream" aria-labelledby="why-choose-heading">
      <div className="luxury-container" ref={ref}>
        {/* ── Section Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={luxuryTransition}
          className="text-center mb-16 md:mb-20"
        >
          <span className="text-gold text-xs tracking-[0.3em] uppercase font-body block mb-4">
            The Eifa Promise
          </span>
          <h2 id="why-choose-heading" className="font-heading text-3xl md:text-5xl text-charcoal">
            Why Choose Us
          </h2>
          <div className="divider-gold w-24 mx-auto mt-6" />
        </motion.div>

        {/* ── USP Cards Grid ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {USP_DATA.map((usp, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="group bg-white border border-beige p-8 md:p-10 text-center hover:border-gold/40 hover:shadow-lg transition-all duration-500 relative overflow-hidden"
            >
              {/* Background accent on hover */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 text-gold mb-6 mx-auto group-hover:scale-110 transition-transform duration-500">
                {usp.icon}
              </div>

              <h3 className="font-heading text-lg md:text-xl text-charcoal mb-3">
                {usp.title}
              </h3>

              <p className="font-body text-sm text-charcoal/60 leading-relaxed">
                {usp.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
