/* ============================================
   EIFA COUTURE — Catalog helpers (pure, client + server safe)
   ============================================
   Category slugs are created by the admin, so the storefront never
   hard-codes them. "Women" / "Men" are resolved from whatever
   categories exist by name/slug, and a category filter always
   includes its sub-categories.
   ============================================ */

import type { Category } from '@/types';

export type Audience = 'women' | 'men';

const AUDIENCE_PATTERNS: Record<Audience, RegExp> = {
  // Checked against "slug name". `women` must be tested before `men`
  // because "women" contains "men".
  women: /\b(women|womens|woman|ladies|lady|her|female|girls?)\b/i,
  men: /\b(men|mens|man|gents|him|male|boys?)\b/i,
};

function normalise(category: Category) {
  return `${category.slug.replace(/-/g, ' ')} ${category.name.replace(/['’]/g, '')}`;
}

export function isAudience(value: string | null): value is Audience {
  return value === 'women' || value === 'men';
}

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

/** Top-level categories that belong to an audience (women / men). */
export function getAudienceRootSlugs(categories: Category[], audience: Audience): string[] {
  return categories
    .filter((category) => {
      const text = normalise(category);
      if (audience === 'men' && AUDIENCE_PATTERNS.women.test(text)) return false;
      return AUDIENCE_PATTERNS[audience].test(text);
    })
    .map((category) => category.slug);
}

export function getAudienceSlugs(categories: Category[], audience: Audience): Set<string> {
  return expandCategorySlugs(categories, getAudienceRootSlugs(categories, audience));
}

export const AUDIENCE_LABELS: Record<Audience, string> = {
  women: "Women's Collection",
  men: "Men's Collection",
};
