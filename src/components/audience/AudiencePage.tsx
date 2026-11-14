import Image from 'next/image';
import Link from 'next/link';

import Reveal from '@/components/motion/Reveal';
import { StaggerGroup, StaggerItem } from '@/components/motion/Stagger';
import ProductCard from '@/components/product/ProductCard';
import CategoryImage from '@/components/ui/CategoryImage';
import { getAudienceContent } from '@/lib/audience-content';
import { getAudiencePanelImage } from '@/lib/data/audience-panels';
import { getAudienceRootCategories, type Audience } from '@/lib/catalog';
import { fetchActiveCategoriesWithImages } from '@/lib/data/categories';
import { fetchProductsByAudience } from '@/lib/data/products';
import { createClient } from '@/lib/supabase/server';

const OTHERS: Record<Audience, { href: string; label: string }[]> = {
  women: [
    { href: '/men', label: "Men's Collection" },
    { href: '/accessories', label: 'Bags & Accessories' },
  ],
  men: [
    { href: '/women', label: "Women's Collection" },
    { href: '/accessories', label: 'Bags & Accessories' },
  ],
  accessories: [
    { href: '/women', label: "Women's Collection" },
    { href: '/men', label: "Men's Collection" },
  ],
};

/**
 * Dedicated page for one audience (/women, /men, /accessories): editorial
 * banner, that audience's categories, then every product of that
 * audience only (strict `products.audience` filter, server-side).
 */
export default async function AudiencePage({ audience }: { audience: Audience }) {
  const supabase = await createClient();
  const [products, allCategories, panelImage] = await Promise.all([
    fetchProductsByAudience(supabase, audience, 60),
    fetchActiveCategoriesWithImages(supabase),
    getAudiencePanelImage(audience),
  ]);
  const content = getAudienceContent(audience, panelImage);
  const categories = getAudienceRootCategories(allCategories, audience);

  return (
    <main>
      <section className="relative isolate flex min-h-[420px] items-end overflow-hidden bg-espresso md:min-h-[520px]" aria-labelledby="audience-title">
        <Image
          src={content.image}
          alt={content.imageAlt}
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-[50%_20%]"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-espresso/95 via-espresso/55 to-espresso/20" aria-hidden="true" />
        <div className="luxury-container w-full pb-10 pt-32 md:pb-16">
          <span className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-gold-light md:text-xs">
            <span className="block h-px w-8 bg-gold-light" aria-hidden="true" />
            {content.eyebrow}
          </span>
          <h1 id="audience-title" className="mt-3 font-heading text-4xl leading-tight text-white md:text-6xl">
            {content.title}
          </h1>
          <p className="mt-2 font-subheading text-lg italic text-white/90 md:text-2xl">{content.tagline}</p>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/90 md:text-base">{content.intro}</p>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="bg-parchment py-10 md:py-14" aria-label={`${content.title} categories`}>
          <div className="luxury-container">
            <StaggerGroup className="flex flex-wrap justify-center gap-3 md:gap-5">
              {categories.map((category) => (
                <StaggerItem key={category.id} className="w-[calc(50%-6px)] sm:w-60 md:w-64">
                  <Link
                    href={`/shop?audience=${audience}&category=${category.slug}`}
                    className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-espresso ring-1 ring-gold-deep/30"
                  >
                    <CategoryImage
                      src={category.image}
                      name={category.name}
                      sizes="(max-width: 640px) 50vw, 256px"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/20 to-transparent" aria-hidden="true" />
                    <span className="absolute inset-x-0 bottom-0 p-4 font-heading text-xl text-white md:text-2xl">
                      {category.name}
                    </span>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </section>
      )}

      <section className="bg-ivory py-12 md:py-16" aria-labelledby="audience-products">
        <div className="luxury-container">
          <Reveal className="mb-8 flex flex-col items-center text-center md:mb-12">
            <h2 id="audience-products" className="font-heading text-3xl text-ink md:text-5xl">
              All {content.title}
            </h2>
            {products.length > 0 && (
              <p className="mt-3 text-sm text-ink-soft">
                {products.length} {products.length === 1 ? 'piece' : 'pieces'}
              </p>
            )}
          </Reveal>

          {products.length > 0 ? (
            <StaggerGroup className="flex flex-wrap justify-center gap-3 sm:gap-5">
              {products.map((product) => (
                <StaggerItem
                  key={product.id}
                  className="w-[calc(50%-6px)] sm:w-[calc(33.333%-14px)] lg:w-[calc(25%-15px)]"
                >
                  <ProductCard product={product} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          ) : (
            <div className="mx-auto max-w-lg rounded-2xl border border-gold-deep/40 bg-white/60 px-6 py-12 text-center">
              <p className="font-heading text-2xl text-ink md:text-3xl">No pieces listed here yet</p>
              <p className="mt-3 text-sm leading-7 text-ink-soft md:text-base">
                Products added to this collection will appear on this page.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {OTHERS[audience].map((other) => (
                  <Link
                    key={other.href}
                    href={other.href}
                    className="inline-flex min-h-11 items-center rounded-full border border-gold-deep px-6 text-[11px] font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:bg-gold-deep hover:text-white"
                  >
                    {other.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
