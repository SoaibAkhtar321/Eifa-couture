/* ============================================
   EIFA COUTURE — Admin Collection ↔ Product Assignment (browser)
   ============================================
   Manages rows in the `product_collections` join table (see
   supabase/migrations/0002_core_tables.sql). Uses the BROWSER client
   so it can be called directly from the Client Component assignment
   widget on the collection edit page — mirrors the convention in
   `lib/admin/collections-write.ts` / `lib/admin/products-write.ts`.
   RLS (`is_admin()`) is the actual security boundary either way.

   `product_collections` has a composite primary key
   (product_id, collection_id), so a duplicate assignment would fail
   at the DB level regardless — `isProductAssigned` lets the UI check
   first and short-circuit with a friendly message instead of
   surfacing a raw constraint error.
   ============================================ */

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { DbProduct } from '@/types/database';

export interface AssignedProduct {
  product_id: string;
  sort_order: number;
  product: Pick<DbProduct, 'id' | 'name' | 'slug' | 'is_active'> & {
    primary_image_url: string | null;
  };
}

/**
 * Currently assigned products for a collection, ordered the same way
 * the storefront reads them (`sort_order`), with just enough product
 * detail (name, primary image, active status) for the admin list.
 */
export async function getAssignedProducts(collectionId: string): Promise<{
  data: AssignedProduct[] | null;
  error: string | null;
}> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from('product_collections')
    .select(
      `
      product_id,
      sort_order,
      products (
        id, name, slug, is_active, deleted_at,
        product_images(url, is_primary)
      )
    `
    )
    .eq('collection_id', collectionId)
    .order('sort_order', { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  type RawRow = {
    product_id: string;
    sort_order: number;
    products: (Pick<DbProduct, 'id' | 'name' | 'slug' | 'is_active'> & {
      deleted_at: string | null;
      product_images: { url: string; is_primary: boolean }[];
    }) | null;
  };

  const rows: AssignedProduct[] = ((data ?? []) as unknown as RawRow[])
    // a product can be soft-deleted while still referenced by the
    // join row (cascade only fires on hard delete) — filter those out
    .filter((row) => row.products && row.products.deleted_at === null)
    .map((row) => {
      const product = row.products!;
      const primaryImage = product.product_images.find((img) => img.is_primary) ?? product.product_images[0];
      return {
        product_id: row.product_id,
        sort_order: row.sort_order,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          is_active: product.is_active,
          primary_image_url: primaryImage?.url ?? null,
        },
      };
    });

  return { data: rows, error: null };
}

export interface ProductSearchResult {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  primary_image_url: string | null;
}

/**
 * Searches non-deleted products by name/slug for the "add product"
 * picker. Already-assigned product ids are excluded so the results
 * only ever show products that can actually be added.
 */
export async function searchAssignableProducts(
  query: string,
  excludeProductIds: string[],
  limit = 20
): Promise<{ data: ProductSearchResult[] | null; error: string | null }> {
  const supabase = createBrowserClient();

  let request = supabase
    .from('products')
    .select('id, name, slug, is_active, product_images(url, is_primary)')
    .is('deleted_at', null);

  const term = query.trim();
  if (term) {
    request = request.or(`name.ilike.%${term}%,slug.ilike.%${term}%`);
  }
  if (excludeProductIds.length > 0) {
    request = request.not('id', 'in', `(${excludeProductIds.join(',')})`);
  }

  const { data, error } = await request.order('name', { ascending: true }).limit(limit);

  if (error) {
    return { data: null, error: error.message };
  }

  type RawRow = {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
    product_images: { url: string; is_primary: boolean }[];
  };

  const rows: ProductSearchResult[] = ((data ?? []) as unknown as RawRow[]).map((row) => {
    const primaryImage = row.product_images.find((img) => img.is_primary) ?? row.product_images[0];
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      is_active: row.is_active,
      primary_image_url: primaryImage?.url ?? null,
    };
  });

  return { data: rows, error: null };
}

export async function isProductAssigned(collectionId: string, productId: string): Promise<boolean> {
  const supabase = createBrowserClient();

  const { data } = await supabase
    .from('product_collections')
    .select('product_id')
    .eq('collection_id', collectionId)
    .eq('product_id', productId)
    .limit(1);

  return (data?.length ?? 0) > 0;
}

/**
 * Assigns a product to a collection, appended to the end of the
 * current sort order. Returns a friendly error instead of a raw
 * constraint violation if the product is already assigned.
 */
export async function assignProductToCollection(
  collectionId: string,
  productId: string
): Promise<{ error: string | null }> {
  const supabase = createBrowserClient();

  if (await isProductAssigned(collectionId, productId)) {
    return { error: 'This product is already in the collection.' };
  }

  const { count } = await supabase
    .from('product_collections')
    .select('product_id', { count: 'exact', head: true })
    .eq('collection_id', collectionId);

  const { error } = await supabase.from('product_collections').insert({
    collection_id: collectionId,
    product_id: productId,
    sort_order: count ?? 0,
  });

  return { error: error?.message ?? null };
}

export async function removeProductFromCollection(
  collectionId: string,
  productId: string
): Promise<{ error: string | null }> {
  const supabase = createBrowserClient();

  const { error } = await supabase
    .from('product_collections')
    .delete()
    .eq('collection_id', collectionId)
    .eq('product_id', productId);

  return { error: error?.message ?? null };
}
