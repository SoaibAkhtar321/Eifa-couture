/* ============================================
   EIFA COUTURE — Public (cookie-less) Supabase client
   ============================================
   Anonymous client for reading PUBLIC storefront content (categories,
   store settings, banners, homepage sections). It never touches
   `cookies()`, so results can safely live in `unstable_cache` and be
   shared between visitors. Do NOT use it for anything user-specific.
   ============================================ */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createPublicClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
