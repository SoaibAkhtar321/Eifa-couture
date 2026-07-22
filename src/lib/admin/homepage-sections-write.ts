/* ============================================
   EIFA COUTURE — Admin Homepage Section Data Access (browser writes)
   ============================================
   Mirrors lib/admin/collections-write.ts: uses the BROWSER client so
   it can be called from the Client Component edit form, and relies on
   RLS (`is_admin()`) as the actual security boundary. Rows are fixed
   (one per section_key, seeded by the migration) — this module only
   ever updates, never inserts/deletes.
   ============================================ */

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { DbHomepageSection } from '@/types/database';

export interface HomepageSectionInput {
  title: string | null;
  subtitle: string | null;
  is_active: boolean;
  sort_order: number;
  item_limit: number;
  source_collection_id: string | null;
}

export async function updateHomepageSection(
  id: string,
  input: HomepageSectionInput
): Promise<{ data: DbHomepageSection | null; error: string | null }> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from('homepage_sections')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as DbHomepageSection, error: null };
}
