import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ProductDetailsClient from '@/components/product/ProductDetailsClient';

import { createClient } from '@/lib/supabase/server';
import { SITE_URL } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';
import { fetchProductBySlug, fetchRelatedProducts } from '@/lib/data/products';

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const RELATED_PRODUCTS_LIMIT = 4;
const SHARE_IMAGE_WIDTH = 1200;

// Link-preview crawlers need an absolute, publicly reachable image. Routing it
// through the Next image optimizer gives a predictable 1200px-wide (and much
// lighter) file even when the stored photo is huge — WhatsApp skips big images.
function absoluteShareImage(src: string): string {
  return `${SITE_URL}/_next/image?url=${encodeURIComponent(src)}&w=${SHARE_IMAGE_WIDTH}&q=75`;
}

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

  const url = `${SITE_URL}/product/${product.slug}`;
  const priceText = `${product.hasPriceRange ? 'From ' : ''}${formatPrice(product.minPrice)}`;
  const description = [product.seo.description, `Price: ${priceText}.`].filter(Boolean).join(' ');
  const image = product.images?.[0] ? absoluteShareImage(product.images[0]) : undefined;
  const images = image ? [{ url: image, width: SHARE_IMAGE_WIDTH, alt: product.name }] : undefined;

  return {
    title: product.seo.title,
    description: product.seo.description,
    keywords: product.seo.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      siteName: 'Eifa Couture',
      locale: 'en_IN',
      title: product.seo.title,
      description,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.seo.title,
      description,
      images: images?.map((i) => i.url),
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
    RELATED_PRODUCTS_LIMIT,
    product.audience
  );

  const inStock = Object.values(product.stock).some((count) => count > 0);
  const availability = `https://schema.org/${inStock ? 'InStock' : 'OutOfStock'}`;
  const url = `${SITE_URL}/product/${product.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription || product.description,
    image: product.images,
    sku: product.sku ?? undefined,
    brand: { '@type': 'Brand', name: 'Eifa Couture' },
    offers: product.hasPriceRange
      ? {
          '@type': 'AggregateOffer',
          priceCurrency: 'INR',
          lowPrice: product.minPrice,
          highPrice: product.maxPrice,
          offerCount: Math.max(product.variants.length, 1),
          availability,
          url,
        }
      : { '@type': 'Offer', priceCurrency: 'INR', price: product.minPrice, availability, url },
  };

  return (
    <>
      {/* Product structured data for search engines. `<` is escaped so the JSON can never close the tag. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
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
