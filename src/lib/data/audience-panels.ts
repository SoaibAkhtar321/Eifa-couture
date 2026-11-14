import { cache } from 'react';

import { getCachedStoreSettings } from '@/lib/data/storefront-cache';
import type { Audience } from '@/lib/catalog';

export type AudiencePanelImages = Record<Audience, string | null>;

/**
 * Admin-set lead images for the Women / Men / Accessories panels (a null
 * entry means "use the built-in default"). Cached per request so the hero,
 * the audience sections and the audience pages share one query. Never
 * throws: if the settings row (or the Phase 7 columns) can't be read, the
 * defaults are used.
 */
export const getAudiencePanelImages = cache(async (): Promise<AudiencePanelImages> => {
  const empty: AudiencePanelImages = { women: null, men: null, accessories: null };
  try {
    const data = await getCachedStoreSettings();
    const row = data as unknown as Record<string, unknown> | null;
    const pick = (key: string) => {
      const value = row?.[key];
      return typeof value === 'string' && value.trim() !== '' ? value : null;
    };
    return {
      women: pick('panel_image_women'),
      men: pick('panel_image_men'),
      accessories: pick('panel_image_accessories'),
    };
  } catch {
    return empty;
  }
});

export async function getAudiencePanelImage(audience: Audience): Promise<string | null> {
  return (await getAudiencePanelImages())[audience];
}
