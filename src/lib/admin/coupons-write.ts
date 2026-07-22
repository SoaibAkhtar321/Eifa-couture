/* ============================================
   EIFA COUTURE — Admin Coupon Data Access (browser writes)
   ============================================
   Mirrors lib/admin/categories-write.ts / banners-write.ts: uses the
   BROWSER client so it can be called from Client Component forms, and
   relies on RLS (`is_admin()`, see supabase/migrations/0005_rls_policies.sql)
   as the actual security boundary. `coupons` has no `deleted_at` column
   (see supabase/migrations/0003_commerce_tables.sql), so deletes here
   are hard deletes — matching deleteBanner for the same reason.
   ============================================ */

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { CouponType, DbCoupon } from '@/types/database';

export async function isCouponCodeTaken(code: string, excludeCouponId?: string): Promise<boolean> {
  const supabase = createBrowserClient();

  let query = supabase.from('coupons').select('id').eq('code', code);
  if (excludeCouponId) {
    query = query.neq('id', excludeCouponId);
  }

  const { data } = await query.limit(1);
  return (data?.length ?? 0) > 0;
}

export interface CouponInput {
  code: string;
  type: CouponType;
  value: number;
  min_order: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  per_user_limit: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
}

export async function createCoupon(input: CouponInput): Promise<{
  data: DbCoupon | null;
  error: string | null;
}> {
  const supabase = createBrowserClient();

  if (await isCouponCodeTaken(input.code)) {
    return { data: null, error: 'That code is already in use by another coupon.' };
  }

  const { data, error } = await supabase
    .from('coupons')
    .insert({ ...input, starts_at: input.starts_at ?? new Date().toISOString() })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as DbCoupon, error: null };
}

export async function updateCoupon(
  id: string,
  input: CouponInput
): Promise<{ data: DbCoupon | null; error: string | null }> {
  const supabase = createBrowserClient();

  if (await isCouponCodeTaken(input.code, id)) {
    return { data: null, error: 'That code is already in use by another coupon.' };
  }

  const { data, error } = await supabase
    .from('coupons')
    .update({ ...input, starts_at: input.starts_at ?? new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as DbCoupon, error: null };
}

/**
 * Quick enable/disable toggle for the list page — updates just
 * `is_active` without touching the rest of the row.
 */
export async function setCouponActive(id: string, isActive: boolean): Promise<{ error: string | null }> {
  const supabase = createBrowserClient();
  const { error } = await supabase.from('coupons').update({ is_active: isActive }).eq('id', id);
  return { error: error?.message ?? null };
}

/**
 * Blocked if the coupon has already been redeemed at least once —
 * orders reference it via `coupon_id` (ON DELETE SET NULL), so a hard
 * delete wouldn't corrupt past orders, but silently erasing the
 * record of a promotion that already ran would make reporting on it
 * impossible. Deactivate instead in that case.
 */
export async function deleteCoupon(id: string): Promise<{ error: string | null }> {
  const supabase = createBrowserClient();

  const { data: coupon } = await supabase.from('coupons').select('used_count').eq('id', id).single();
  if (coupon && (coupon as { used_count: number }).used_count > 0) {
    return { error: 'Cannot delete — this coupon has already been redeemed. Deactivate it instead.' };
  }

  const { error } = await supabase.from('coupons').delete().eq('id', id);
  return { error: error?.message ?? null };
}
