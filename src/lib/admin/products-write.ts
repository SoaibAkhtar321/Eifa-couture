/* ============================================
   EIFA COUTURE — Admin Product Data Access (browser writes)
   ============================================
   Writes (create/update/delete product, variant CRUD, inventory
   update) use the BROWSER client, called from Client Component forms,
   matching the existing `lib/orders.ts` / `lib/addresses.ts`
   convention. RLS (`is_admin()`) is the actual security boundary
   either way — see supabase/migrations/0005_rls_policies.sql.

   Slug/SKU uniqueness checks live here too (rather than in
   `lib/admin/products-read.ts`) because they use the browser client
   and are only ever called from Client Component forms.

   This module is safe to import from Client Components — it never
   imports `lib/supabase/server.ts` (which pulls in `next/headers`).
   See `lib/admin/products-read.ts` for the server-only read
   counterpart used by Server Components.
   ============================================ */

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { generateSlug } from '@/lib/utils';
import type { DbProduct, DbProductVariant } from '@/types/database';

/* ---------- Slug / SKU uniqueness (browser reads, called from forms) ---------- */

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