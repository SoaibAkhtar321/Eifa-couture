/* ============================================
   EIFA COUTURE — Admin Store Settings Data Access (browser writes)
   ============================================
   Mirrors `lib/admin/homepage-sections-write.ts`: uses the BROWSER
   client so it can be called from the Client Component settings
   form, and relies on RLS (`is_admin()`) as the actual security
   boundary. The row is fixed (`singleton = true`, seeded by the
   migration) — this module only ever updates, never inserts/deletes.
   ============================================ */

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { DbStoreSettings } from '@/types/database';

export interface StoreSettingsInput {
  store_name: string;
  store_email: string | null;
  store_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  address_city: string | null;
  address_state: string | null;
  address_pincode: string | null;
  address_country: string;
  business_legal_name: string | null;
  business_registration_no: string | null;
  gstin: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  social_instagram_url: string | null;
  social_facebook_url: string | null;
  social_pinterest_url: string | null;
  social_youtube_url: string | null;
  social_twitter_url: string | null;
  seo_default_title: string | null;
  seo_default_description: string | null;
  currency_code: string;
  currency_symbol: string;
  shipping_flat_rate: number;
  shipping_free_threshold: number | null;
  shipping_processing_days: number;
  tax_gst_percent: number;
  tax_prices_inclusive: boolean;
}

export async function updateStoreSettings(
  input: StoreSettingsInput
): Promise<{ data: DbStoreSettings | null; error: string | null }> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from('store_settings')
    .update(input)
    .eq('singleton', true)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as DbStoreSettings, error: null };
}
