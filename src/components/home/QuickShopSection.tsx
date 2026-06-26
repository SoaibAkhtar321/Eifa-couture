'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const quickShopItems = [
  {
    title: 'Women',
    subtitle: 'Kurtas, sarees, anarkalis',
    href: '/shop?category=womens-kurtas',
  },
  {
    title: 'Men',
    subtitle: 'Handcrafted kurtas for him',
    href: '/shop?category=mens-kurtas',
  },
  {
    title: 'Bridal',
    subtitle: 'Occasion-ready heirloom pieces',
    href: '/shop?category=bridal-collection',
  },
  {
    title: 'New Arrivals',
    subtitle: 'Freshly added edits',
    href: '/shop?collection=new-arrivals',
  },
  {
    title: 'Best Sellers',
    subtitle: 'Most loved pieces',
    href: '/shop?collection=best-sellers',
  },
  {
    title: 'Dupattas',
    subtitle: 'Light, elegant finishing layers',
    href: '/shop?category=dupattas',
  },
];

export default function QuickShopSection() {
  return (
    <section className="border-b border-beige bg-ivory">
      <div className="luxury-container py-10 sm:py-12 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="mb-7 flex items-end justify-between gap-4"
        >
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-gold">
              Shop The Edit
            </p>

            <h2 className="mt-2 font-heading text-3xl leading-tight text-charcoal sm:text-4xl lg:text-5xl">
              Find your piece
            </h2>
          </div>

          <Link
            href="/shop"
            className="hidden text-[11px] font-medium uppercase tracking-[0.24em] text-maroon transition-colors duration-300 hover:text-charcoal sm:block"
          >
            Shop All →
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {quickShopItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{
                duration: 0.45,
                delay: index * 0.04,
                ease: 'easeOut',
              }}
            >
              <Link
                href={item.href}
                className={`group flex min-h-[132px] flex-col justify-between border px-4 py-4 transition-all duration-300 ${
                  index === 0
                    ? 'border-maroon bg-maroon text-white'
                    : index === 1
                      ? 'border-gold bg-gold text-charcoal'
                      : 'border-beige bg-white text-charcoal hover:border-maroon'
                }`}
              >
                <span className="text-[11px] font-medium uppercase tracking-[0.24em] opacity-70">
                  0{index + 1}
                </span>

                <span>
                  <span className="block font-heading text-2xl leading-tight sm:text-3xl">
                    {item.title}
                  </span>

                  <span
                    className={`mt-2 block text-xs leading-5 ${
                      index === 0
                        ? 'text-white/70'
                        : 'text-charcoal/55 group-hover:text-charcoal/70'
                    }`}
                  >
                    {item.subtitle}
                  </span>
                </span>

                <span className="mt-4 text-sm transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        <Link
          href="/shop"
          className="mt-5 flex h-12 items-center justify-center border border-charcoal/15 bg-white text-[11px] font-medium uppercase tracking-[0.24em] text-charcoal transition-all duration-300 hover:border-maroon hover:bg-maroon hover:text-white sm:hidden"
        >
          Shop All Collection
        </Link>
      </div>
    </section>
  );
}