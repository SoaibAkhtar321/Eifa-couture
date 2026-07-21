/* ============================================
   EIFA COUTURE — Admin Product Data Access
   ============================================
   Sibling to `lib/data/products.ts`, not an extension of it — that
   file is shaped for the storefront (maps DB rows onto the UI-facing
   `Product` type, filters to `is_active` only, drops inactive
   variants). Admin needs raw DB rows, including inactive/unpublished
   ones, so this file talks to the tables directly.

   Reads (listProducts, getProduct, slug/SKU uniqueness checks) use
   the SERVER Supabase client, because `src/app/admin/products/page.tsx`
   is a Server Component reading `searchParams` directly for SSR
   pagination/filtering — same reasoning as `lib/admin/auth.ts`.

   Writes (create/update/delete product, variant CRUD, inventory
   update) use the BROWSER client, called from Client Component forms,
   matching the existing `lib/orders.ts` / `lib/addresses.ts`
   convention. RLS (`is_admin()`) is the actual security boundary
   either way — see supabase/migrations/0005_rls_policies.sql.
   ============================================ */

import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { generateSlug } from '@/lib/utils';
import type {
  DbProduct,
  DbProductImage,
  DbProductVariant,
  DbInventory,
} from '@/types/database';

/* ---------- List (Server Component read) ---------- */

export interface ProductListFilters {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  lowStockOnly?: boolean;
  sort?: 'newest' | 'updated' | 'name' | 'price';
  page?: number;
  pageSize?: number;
}

export interface ProductListRow extends DbProduct {
  category_name: string | null;
  primary_image_url: string | null;
  total_stock: number;
  variant_count: number;
}

export interface ProductListResult {
  rows: ProductListRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const SORT_COLUMNS: Record<NonNullable<ProductListFilters['sort']>, { column: string; ascending: boolean }> = {
  newest: { column: 'created_at', ascending: false },
  updated: { column: 'updated_at', ascending: false },
  name: { column: 'name', ascending: true },
  price: { column: 'price', ascending: true },
};

/**
 * Paginated/filtered/sorted product list for the admin table.
 * Category name, primary image, and stock totals are resolved via
 * nested selects rather than separate round-trips.
 */
export async function listProducts(filters: ProductListFilters = {}): Promise<{
  data: ProductListResult | null;
  error: string | null;
}> {
  const supabase = await createServerClient();

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const sort = SORT_COLUMNS[filters.sort ?? 'newest'];

  let query = supabase
    .from('products')
    .select(
      `
      *,
      category:categories(name),
      product_images(url, is_primary),
      product_variants(id, is_active, inventory(quantity))
    `,
      { count: 'exact' }
    )
    .is('deleted_at', null);

  if (filters.search) {
    const term = filters.search.trim();
    query = query.or(`name.ilike.%${term}%,slug.ilike.%${term}%`);
  }
  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }
  if (filters.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }
  if (filters.isFeatured !== undefined) {
    query = query.eq('is_featured', filters.isFeatured);
  }

  query = query.order(sort.column, { ascending: sort.ascending }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  type RawRow = DbProduct & {
    category: { name: string } | null;
    product_images: { url: string; is_primary: boolean }[];
    product_variants: { id: string; is_active: boolean; inventory: { quantity: number } | null }[];
  };

  let rows: ProductListRow[] = ((data ?? []) as unknown as RawRow[]).map((row) => {
    const primaryImage = row.product_images.find((img) => img.is_primary) ?? row.product_images[0];
    const totalStock = row.product_variants.reduce((sum, v) => sum + (v.inventory?.quantity ?? 0), 0);

    return {
      ...row,
      category_name: row.category?.name ?? null,
      primary_image_url: primaryImage?.url ?? null,
      total_stock: totalStock,
      variant_count: row.product_variants.length,
    };
  });

  // low-stock filtering happens post-fetch since it depends on the
  // aggregated inventory total, not a column the query can filter on
  if (filters.lowStockOnly) {
    rows = rows.filter((row) => row.total_stock > 0 && row.total_stock <= 5);
  }

  return {
    data: { rows, totalCount: count ?? 0, page, pageSize },
    error: null,
  };
}

/* ---------- Single product (Server Component read) ---------- */

export interface ProductWithRelations extends DbProduct {
  product_images: DbProductImage[];
  product_variants: (DbProductVariant & { inventory: DbInventory | null })[];
}

export async function getProduct(id: string): Promise<{
  data: ProductWithRelations | null;
  error: string | null;
}> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      product_images(*),
      product_variants(*, inventory(*))
    `
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as unknown as ProductWithRelations, error: null };
}

/* ---------- Slug / SKU uniqueness (server reads, called from forms) ---------- */

export async function isSlugTaken(slug: string, excludeProductId?: string): Promise<boolean> {
  const supabase = createBrowserClient();

  let query = supabase.from('products').select('id').eq('slug', slug).is('deleted_at', null);
  if (excludeProductId) {
    query = query.neq('id', excludeProductId);
  }

  const { data } = await query.limit(1);
  return (data?.length ?? 0) > 0;
}

export async function isSkuTaken(sku: string, excludeVariantId?: string): Promise<boolean> {
  const supabase = createBrowserClient();

  let query = supabase.from('product_variants').select('id').eq('sku', sku);
  if (excludeVariantId) {
    query = query.neq('id', excludeVariantId);
  }

  const { data } = await query.limit(1);
  return (data?.length ?? 0) > 0;
}

/**
 * Generates a unique slug from a product name, appending -2, -3, etc.
 * if the base slug is already taken.
 */
export async function generateUniqueSlug(name: string, excludeProductId?: string): Promise<string> {
  const base = generateSlug(name);
  let candidate = base;
  let suffix = 2;

  while (await isSlugTaken(candidate, excludeProductId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

/* ---------- Create / update product (browser client, called from forms) ---------- */

export interface ProductInput {
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  compare_at_price: number | null;
  category_id: string | null;
  fabric_id: string | null;
  tags: string[];
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[];
}

export async function createProduct(input: ProductInput): Promise<{
  data: DbProduct | null;
  error: string | null;
}> {
  const supabase = createBrowserClient();

  if (await isSlugTaken(input.slug)) {
    return { data: null, error: 'That slug is already in use by another product.' };
  }

  const { data, error } = await supabase.from('products').insert(input).select().single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as DbProduct, error: null };
}

export async function updateProduct(
  id: string,
  input: ProductInput
): Promise<{ data: DbProduct | null; error: string | null }> {
  const supabase = createBrowserClient();

  if (await isSlugTaken(input.slug, id)) {
    return { data: null, error: 'That slug is already in use by another product.' };
  }

  const { data, error } = await supabase
    .from('products')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as DbProduct, error: null };
}

export async function softDeleteProduct(id: string): Promise<{ error: string | null }> {
  const supabase = createBrowserClient();
  const { error } = await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  return { error: error?.message ?? null };
}

/* ---------- Variant CRUD (browser client, called from forms) ---------- */

export interface VariantInput {
  size: string;
  color_name: string;
  color_hex: string | null;
  sku: string;
  price_override: number | null;
  is_active: boolean;
}

export async function createVariant(
  productId: string,
  input: VariantInput,
  initialQuantity: number,
  lowStockAt: number
): Promise<{ data: DbProductVariant | null; error: string | null }> {
  const supabase = createBrowserClient();

  if (await isSkuTaken(input.sku)) {
    return { data: null, error: 'That SKU is already in use.' };
  }

  const { data: variant, error: variantError } = await supabase
    .from('product_variants')
    .insert({ ...input, product_id: productId })
    .select()
    .single();

  if (variantError || !variant) {
    return { data: null, error: variantError?.message ?? 'Failed to create variant.' };
  }

  const { error: inventoryError } = await supabase.from('inventory').insert({
    variant_id: (variant as DbProductVariant).id,
    quantity: initialQuantity,
    reserved: 0,
    low_stock_at: lowStockAt,
  });

  if (inventoryError) {
    return { data: null, error: inventoryError.message };
  }

  return { data: variant as DbProductVariant, error: null };
}

export async function updateVariant(
  variantId: string,
  input: VariantInput
): Promise<{ data: DbProductVariant | null; error: string | null }> {
  const supabase = createBrowserClient();

  if (await isSkuTaken(input.sku, variantId)) {
    return { data: null, error: 'That SKU is already in use.' };
  }

  const { data, error } = await supabase
    .from('product_variants')
    .update(input)
    .eq('id', variantId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as DbProductVariant, error: null };
}

export async function deleteVariant(variantId: string): Promise<{ error: string | null }> {
  const supabase = createBrowserClient();
  const { error } = await supabase.from('product_variants').delete().eq('id', variantId);
  return { error: error?.message ?? null };
}

export async function updateInventoryQuantity(
  variantId: string,
  quantity: number,
  lowStockAt?: number
): Promise<{ error: string | null }> {
  const supabase = createBrowserClient();

  const update: { quantity: number; low_stock_at?: number } = { quantity };
  if (lowStockAt !== undefined) update.low_stock_at = lowStockAt;

  const { error } = await supabase.from('inventory').update(update).eq('variant_id', variantId);
  return { error: error?.message ?? null };
}