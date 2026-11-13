import Image from 'next/image';
import Link from 'next/link';

import ProductCard from '@/components/product/ProductCard';
import Reveal from '@/components/motion/Reveal';
import { StaggerGroup, StaggerItem } from '@/components/motion/Stagger';
import { createClient } from '@/lib/supabase/server';
import { fetchProductsByAudience } from '@/lib/data/products';
import { getAudienceContent } from '@/lib/audience-content';
import type { Audience } from '@/lib/catalog';

interface Props {
  audience: Audience;
  limit?: number;
}

/**
 * One editorial homepage block per audience. Always renders, so Women,
 * Men and Accessories never disappear. With products: lead image beside
 * the product grid. Without products: the lead image becomes a wide
 * banner that leads to the audience's dedicated page. Products are
 * filtered strictly on `products.audience`, server-side.
 */
export default async function AudienceSection({ audience, limit = 6 }: Props) {
  const supabase = await createClient();
  const products = await fetchProductsByAudience(supabase, audience, limit);
  const content = getAudienceContent(audience);
  const headingId = `${audience}-products-heading`;
  const hasProducts = products.length > 0;

  return (
    <section
      id={audience}
      className={`${content.section} relative overflow-hidden py-12 md:py-16 lg:py-20`}
      aria-labelledby={headingId}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent ${content.dark ? 'via-gold-light/60' : 'via-gold-deep/40'}`}
      />
      <div className="luxury-container">
        <div
          className={`grid items-stretch gap-6 lg:gap-10 ${
            hasProducts ? 'lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]' : ''
          } ${hasProducts && content.imageRight ? 'lg:[&>*:first-child]:order-2' : ''}`}
        >
          {/* Lead image panel */}
          <Reveal className="h-full">
            <div
              className={`group relative isolate flex h-full flex-col justify-end overflow-hidden rounded-2xl bg-espresso ${
                hasProducts ? 'min-h-[440px] lg:min-h-[600px]' : 'min-h-[380px] md:min-h-[460px]'
              }`}
            >
              <Image
                src={content.image}
                alt={content.imageAlt}
                fill
                sizes={hasProducts ? '(max-width: 1024px) 100vw, 40vw' : '100vw'}
                className="-z-10 object-cover object-[50%_20%] transition-transform duration-[1200ms] ease-out group-hover:scale-105"
              />
              <div
                className="absolute inset-0 -z-10 bg-gradient-to-t from-espresso/95 via-espresso/45 to-espresso/10"
                aria-hidden="true"
              />
              <div className={`p-6 md:p-10 ${hasProducts ? '' : 'md:max-w-xl lg:p-14'}`}>
                <span className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-gold-light md:text-xs">
                  <span className="block h-px w-8 bg-gold-light" aria-hidden="true" />
                  {content.eyebrow}
                </span>
                <h2 id={headingId} className="mt-3 font-heading text-3xl leading-tight text-white md:text-5xl">
                  {content.title}
                </h2>
                <p className="mt-2 font-subheading text-base italic text-white/90 md:text-xl">{content.tagline}</p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {content.chips.map((chip) => (
                    <li
                      key={chip}
                      className="rounded-full border border-white/40 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-white md:text-[11px]"
                    >
                      {chip}
                    </li>
                  ))}
                </ul>
                <Link
                  href={content.path}
                  className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-espresso transition-colors hover:bg-gold-light"
                >
                  {content.cta} <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </Reveal>

          {hasProducts && (
            <div className="flex flex-col justify-center">
              <StaggerGroup className="flex flex-wrap justify-center gap-3 sm:gap-5">
                {products.map((product) => (
                  <StaggerItem
                    key={product.id}
                    className="w-[calc(50%-6px)] sm:w-[calc(50%-10px)] xl:w-[calc(33.333%-14px)]"
                  >
                    <ProductCard product={product} />
                  </StaggerItem>
                ))}
              </StaggerGroup>
              <div className="mt-8 flex justify-center">
                <Link
                  href={content.path}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-6 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors md:text-xs ${
                    content.dark
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
