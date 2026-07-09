'use client';

/* ============================================
   EIFA COUTURE — Wishlist Data Access
   ============================================
   Thin Supabase query layer for `wishlist_items`, mirroring the
   conventions in `lib/cart.ts`: no Supabase calls inside
   components/stores, only here.

   Unlike `cart_items`, `wishlist_items` is keyed by (user_id,
   product_id) directly — variant-agnostic on purpose (see migration
   0003) — so there's no variant resolution step needed here.
   ============================================ */

import { createClient } from '@/lib/supabase/client';
import type { DbWishlistItem } from '@/types/database';

/**
 * Fetch the signed-in user's server wishlist as a plain array of
 * product ids — matches the Zustand store's `items: string[]` shape,
 * so callers (the store, `WishlistSyncProvider`) need zero mapping.
 */
export async function fetchServerWishlist(userId: string): Promise<string[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('wishlist_items')
    .select('product_id')
    .eq('user_id', userId);

  if (error || !data) return [];

  return (data as Pick<DbWishlistItem, 'product_id'>[]).map((row) => row.product_id);
}

export async function addServerWishlistItem(
  userId: string,
  productId: string
): Promise<{ error: unknown }> {
  const supabase = createClient();

  const { error } = await supabase
    .from('wishlist_items')
    .upsert(
      { user_id: userId, product_id: productId },
      { onConflict: 'user_id,product_id' }
    );

  return { error };
}

export async function removeServerWishlistItem(
  userId: string,
  productId: string
): Promise<{ error: unknown }> {
  const supabase = createClient();

  const { error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);

  return { error };
}

export async function clearServerWishlist(userId: string): Promise<{ error: unknown }> {
  const supabase = createClient();
  const { error } = await supabase.from('wishlist_items').delete().eq('user_id', userId);
  return { error };
}

/**
 * Merge a guest (localStorage) wishlist into the signed-in user's
 * server wishlist. Upserts one row at a time (not a batch upsert) so
 * a single stale/deleted product id (FK violation against `products`)
 * only skips that one line instead of failing the whole merge —
 * matches the resilience of `mergeGuestCartIntoServer`.
 */
export async function mergeGuestWishlistIntoServer(
  userId: string,
  guestProductIds: string[]
): Promise<{ error: unknown }> {
  if (guestProductIds.length === 0) return { error: null };

  const supabase = createClient();
  const uniqueIds = Array.from(new Set(guestProductIds));

  for (const productId of uniqueIds) {
    await supabase
      .from('wishlist_items')
      .upsert(
        { user_id: userId, product_id: productId },
        { onConflict: 'user_id,product_id' }
      );
  }

  return { error: null };
}