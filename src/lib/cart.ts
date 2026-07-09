'use client';

/* ============================================
   EIFA COUTURE — Cart Data Access
   ============================================
   Thin Supabase query layer for `cart_items`, mirroring the
   conventions in `lib/addresses.ts`: no Supabase calls inside
   components/stores, only here.

   `cart_items` is keyed by (user_id, variant_id) — not by
   product_id/size/color directly — so every read/write here also
   resolves a `product_variants` row. Reads rehydrate full `Product`
   objects via `fetchProductsByIds` (existing data layer) so the
   Zustand cart store keeps its current `CartItem` shape
   (`{ product, selectedSize, selectedColor, quantity }`) with zero
   changes required in any consuming component.
   ============================================ */

import type { SupabaseClient } from '@supabase/supabase-js';

import { fetchProductsByIds } from '@/lib/data/products';
import { createClient } from '@/lib/supabase/client';
import type { CartItem } from '@/types';
import type { DbCartItem, DbProductVariant } from '@/types/database';

export interface GuestCartLine {
  productId: string;
  size: string;
  color: string;
  quantity: number;
}

/** Resolve the active variant id for a given product + size + color. */
export async function resolveVariantId(
  supabase: SupabaseClient,
  productId: string,
  size: string,
  color: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('product_variants')
    .select('id')
    .eq('product_id', productId)
    .eq('size', size)
    .eq('color_name', color)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return null;
  return (data as Pick<DbProductVariant, 'id'>).id;
}

/**
 * Fetch the signed-in user's server cart and rehydrate it into the
 * UI-facing `CartItem[]` shape. Rows whose product/variant no longer
 * exists or is inactive are silently dropped (mirrors how a
 * discontinued product should just disappear from the cart).
 */
export async function fetchServerCart(
  supabase: SupabaseClient,
  userId: string
): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select('id, variant_id, quantity, product_variants ( id, product_id, size, color_name, is_active )')
    .eq('user_id', userId);

  if (error || !data) return [];

  type Row = DbCartItem & {
    product_variants: Pick<DbProductVariant, 'id' | 'product_id' | 'size' | 'color_name' | 'is_active'> | null;
  };

  const rows = (data as unknown as Row[]).filter(
    (row) => row.product_variants && row.product_variants.is_active
  );

  const productIds = Array.from(new Set(rows.map((row) => row.product_variants!.product_id)));
  const products = await fetchProductsByIds(supabase, productIds);
  const productMap = new Map(products.map((product) => [product.id, product]));

  const items: CartItem[] = [];
  for (const row of rows) {
    const variant = row.product_variants!;
    const product = productMap.get(variant.product_id);
    if (!product) continue;

    // Resolve this line's price from the product's own resolved
    // variants (price_override ?? base price) — never product.price
    // directly, so a variant-priced item never silently reprices to
    // the base product price.
    const matchedVariant = product.variants.find(
      (v) => v.size === variant.size && v.colorName === variant.color_name
    );
    const unitPrice = matchedVariant ? matchedVariant.price : product.minPrice;

    items.push({
      product,
      selectedSize: variant.size,
      selectedColor: variant.color_name,
      quantity: row.quantity,
      unitPrice,
    });
  }

  return items;
}

/**
 * Upsert one line (set quantity to an absolute value, not additive —
 * callers decide the resulting quantity, matching how the Zustand
 * store already clamps against stock before calling this).
 */
export async function upsertServerCartItem(
  userId: string,
  productId: string,
  size: string,
  color: string,
  quantity: number
): Promise<{ error: unknown }> {
  const supabase = createClient();

  const variantId = await resolveVariantId(supabase, productId, size, color);
  if (!variantId) return { error: 'variant_not_found' };

  const { error } = await supabase
    .from('cart_items')
    .upsert(
      { user_id: userId, variant_id: variantId, quantity },
      { onConflict: 'user_id,variant_id' }
    );

  return { error };
}

export async function removeServerCartItem(
  userId: string,
  productId: string,
  size: string,
  color: string
): Promise<{ error: unknown }> {
  const supabase = createClient();

  const variantId = await resolveVariantId(supabase, productId, size, color);
  if (!variantId) return { error: null }; // already gone / never existed

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('variant_id', variantId);

  return { error };
}

export async function clearServerCart(userId: string): Promise<{ error: unknown }> {
  const supabase = createClient();
  const { error } = await supabase.from('cart_items').delete().eq('user_id', userId);
  return { error };
}

/**
 * Merge a guest (localStorage) cart into the signed-in user's server
 * cart. Quantities are summed per variant, then clamped to live
 * stock — never dropped silently — so a guest who added 3 of an item
 * that's down to 2 in stock ends up with 2, not 0 and not a hard
 * failure. Lines whose variant can no longer be resolved (deleted or
 * deactivated product) are skipped.
 */
export async function mergeGuestCartIntoServer(
  userId: string,
  guestLines: GuestCartLine[]
): Promise<{ error: unknown }> {
  if (guestLines.length === 0) return { error: null };

  const supabase = createClient();

  const { data: existing } = await supabase
    .from('cart_items')
    .select('variant_id, quantity')
    .eq('user_id', userId);

  const existingByVariant = new Map(
    ((existing ?? []) as Pick<DbCartItem, 'variant_id' | 'quantity'>[]).map((row) => [
      row.variant_id,
      row.quantity,
    ])
  );

  for (const line of guestLines) {
    const variantId = await resolveVariantId(supabase, line.productId, line.size, line.color);
    if (!variantId) continue;

    const { data: inventoryRows } = await supabase
      .from('inventory')
      .select('quantity, reserved')
      .eq('variant_id', variantId)
      .maybeSingle();

    const available = inventoryRows
      ? Math.max(inventoryRows.quantity - inventoryRows.reserved, 0)
      : 0;

    const currentServerQty = existingByVariant.get(variantId) ?? 0;
    const mergedQty = Math.min(currentServerQty + line.quantity, Math.max(available, 0));

    if (mergedQty <= 0) continue;

    await supabase
      .from('cart_items')
      .upsert(
        { user_id: userId, variant_id: variantId, quantity: mergedQty },
        { onConflict: 'user_id,variant_id' }
      );
  }

  return { error: null };
}