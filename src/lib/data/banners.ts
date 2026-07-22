/* ============================================
   EIFA COUTURE — Banner Data Access (server reads)
   ============================================
   Mirrors the categories.ts/homepage-sections.ts convention: thin
   query functions over the `banners` table (see
   supabase/migrations/0004_content_and_reviews.sql).

   Server-only (imports `lib/supabase/server.ts`, which pulls in
   `next/headers`) — only import from Server Components.
   ============================================ */

import { createClient as createServerClient } from '@/lib/supabase/server';
import type { DbBanner } from '@/types/database';

/**
 * All banners, ordered by `sort_order`. Used by the admin list page,
 * which — unlike the storefront — needs to show inactive/scheduled
 * banners too.
 */
export async function listBanners(): Promise<{
  data: DbBanner[] | null;
  error: string | null;
}> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data ?? []) as DbBanner[], error: null };
}

export async function getBanner(id: string): Promise<{
  data: DbBanner | null;
  error: string | null;
}> {
  const supabase = await createServerClient();

  const { data, error } = await supabase.from('banners').select('*').eq('id', id).single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as DbBanner, error: null };
}
