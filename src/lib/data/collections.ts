/* ============================================
   EIFA COUTURE — Collection Data Access
   ============================================
   Shared Supabase query layer for the `collections` +
   `product_collections` tables (editorial groupings, orthogonal to
   categories — e.g. "Eid Edit"). Mirrors the categories.ts / products.ts
   convention: thin query functions, mapped onto UI-facing shapes.
   ============================================ */

import type { SupabaseClient } from '@supabase/supabase-js';

import { PRODUCT_SELECT, mapProductRow, type ProductRow } from './products';
import type { Collection, Product } from '@/types';
import type { DbCollection } from '@/types/database';

const DEFAULT_COLLECTION_IMAGE = '/images/categories/kurtas.png';

function mapCollectionRow(row: DbCollection): Collection {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    image: row.image_url ?? DEFAULT_COLLECTION_IMAGE,
    isFeatured: row.is_featured,
    isActive: row.is_active,
    order: row.sort_order,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}

/**
 * `starts_at`/`ends_at` are an optional campaign window — null means
 * "no bound on that side". Checked in JS (against a handful of active
 * collection rows, not the product catalog) since expressing
 * "null-or-in-range" on both columns as a single indexed Postgres
 * filter would need an OR that defeats the partial index anyway.
 */
function isWithinCampaignWindow(row: DbCollection, now: Date): boolean {
  if (row.starts_at && new Date(row.starts_at) > now) return false;
  if (row.ends_at && new Date(row.ends_at) < now) return false;
  return true;
}

export type FeaturedCollectionResult = {
  collection: Collection;
  products: Product[];
};

/**
 * The single active, featured collection that should power the
 * homepage "Featured Collection" section, plus its member products
 * (ordered by `product_collections.sort_order`). Returns null when no
 * collection currently qualifies (inactive, not featured, or outside
 * its campaign window) — callers should treat that as an empty state.
 */
export async function fetchFeaturedCollection(
  supabase: SupabaseClient,
  limit = 4
): Promise<FeaturedCollectionResult | null> {
  const { data: collectionRows, error: collectionError } = await supabase
    .from('collections')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  if (collectionError || !collectionRows || collectionRows.length === 0) {
    return null;
  }

  const now = new Date();
  const activeCollection = (collectionRows as DbCollection[]).find((row) =>
    isWithinCampaignWindow(row, now)
  );

  if (!activeCollection) return null;

  const { data: memberRows, error: memberError } = await supabase
    .from('product_collections')
    .select(`sort_order, products ( ${PRODUCT_SELECT} )`)
    .eq('collection_id', activeCollection.id)
    .order('sort_order', { ascending: true })
    .limit(limit);

  if (memberError || !memberRows) {
    return { collection: mapCollectionRow(activeCollection), products: [] };
  }

  const products = (
    memberRows as unknown as { products: ProductRow | null }[]
  )
    .map((row) => row.products)
    .filter(
      (product): product is ProductRow =>
        !!product && product.is_active && !product.deleted_at
    )
    .map(mapProductRow);

  return { collection: mapCollectionRow(activeCollection), products };
}
