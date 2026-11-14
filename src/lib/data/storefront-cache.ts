/* ============================================
   EIFA COUTURE — Cached public storefront reads
   ============================================
   Footer, hero banner, homepage section config and store settings are the
   same for every visitor but were re-queried from Supabase on every single
   page view. These wrappers cache them for CACHE_SECONDS, which removes
   several database round-trips from each navigation.

   Trade-off: edits made in the admin panel (banner, homepage sections,
   settings, categories) appear on the storefront within CACHE_SECONDS.
   ============================================ */

import { unstable_cache } from 'next/cache';

import { createPublicClient } from '@/lib/supabase/public';
import { fetchActiveCategories } from '@/lib/data/categories';
import type { Category } from '@/types';
import type { DbBanner, DbHomepageSection, DbStoreSettings, HomepageSectionKey } from '@/types/database';

const CACHE_SECONDS = 60;
const options = { revalidate: CACHE_SECONDS, tags: ['storefront-content'] };

export const getCachedCategories = unstable_cache(
  async (): Promise<Category[]> => fetchActiveCategories(createPublicClient()),
  ['storefront-categories'],
  options
);

export const getCachedStoreSettings = unstable_cache(
  async (): Promise<DbStoreSettings | null> => {
    const { data, error } = await createPublicClient()
      .from('store_settings')
      .select('*')
      .eq('singleton', true)
      .single();
    if (error) return null;
    return data as DbStoreSettings;
  },
  ['storefront-store-settings'],
  options
);

export const getCachedHeroBanner = unstable_cache(
  async (): Promise<DbBanner | null> => {
    const now = new Date().toISOString();
    const { data, error } = await createPublicClient()
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return data as DbBanner;
  },
  ['storefront-hero-banner'],
  options
);

export const getCachedHomepageSectionMap = unstable_cache(
  async (): Promise<Record<HomepageSectionKey, DbHomepageSection | null>> => {
    const map: Record<HomepageSectionKey, DbHomepageSection | null> = {
      featured_collection: null,
      new_arrivals: null,
      best_sellers: null,
      shop_by_category: null,
    };
    const { data } = await createPublicClient()
      .from('homepage_sections')
      .select('*')
      .order('sort_order', { ascending: true });
    for (const section of (data ?? []) as DbHomepageSection[]) {
      map[section.section_key] = section;
    }
    return map;
  },
  ['storefront-homepage-sections'],
  options
);
