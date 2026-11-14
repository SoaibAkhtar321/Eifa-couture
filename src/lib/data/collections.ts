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

/** A collection's public page: the collection plus its visible products, in the admin's order. */
export async function fetchCollectionPageBySlug(
  supabase: SupabaseClient,
  slug: string,
  limit = 120
): Promise<FeaturedCollectionResult | null> {
  const { data: row, error } = await supabase
    .from('collections')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !row) return null;
  const collection = row as DbCollection;
  if (!isWithinCampaignWindow(collection, new Date())) return null;

  const { data: memberRows } = await supabase
    .from('product_collections')
    .select(`sort_order, products ( ${PRODUCT_SELECT} )`)
    .eq('collection_id', collection.id)
    .order('sort_order', { ascending: true })
    .limit(limit);

  const products = ((memberRows ?? []) as unknown as { products: ProductRow | null }[])
    .map((member) => member.products)
    .filter((product): product is ProductRow => !!product && product.is_active && !product.deleted_at)
    .map(mapProductRow);

  return { collection: mapCollectionRow(collection), products };
}

export interface MenuCollection {
  name: string;
  slug: string;
}

/** Active collections the admin chose to show in the menu / footer. */
export async function fetchMenuCollections(supabase: SupabaseClient): Promise<MenuCollection[]> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('is_active', true)
    .eq('show_in_menu', true)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  if (error || !data) return [];
  const now = new Date();
  return (data as DbCollection[])
    .filter((row) => isWithinCampaignWindow(row, now))
    .map((row) => ({ name: row.name, slug: row.slug }));
}

export async function fetchActiveCollectionSlugs(supabase: SupabaseClient): Promise<string[]> {
  const { data } = await supabase
    .from('collections')
    .select('slug, starts_at, ends_at, is_active, deleted_at')
    .eq('is_active', true)
    .is('deleted_at', null);
  const now = new Date();
  return ((data ?? []) as DbCollection[]).filter((row) => isWithinCampaignWindow(row, now)).map((row) => row.slug);
}

export type FeaturedCollectionResult = {
  collection: Collection;
  products: Product[];
};

/**
 * The homepage "Featured Collection" section's collection, plus its
 * member products (ordered by `product_collections.sort_order`).
 *
 * If `collectionId` is given (set by an admin via Homepage CMS), that
 * exact collection is used, provided it's still active. Otherwise
 * falls back to the original behavior: the single active, featured
 * collection currently within its campaign window. Returns null when
 * nothing qualifies — callers should treat that as an empty state.
 */
export async function fetchFeaturedCollection(
  supabase: SupabaseClient,
  limit = 4,
  collectionId?: string | null
): Promise<FeaturedCollectionResult | null> {
  let activeCollection: DbCollection | undefined;

  if (collectionId) {
    const { data: row, error } = await supabase
      .from('collections')
      .select('*')
      .eq('id', collectionId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single();

    if (error || !row) return null;
    activeCollection = row as DbCollection;
  } else {
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
    activeCollection = (collectionRows as DbCollection[]).find((row) => isWithinCampaignWindow(row, now));
  }

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
