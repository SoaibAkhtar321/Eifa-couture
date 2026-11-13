/* ============================================
   EIFA COUTURE — Catalog helpers (pure, client + server safe)
   ============================================
   Audience (women / men / accessories) is REAL DATA now: it is stored
   on `products.audience` and `categories.audience`. Nothing is guessed
   from category names any more, so a product can only ever appear in
   the one audience it was assigned to.
   ============================================ */

import type { Category } from '@/types';

export type Audience = 'women' | 'men' | 'accessories';

export const AUDIENCES: readonly Audience[] = ['women', 'men', 'accessories'];

export function isAudience(value: string | null | undefined): value is Audience {
  return value === 'women' || value === 'men' || value === 'accessories';
}

export const AUDIENCE_LABELS: Record<Audience, string> = {
  women: "Women's Collection",
  men: "Men's Collection",
  accessories: 'Accessories',
};

/** Plain-language labels used by the admin forms. */
export const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
  { value: 'women', label: 'Women' },
  { value: 'men', label: 'Men' },
  { value: 'accessories', label: 'Accessories' },
];

/** Slugs of `rootSlugs` plus every descendant category. */
export function expandCategorySlugs(categories: Category[], rootSlugs: string[]): Set<string> {
  const result = new Set(rootSlugs);
  const idsInSet = new Set(categories.filter((c) => result.has(c.slug)).map((c) => c.id));

  let added = true;
  while (added) {
    added = false;
    for (const category of categories) {
      if (category.parentId && idsInSet.has(category.parentId) && !idsInSet.has(category.id)) {
        idsInSet.add(category.id);
        result.add(category.slug);
        added = true;
      }
    }
  }

  return result;
}

/** Categories that belong to exactly this audience (strict match). */
export function getAudienceCategories<T extends { audience: Audience | null }>(
  categories: T[],
  audience: Audience
): T[] {
  return categories.filter((category) => category.audience === audience);
}

/** Top-level categories of an audience (used for homepage rails). */
export function getAudienceRootCategories(categories: Category[], audience: Audience): Category[] {
  return categories.filter((category) => !category.parentId && category.audience === audience);
}
