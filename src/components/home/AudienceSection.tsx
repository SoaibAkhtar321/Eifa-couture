import Image from 'next/image';
import Link from 'next/link';

import ProductRail from '@/components/home/ProductRail';
import { createClient } from '@/lib/supabase/server';
import { fetchProductsInCategories } from '@/lib/data/products';
import { getAudienceSlugs, type Audience } from '@/lib/catalog';
import type { Category } from '@/types';

const COPY: Record<Audience, { eyebrow: string; title: string; text: string; image: string; tone: 'ivory' | 'cream' }> = {
  women: {
    eyebrow: 'For Her',
    title: "Women's Collection",
    text: 'Sarees, kurta sets and suits — hand-embroidered by Lucknow’s master karigars.',
    image: '/images/collections/women.png',
    tone: 'ivory',
  },
  men: {
    eyebrow: 'For Him',
    title: "Men's Collection",
    text: 'Chikankari kurtas in cotton, silk and linen for festive days and every day.',
    image: '/images/collections/men.png',
    tone: 'cream',
  },
};

interface Props {
  audience: Audience;
  categories: Category[];
  limit?: number;
}

export default async function AudienceSection({ audience, categories, limit = 8 }: Props) {
  const slugs = getAudienceSlugs(categories, audience);
  const categoryIds = categories.filter((c) => slugs.has(c.slug)).map((c) => c.id);

  const supabase = await createClient();
  const products = await fetchProductsInCategories(supabase, categoryIds, limit);
  const copy = COPY[audience];
  const href = `/shop?audience=${audience}`;

  return (
    <>
      <section className={copy.tone === 'ivory' ? 'bg-ivory pt-10 md:pt-16' : 'bg-cream pt-10 md:pt-16'}>
        <div className="luxury-container">
          <Link
            href={href}
            className="group relative grid overflow-hidden bg-charcoal md:grid-cols-[1.1fr_1fr]"
          >
            <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[380px]">
              <Image
                src={copy.image}
                alt={copy.title}
                fill
                sizes="(max-width: 768px) 100vw, 55vw"
                className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </div>
            <div className="flex flex-col justify-center px-6 py-7 text-white md:px-12">
              <span className="text-[10px] uppercase tracking-[0.28em] text-gold md:text-xs">{copy.eyebrow}</span>
              <h2 className="mt-3 font-heading text-3xl md:text-5xl">{copy.title}</h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-white/70 md:text-base">{copy.text}</p>
              <span className="mt-6 inline-flex w-fit border border-gold px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-gold transition-colors group-hover:bg-gold group-hover:text-charcoal">
                Shop {audience === 'women' ? 'Women' : 'Men'}
              </span>
            </div>
          </Link>
        </div>
      </section>

      {products.length > 0 ? (
        <ProductRail
          id={`${audience}-products-heading`}
          eyebrow={copy.eyebrow}
          title={`Latest for ${audience === 'women' ? 'Her' : 'Him'}`}
          products={products}
          viewAllHref={href}
          viewAllLabel="View all"
          tone={copy.tone}
        />
      ) : (
        <div className={copy.tone === 'ivory' ? 'bg-ivory pb-10 md:pb-16' : 'bg-cream pb-10 md:pb-16'} />
      )}
    </>
  );
}
