import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import Reveal from '@/components/motion/Reveal';
import { StaggerGroup, StaggerItem } from '@/components/motion/Stagger';
import ProductCard from '@/components/product/ProductCard';
import { fetchCollectionPageBySlug } from '@/lib/data/collections';
import { buildPageMetadata } from '@/lib/seo';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const result = await fetchCollectionPageBySlug(supabase, slug, 1);
  if (!result) return { title: 'Collection' };

  // og:image comes from the sibling opengraph-image.tsx (renders the collection name).
  return buildPageMetadata({
    title: result.collection.name,
    description: result.collection.description || `Shop the ${result.collection.name} collection at Eifa Couture.`,
    path: `/collections/${slug}`,
  });
}

/** Public page for an admin-created collection (e.g. Best Sellers, New Arrivals, Eid Edit). */
export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const result = await fetchCollectionPageBySlug(supabase, slug);
  if (!result) notFound();

  const { collection, products } = result;

  return (
    <main>
      <section
        className="relative isolate overflow-hidden bg-gradient-to-br from-maroon-dark via-maroon to-maroon-light"
        aria-labelledby="collection-title"
      >
        <div className="absolute -right-16 -top-16 -z-10 h-72 w-72 rounded-full bg-gold/10 blur-3xl" aria-hidden="true" />
        <div className="luxury-container pb-12 pt-32 text-center md:pb-16 md:pt-40">
          <span className="text-[10px] uppercase tracking-[0.3em] text-gold-light md:text-xs">Collection</span>
          <h1 id="collection-title" className="mt-3 font-heading text-4xl leading-tight text-white md:text-6xl">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/90 md:text-base">{collection.description}</p>
          )}
        </div>
      </section>

      <section className="bg-ivory py-12 md:py-16" aria-label={`${collection.name} products`}>
        <div className="luxury-container">
          {products.length > 0 ? (
            <>
              <Reveal className="mb-8 text-center text-sm text-ink-soft">
                {products.length} {products.length === 1 ? 'piece' : 'pieces'}
              </Reveal>
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
            </>
          ) : (
            <div className="mx-auto max-w-lg rounded-2xl border border-gold-deep/40 bg-white/60 px-6 py-12 text-center">
              <p className="font-heading text-2xl text-ink md:text-3xl">New pieces arriving soon</p>
              <p className="mt-3 text-sm leading-7 text-ink-soft md:text-base">
                Products added to this collection will appear here.
              </p>
              <Link href="/shop" className="btn-luxury btn-luxury-secondary mt-6 inline-flex">
                Shop all
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
