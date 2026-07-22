/* ============================================
   EIFA COUTURE — Admin Banner Data Access (browser writes)
   ============================================
   Mirrors lib/admin/categories-write.ts / collections-write.ts: uses
   the BROWSER client so it can be called from Client Component forms,
   and relies on RLS (`is_admin()`, see
   supabase/migrations/0005_rls_policies.sql) as the actual security
   boundary.

   `banners` has no `deleted_at` column (unlike categories/products),
   so deletes here are hard deletes — matching `deleteVariant` in
   lib/admin/products-write.ts for the same reason. The banner's
   Storage images are cleaned up alongside the row by the caller (see
   BannerTable.tsx), same division of labor as deleteProductImage.
   ============================================ */

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { DbBanner } from '@/types/database';

export interface BannerInput {
  id?: string;
  title: string;
  subtitle: string;
  image_url: string;
  mobile_image_url: string | null;
  link_url: string | null;
  cta_label: string | null;
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

export async function createBanner(input: BannerInput): Promise<{
  data: DbBanner | null;
  error: string | null;
}> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase.from('banners').insert(input).select().single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as DbBanner, error: null };
}

export async function updateBanner(
  id: string,
  input: BannerInput
): Promise<{ data: DbBanner | null; error: string | null }> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase.from('banners').update(input).eq('id', id).select().single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as DbBanner, error: null };
}

/**
 * Quick enable/disable toggle for the list page — updates just
 * `is_active` without touching the rest of the row.
 */
export async function setBannerActive(id: string, isActive: boolean): Promise<{ error: string | null }> {
  const supabase = createBrowserClient();
  const { error } = await supabase.from('banners').update({ is_active: isActive }).eq('id', id);
  return { error: error?.message ?? null };
}

/**
 * Persists a new sort order after inline edits on the list page.
 */
export async function setBannerSortOrder(id: string, sortOrder: number): Promise<{ error: string | null }> {
  const supabase = createBrowserClient();
  const { error } = await supabase.from('banners').update({ sort_order: sortOrder }).eq('id', id);
  return { error: error?.message ?? null };
}

export async function deleteBanner(id: string): Promise<{ error: string | null }> {
  const supabase = createBrowserClient();
  const { error } = await supabase.from('banners').delete().eq('id', id);
  return { error: error?.message ?? null };
}
