/* ============================================
   EIFA COUTURE — Store Settings Data Access (server reads)
   ============================================
   Mirrors `lib/data/homepage-sections.ts`: a thin query function over
   a fixed-row table (see `supabase/migrations/0009_store_settings.sql`),
   shared between the admin Settings page and any future storefront
   reads (footer contact info, SEO defaults). Server-only (imports
   `lib/supabase/server.ts`, which pulls in `next/headers`) — only
   import from Server Components.
   ============================================ */

import { createClient as createServerClient } from '@/lib/supabase/server';
import type { DbStoreSettings } from '@/types/database';

export async function getStoreSettings(): Promise<{
  data: DbStoreSettings | null;
  error: string | null;
}> {
  const supabase = await createServerClient();

  const { data, error } = await supabase.from('store_settings').select('*').eq('singleton', true).single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as DbStoreSettings, error: null };
}
