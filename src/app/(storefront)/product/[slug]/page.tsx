import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ProductDetailsClient from '@/components/product/ProductDetailsClient';

import { createClient } from '@/lib/supabase/server';
import { fetchProductBySlug, fetchRelatedProducts } from '@/lib/data/products';

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const RELATED_PRODUCTS_LIMIT = 4;

// `generateMetadata` and the page component both need the same product.
// Without this, that's two separate Supabase round trips for one page
// load. `cache()` scopes the memoization to a single render pass (this
// request), keyed only on `slug` — the internal `createClient()` call
// is intentionally *inside* here so both callers share one lookup
// instead of the cache key depending on which client instance called it.
const getCachedProductBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  return fetchProductBySlug(supabase, slug);
});

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCachedProductBySlug(slug);

  if (!product) {
    return {
      title: 'Product Not Found | Eifa Couture',
      description: 'The requested product could not be found at Eifa Couture.',
    };
  }

  return {
    title: product.seo.title,
    description: product.seo.description,
    keywords: product.seo.keywords,
    openGraph: {
      title: product.seo.title,
      description: product.seo.description,
      type: 'website',
      images: product.images?.[0]
        ? [
            {
              url: product.images[0],
              alt: product.name,
            },
          ]
        : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getCachedProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const supabase = await createClient();
  const relatedProducts = await fetchRelatedProducts(
    supabase,
    product.id,
    product.category,
    RELATED_PRODUCTS_LIMIT
  );

  return (
    <>
      <main
        id="product-main-content"
        className="w-full scroll-mt-[72px] sm:scroll-mt-[78px] lg:scroll-mt-[84px]"
      >
        {/* key={slug} forces a full unmount/remount on every product change,
            clearing leftover gallery/review/carousel state from the previous product */}
        <ProductDetailsClient
          key={slug}
          product={product}
          relatedProducts={relatedProducts}
        />
      </main>
    </>
  );
}
