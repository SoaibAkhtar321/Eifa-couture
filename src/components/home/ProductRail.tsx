import Link from 'next/link';
import type { ReactNode } from 'react';

import Reveal from '@/components/motion/Reveal';
import { StaggerGroup, StaggerItem } from '@/components/motion/Stagger';
import ProductImage from '@/components/ui/ProductImage';
import { formatPrice, getDiscountPercentage } from '@/lib/utils';
import type { Product } from '@/types';

type Badge = 'new' | 'bestseller' | 'discount';

interface ProductRailProps {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  products: Product[];
  viewAllHref: string;
  viewAllLabel: string;
  badge?: Badge;
  tone?: Tone;
  /** When set, the section still renders with this content if there are no products. */
  emptyState?: ReactNode;
}

type Tone = 'ivory' | 'cream' | 'parchment' | 'dark';

const TONES: Record<Tone, { section: string; eyebrow: string; title: string; subtitle: string; link: string }> = {
  ivory: {
    section: 'bg-ivory',
    eyebrow: 'text-gold-dark',
    title: 'text-charcoal',
    subtitle: 'text-ink-soft',
    link: 'border-charcoal/30 text-charcoal hover:border-maroon hover:text-maroon',
  },
  cream: {
    section: 'bg-cream',
    eyebrow: 'text-gold-dark',
    title: 'text-charcoal',
    subtitle: 'text-ink-soft',
    link: 'border-charcoal/30 text-charcoal hover:border-maroon hover:text-maroon',
  },
  parchment: {
    section: 'bg-parchment',
    eyebrow: 'text-gold-deep',
    title: 'text-ink',
    subtitle: 'text-ink-soft',
    link: 'border-charcoal/30 text-charcoal hover:border-maroon hover:text-maroon',
  },
  dark: {
    section: 'bg-espresso',
    eyebrow: 'text-gold-light',
    title: 'text-white',
    subtitle: 'text-white/85',
    link: 'border-white/40 text-white hover:border-gold-light hover:text-gold-light',
  },
};

function ProductCard({ product, badge }: { product: Product; badge: Badge }) {
  const discount = product.compareAtPrice
    ? getDiscountPercentage(product.compareAtPrice, product.minPrice)
    : 0;

  return (
    <StaggerItem className="group w-[46vw] shrink-0 snap-start sm:w-[calc((100%-2.5rem)/3)] lg:w-[calc((100%-4.5rem)/4)]">
      <Link href={`/product/${product.slug}`} className="flex h-full flex-col bg-white">
        <div className="relative aspect-[4/5] overflow-hidden bg-beige">
          <ProductImage
            src={product.images?.[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 46vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {badge === 'new' && (
            <span className="absolute left-2 top-2 bg-gold px-2 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-white md:text-[10px]">
              New
            </span>
          )}
          {badge === 'bestseller' && (
            <span className="absolute left-2 top-2 bg-maroon px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-white md:text-[10px]">
              Bestseller
            </span>
          )}
          {discount > 0 && (
            <span className="absolute right-2 top-2 bg-white/90 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-maroon md:text-[10px]">
              {discount}% Off
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between px-2.5 py-3 md:p-4">
          <div>
            {product.fabric && (
              <p className="mb-1 text-[9px] uppercase tracking-[0.16em] text-gold-dark md:text-[11px]">{product.fabric}</p>
            )}
            <h3 className="line-clamp-2 font-heading text-sm leading-snug text-charcoal transition-colors group-hover:text-maroon md:text-lg">
              {product.name}
            </h3>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-1.5 md:gap-3">
            <span className="font-subheading text-base font-semibold text-charcoal md:text-xl">
              {product.hasPriceRange ? `From ${formatPrice(product.minPrice)}` : formatPrice(product.minPrice)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.minPrice && (
              <span className="text-[11px] text-ink-muted line-through md:text-sm">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </StaggerItem>
  );
}

/**
 * Shared homepage product section. Horizontal swipe rail on phones
 * (like most Indian shopping apps), regular grid from `sm` up.
 */
export default function ProductRail({
  id,
  eyebrow,
  title,
  subtitle,
  products,
  viewAllHref,
  viewAllLabel,
  badge = 'discount',
  tone = 'ivory',
  emptyState,
}: ProductRailProps) {
  if (products.length === 0 && !emptyState) return null;

  const t = TONES[tone];

  return (
    <section className={`${t.section} py-10 md:py-16 lg:py-20`} aria-labelledby={id}>
      <div className="luxury-container">
        <Reveal className="mb-6 flex items-end justify-between gap-4 md:mb-10">
          <div>
            <span className={`mb-2 block text-[10px] uppercase tracking-[0.28em] md:text-xs ${t.eyebrow}`}>{eyebrow}</span>
            <h2 id={id} className={`font-heading text-2xl md:text-4xl lg:text-5xl ${t.title}`}>
              {title}
            </h2>
            {subtitle && (
              <p className={`mt-2 max-w-xl font-subheading text-base italic md:text-lg ${t.subtitle}`}>{subtitle}</p>
            )}
          </div>
          <Link
            href={viewAllHref}
            className={`shrink-0 border-b pb-0.5 text-[11px] uppercase tracking-[0.16em] transition-colors md:text-xs ${t.link}`}
          >
            {viewAllLabel}
          </Link>
        </Reveal>

        {products.length === 0 ? (
          emptyState
        ) : (
        <StaggerGroup className={`-mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:gap-5 sm:overflow-visible sm:px-0 lg:gap-6 [&::-webkit-scrollbar]:hidden ${
            // Few products: centre them instead of leaving a wide empty row
            products.length <= 2 ? 'justify-center' : products.length === 3 ? 'sm:justify-center' : ''
          }`}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} badge={badge} />
          ))}
        </StaggerGroup>
        )}
      </div>
    </section>
  );
}
