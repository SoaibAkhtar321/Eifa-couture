/* ============================================
   EIFA COUTURE — Shop data access (server-side filtering)
   ============================================
   The shop page used to download every product and filter in the
   browser. Everything is now filtered, sorted and paged by Supabase;
   only the requested page of products is sent to the client.
   ============================================ */

import type { SupabaseClient } from '@supabase/supabase-js';

import { expandCategorySlugs, type Audience } from '@/lib/catalog';
import { SIZES } from '@/lib/constants';
import { mapProductRow, PRODUCT_SELECT, type ProductRow } from '@/lib/data/products';
import { getPriceBounds, type ShopFilters } from '@/lib/shop-filters';
import type { Category, Product } from '@/types';

export interface ShopFacets {
  sizes: string[];
  colors: { name: string; hex: string }[];
  fabrics: string[];
}

export interface ShopResult {
  products: Product[];
  total: number;
}

const EMPTY: ShopResult = { products: [], total: 0 };

/** Strips characters that have a meaning inside a PostgREST filter. */
function safeSearchTerm(value: string): string {
  return value.replace(/[%*,()"\\:]/g, ' ').replace(/\s+/g, ' ').trim();
}

interface VariantRow {
  product_id: string;
  size: string;
  color_name: string;
  inventory: { quantity: number; reserved: number } | { quantity: number; reserved: number }[] | null;
}

/**
 * Product ids that have at least one active variant matching the size /
 * colour / in-stock filters. Returns null when none of those filters is
 * set (no restriction).
 */
async function fetchVariantProductIds(
  supabase: SupabaseClient,
  filters: ShopFilters
): Promise<string[] | null> {
  if (filters.sizes.length === 0 && filters.colors.length === 0 && !filters.inStock) return null;

  let query = supabase
    .from('product_variants')
    .select('product_id, size, color_name, inventory ( quantity, reserved )')
    .eq('is_active', true);
  if (filters.sizes.length) query = query.in('size', filters.sizes);
  if (filters.colors.length) query = query.in('color_name', filters.colors);

  const { data, error } = await query.limit(5000);
  if (error || !data) return [];

  const ids = new Set<string>();
  for (const row of data as unknown as VariantRow[]) {
    if (filters.inStock) {
      const inv = Array.isArray(row.inventory) ? row.inventory[0] : row.inventory;
      if (!inv || inv.quantity - inv.reserved <= 0) continue;
    }
    ids.add(row.product_id);
  }
  return Array.from(ids);
}

export async function fetchShopProducts(
  supabase: SupabaseClient,
  filters: ShopFilters,
  categories: Category[]
): Promise<ShopResult> {
  // Category (plus its sub-categories) -> ids. An unknown slug is ignored.
  let categoryIds: string[] | null = null;
  if (filters.category && categories.some((c) => c.slug === filters.category)) {
    const slugs = expandCategorySlugs(categories, [filters.category]);
    categoryIds = categories.filter((c) => slugs.has(c.slug)).map((c) => c.id);
  }

  const [variantProductIds, fabricIds] = await Promise.all([
    fetchVariantProductIds(supabase, filters),
    filters.fabrics.length
      ? supabase
          .from('fabrics')
          .select('id')
          .in('name', filters.fabrics)
          .then(({ data }) => (data ?? []).map((row: { id: string }) => row.id))
      : Promise.resolve(null),
  ]);

  if (variantProductIds && variantProductIds.length === 0) return EMPTY;
  if (fabricIds && fabricIds.length === 0) return EMPTY;

  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT, { count: 'exact' })
    .eq('is_active', true)
    .is('deleted_at', null);

  // Strict: the product's OWN audience, never guessed from the category.
  if (filters.audience) query = query.eq('audience', filters.audience satisfies Audience);
  if (categoryIds) query = query.in('category_id', categoryIds);
  if (filters.collection === 'new-arrivals') query = query.eq('is_new_arrival', true);
  if (filters.collection === 'best-sellers') query = query.eq('is_best_seller', true);
  if (filters.collection === 'featured') query = query.eq('is_featured', true);
  if (variantProductIds) query = query.in('id', variantProductIds);
  if (fabricIds) query = query.in('fabric_id', fabricIds);

  const bounds = getPriceBounds(filters.price);
  if (bounds.gte !== undefined) query = query.gte('price', bounds.gte);
  if (bounds.gt !== undefined) query = query.gt('price', bounds.gt);
  if (bounds.lte !== undefined) query = query.lte('price', bounds.lte);
  if (bounds.lt !== undefined) query = query.lt('price', bounds.lt);

  const term = safeSearchTerm(filters.q);
  if (term) {
    query = query.or(
      `name.ilike.%${term}%,short_description.ilike.%${term}%,description.ilike.%${term}%`
    );
  }

  if (filters.sort === 'price-low-high') query = query.order('price', { ascending: true });
  else if (filters.sort === 'price-high-low') query = query.order('price', { ascending: false });
  query = query.order('created_at', { ascending: false }).order('id', { ascending: true });

  const { data, error, count } = await query.range(0, filters.limit - 1);
  if (error || !data) return EMPTY;

  return {
    products: (data as unknown as ProductRow[]).map(mapProductRow),
    total: count ?? data.length,
  };
}

/**
 * Filter options that actually exist in the catalogue (scoped to the
 * chosen audience), so a shopper is never offered a size, colour or
 * fabric that matches nothing.
 */
export async function fetchShopFacets(
  supabase: SupabaseClient,
  audience: Audience | null
): Promise<ShopFacets> {
  let variantQuery = supabase
    .from('product_variants')
    .select('size, color_name, color_hex, products!inner ( is_active, deleted_at, audience )')
    .eq('is_active', true)
    .eq('products.is_active', true)
    .is('products.deleted_at', null);
  let fabricQuery = supabase
    .from('products')
    .select('fabrics ( name )')
    .eq('is_active', true)
    .is('deleted_at', null)
    .not('fabric_id', 'is', null);
  if (audience) {
    variantQuery = variantQuery.eq('products.audience', audience);
    fabricQuery = fabricQuery.eq('audience', audience);
  }

  const [variantResult, fabricResult] = await Promise.all([variantQuery.limit(5000), fabricQuery.limit(1000)]);

  const sizeSet = new Set<string>();
  const colorMap = new Map<string, string>();
  for (const row of (variantResult.data ?? []) as unknown as {
    size: string;
    color_name: string;
    color_hex: string | null;
  }[]) {
    sizeSet.add(row.size);
    if (!colorMap.has(row.color_name)) colorMap.set(row.color_name, row.color_hex ?? '#CCCCCC');
  }

  const order = new Map<string, number>(SIZES.map((size, index) => [size, index]));
  const sizes = Array.from(sizeSet).sort((a, b) => {
    const oa = order.get(a) ?? 99;
    const ob = order.get(b) ?? 99;
    return oa === ob ? a.localeCompare(b) : oa - ob;
  });

  const fabrics = Array.from(
    new Set(
      ((fabricResult.data ?? []) as unknown as { fabrics: { name: string } | { name: string }[] | null }[])
        .map((row) => (Array.isArray(row.fabrics) ? row.fabrics[0]?.name : row.fabrics?.name))
        .filter((name): name is string => !!name)
    )
  ).sort((a, b) => a.localeCompare(b));

  return {
    sizes,
    colors: Array.from(colorMap, ([name, hex]) => ({ name, hex })).sort((a, b) => a.name.localeCompare(b.name)),
    fabrics,
  };
}
