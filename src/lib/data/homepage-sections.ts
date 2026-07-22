/* ============================================
   EIFA COUTURE — Homepage Section Data Access (server reads)
   ============================================
   Shared between the storefront homepage (`app/(storefront)/page.tsx`)
   and the admin Homepage CMS pages. Mirrors the categories.ts/
   collections.ts convention: thin query functions over the
   `homepage_sections` table (see
   supabase/migrations/0008_homepage_sections.sql).

   Server-only (imports `lib/supabase/server.ts`, which pulls in
   `next/headers`) — only import from Server Components.
   ============================================ */

import { createClient as createServerClient } from '@/lib/supabase/server';
import type { DbHomepageSection, HomepageSectionKey } from '@/types/database';

/**
 * All four fixed homepage sections, ordered by `sort_order`. Used by
 * the admin list page (shows every section regardless of active
 * state) and, filtered client-side, by the storefront homepage.
 */
export async function listHomepageSections(): Promise<{
  data: DbHomepageSection[] | null;
  error: string | null;
}> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('homepage_sections')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data ?? []) as DbHomepageSection[], error: null };
}

export async function getHomepageSection(id: string): Promise<{
  data: DbHomepageSection | null;
  error: string | null;
}> {
  const supabase = await createServerClient();

  const { data, error } = await supabase.from('homepage_sections').select('*').eq('id', id).single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as DbHomepageSection, error: null };
}

/**
 * Active sections keyed by `section_key`, for the storefront homepage
 * to look up per-section config (title/subtitle/limit/source) when
 * deciding what to pass into each existing section component. A
 * missing key (row deleted, or the query failing) means that section
 * falls back to its component's own defaults rather than disappearing.
 */
export async function getActiveHomepageSectionMap(): Promise<Record<HomepageSectionKey, DbHomepageSection | null>> {
  const { data } = await listHomepageSections();

  const map: Record<HomepageSectionKey, DbHomepageSection | null> = {
    featured_collection: null,
    new_arrivals: null,
    best_sellers: null,
    shop_by_category: null,
  };

  for (const section of data ?? []) {
    map[section.section_key] = section;
  }

  return map;
}
