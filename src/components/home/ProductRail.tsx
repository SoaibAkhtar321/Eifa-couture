import type { ReactNode } from 'react';

import SectionHeader from '@/components/home/SectionHeader';
import ProductCard from '@/components/product/ProductCard';
import { StaggerGroup, StaggerItem } from '@/components/motion/Stagger';
import type { Product } from '@/types';

interface ProductRailProps {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  products: Product[];
  viewAllHref: string;
  viewAllLabel: string;
  tone?: Tone;
  /** When set, the section still renders with this content if there are no products. */
  emptyState?: ReactNode;
}

type Tone = 'ivory' | 'cream' | 'parchment' | 'dark';

const TONES: Record<Tone, { section: string; header: 'light' | 'dark' }> = {
  ivory: { section: 'bg-ivory', header: 'light' },
  cream: { section: 'bg-cream', header: 'light' },
  parchment: { section: 'bg-parchment', header: 'light' },
  dark: { section: 'bg-espresso', header: 'dark' },
};

export const RAIL_CARD_WIDTH = 'w-[46vw] shrink-0 snap-start sm:w-[calc((100%-2.5rem)/3)] lg:w-[calc((100%-4.5rem)/4)]';

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
  tone = 'ivory',
  emptyState,
}: ProductRailProps) {
  if (products.length === 0 && !emptyState) return null;

  const t = TONES[tone];

  return (
    <section className={`${t.section} py-14 md:py-20 lg:py-24`} aria-labelledby={id}>
      <div className="luxury-container">
        <SectionHeader
          id={id}
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          tone={t.header}
          viewAllHref={viewAllHref}
          viewAllLabel={viewAllLabel}
        />

        {products.length === 0 ? (
          emptyState
        ) : (
        <StaggerGroup className={`-mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:gap-5 sm:overflow-visible sm:px-0 lg:gap-6 [&::-webkit-scrollbar]:hidden ${
            // Few products: centre them instead of leaving a wide empty row
            products.length <= 2 ? 'justify-center' : products.length === 3 ? 'sm:justify-center' : ''
          }`}>
          {products.map((product, index) => (
            <StaggerItem key={product.id} className={`group ${RAIL_CARD_WIDTH}`}>
              <ProductCard product={product} priority={index < 2} />
            </StaggerItem>
          ))}
        </StaggerGroup>
        )}
      </div>
    </section>
  );
}
