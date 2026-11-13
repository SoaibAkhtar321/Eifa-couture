import type { Metadata } from 'next';
import { Suspense } from 'react';

import ShopPageClient from '@/components/shop/ShopPageClient';
import { fetchActiveCategories } from '@/lib/data/categories';
import { fetchShopFacets, fetchShopProducts } from '@/lib/data/shop';
import { parseShopFilters } from '@/lib/shop-filters';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Shop Collection | Eifa Couture',
  description: 'Explore Eifa Couture’s premium handcrafted Lucknowi Chikankari collection.',
  alternates: { canonical: '/shop' },
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filters = parseShopFilters(await searchParams);
  const supabase = await createClient();

  // Filtering, sorting and paging all happen in Supabase; only one page
  // of products reaches the browser.
  const categories = await fetchActiveCategories(supabase);
  const [{ products, total }, facets] = await Promise.all([
    fetchShopProducts(supabase, filters, categories),
    fetchShopFacets(supabase, filters.audience),
  ]);

  return (
    <Suspense fallback={null}>
      <ShopPageClient
        categories={categories}
        products={products}
        total={total}
        filters={filters}
        facets={facets}
      />
    </Suspense>
  );
}
