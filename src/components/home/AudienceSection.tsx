import ComingSoonPanel from '@/components/home/ComingSoonPanel';
import Image from 'next/image';
import Link from 'next/link';

import ProductCard from '@/components/product/ProductCard';
import Reveal from '@/components/motion/Reveal';
import { StaggerGroup, StaggerItem } from '@/components/motion/Stagger';
import { createClient } from '@/lib/supabase/server';
import { fetchProductsByAudience } from '@/lib/data/products';
import type { Audience } from '@/lib/catalog';

type Tone = 'ivory' | 'cream' | 'parchment' | 'dark';

// Per-audience look. Women: warm ivory + maroon, image left.
// Men: deep espresso + gold, image right. Accessories: parchment, image left.
const LOOK: Record<Audience, { section: string; dark: boolean; imageRight: boolean; chips: string[]; cta: string }> = {
  women: { section: 'bg-ivory', dark: false, imageRight: false, chips: ['Sarees', 'Kurta Sets', 'Anarkalis', 'Bridal'], cta: "Explore Women's Edit" },
  men: { section: 'bg-espresso', dark: true, imageRight: true, chips: ['Kurtas', 'Kurta Sets', 'Festive', 'Everyday'], cta: "Explore Men's Edit" },
  accessories: { section: 'bg-parchment', dark: false, imageRight: false, chips: ['Silk Bags', 'Potlis', 'Dupattas', 'Stoles'], cta: 'Explore Accessories' },
};

const COPY: Record<
  Audience,
  {
    eyebrow: string;
    title: string;
    tagline: string;
    tone: Tone;
    image: string;
    imageAlt: string;
    emptyTitle: string;
    emptyText: string;
  }
> = {
  women: {
    eyebrow: 'For Her',
    title: "Women's Collection",
    tagline: 'A canvas of Lucknowi artistry',
    tone: 'ivory',
    image: '/images/collections/women.png',
    imageAlt: 'Model in a maroon hand-embroidered Chikankari anarkali',
    emptyTitle: "New women's styles are on their way",
    emptyText: 'Sarees, kurta sets and suits hand-embroidered by our karigars. Fresh pieces land here soon.',
  },
  men: {
    eyebrow: 'For Him',
    title: "Men's Collection",
    tagline: 'Understated, timeless, refined',
    tone: 'dark',
    image: '/images/collections/men.png',
    imageAlt: 'Model in an ivory Chikankari kurta',
    emptyTitle: "New men's kurtas are on their way",
    emptyText: 'Chikankari kurtas in cotton, silk and linen for festive days and every day. Fresh pieces land here soon.',
  },
  accessories: {
    eyebrow: 'The Finishing Touch',
    title: 'Bags & Accessories',
    tagline: 'Silk potlis, clutches and dupattas',
    tone: 'parchment',
    image: '/images/categories/dupattas.png',
    imageAlt: 'Hand-embroidered silk dupattas and accessories',
    emptyTitle: 'New accessories are on their way',
    emptyText: 'Silk bags, potlis, clutches and dupattas to complete every look. Fresh pieces land here soon.',
  },
};

interface Props {
  audience: Audience;
  limit?: number;
}

/**
 * One editorial homepage block per audience: a large lead image panel
 * beside the product grid. Always renders: with products it shows them,
 * without it shows an "Arriving soon" panel, so Women, Men and
 * Accessories never disappear. Products are filtered strictly on
 * `products.audience`, server-side.
 */
export default async function AudienceSection({ audience, limit = 6 }: Props) {
  const supabase = await createClient();
  const products = await fetchProductsByAudience(supabase, audience, limit);
  const copy = COPY[audience];
  const look = LOOK[audience];
  const href = `/shop?audience=${audience}`;
  const headingId = `${audience}-products-heading`;

  return (
    <section id={audience} className={`${look.section} relative overflow-hidden py-14 md:py-20 lg:py-24`} aria-labelledby={headingId}>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent ${look.dark ? 'via-gold-light/60' : 'via-gold-deep/40'}`}
      />
      <div className="luxury-container">
        <div className={`grid items-stretch gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10 ${look.imageRight ? 'lg:[&>*:first-child]:order-2' : ''}`}>
          {/* Lead image panel */}
          <Reveal className="h-full">
            <div className="group relative isolate flex min-h-[420px] h-full flex-col justify-end overflow-hidden rounded-2xl bg-espresso lg:min-h-[560px]">
              <Image
                src={copy.image}
                alt={copy.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="-z-10 object-cover object-[50%_15%] transition-transform duration-[1200ms] ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-espresso/95 via-espresso/40 to-transparent" aria-hidden="true" />
              <div className="p-6 md:p-9">
                <span className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-gold-light md:text-xs">
                  <span className="block h-px w-8 bg-gold-light" aria-hidden="true" />
                  {copy.eyebrow}
                </span>
                <h2 id={headingId} className="mt-3 font-heading text-3xl leading-tight text-white md:text-5xl">
                  {copy.title}
                </h2>
                <p className="mt-2 font-subheading text-base italic text-white/90 md:text-xl">{copy.tagline}</p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {look.chips.map((chip) => (
                    <li key={chip} className="rounded-full border border-white/40 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-white md:text-[11px]">
                      {chip}
                    </li>
                  ))}
                </ul>
                <Link
                  href={href}
                  className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-espresso transition-colors hover:bg-gold-light"
                >
                  {look.cta} <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </Reveal>

          {/* Products, or the coming-soon panel */}
          {products.length === 0 ? (
            <ComingSoonPanel
              title={copy.emptyTitle}
              text={copy.emptyText}
              href="/shop"
              ctaLabel="Browse the full collection"
              dark={look.dark}
            />
          ) : (
            <div className="flex flex-col">
              <StaggerGroup className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                {products.map((product) => (
                  <StaggerItem key={product.id}>
                    <ProductCard product={product} />
                  </StaggerItem>
                ))}
              </StaggerGroup>
              <div className="mt-8 flex justify-center">
                <Link
                  href={href}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-6 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors md:text-xs ${
                    look.dark
                      ? 'border-gold-light text-gold-light hover:bg-gold-light hover:text-espresso'
                      : 'border-gold-deep text-ink hover:bg-gold-deep hover:text-white'
                  }`}
                >
                  View all <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
