/* ============================================
   EIFA COUTURE — Admin Category helpers (browser)
   ============================================
   Shared types plus the slug checks the form runs while the admin is
   typing. The actual writes (create / update / delete / reorder) live
   in categories-actions.ts (Server Actions) so every change is
   audit-logged and the storefront cache is refreshed. RLS
   (`is_admin()`) remains the real security boundary either way.

   Slug checks include soft-deleted rows: `categories.slug` is UNIQUE
   in the database, so a category deleted long ago can still block a
   web address.
   ============================================ */

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { generateSlug } from '@/lib/utils';
import type { ProductAudience } from '@/types/database';

export interface CategoryInput {
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  parent_id: string | null;
  audience: ProductAudience | null;
  sort_order: number;
  is_active: boolean;
}

export type SlugConflict = 'live' | 'deleted' | null;

/** Looks for another category (live OR soft-deleted) that already uses `slug`. */
export async function findCategorySlugConflict(slug: string, excludeCategoryId?: string): Promise<SlugConflict> {
  const supabase = createBrowserClient();

  let query = supabase.from('categories').select('id, deleted_at').eq('slug', slug);
  if (excludeCategoryId) {
    query = query.neq('id', excludeCategoryId);
  }

  const { data } = await query.limit(1);
  const row = (data ?? [])[0] as { id: string; deleted_at: string | null } | undefined;
  if (!row) return null;
  return row.deleted_at ? 'deleted' : 'live';
}

export function slugConflictMessage(conflict: Exclude<SlugConflict, null>): string {
  return conflict === 'deleted'
    ? 'This web address belongs to a category that was deleted earlier. Please choose a different one (for example add "-2").'
    : 'Another category already uses this web address. Please choose a different one.';
}

export async function isCategorySlugTaken(slug: string, excludeCategoryId?: string): Promise<boolean> {
  return (await findCategorySlugConflict(slug, excludeCategoryId)) !== null;
}

export async function generateUniqueCategorySlug(name: string, excludeCategoryId?: string): Promise<string> {
  const base = generateSlug(name);
  if (!base) return '';
  let candidate = base;
  let suffix = 2;

  while (await isCategorySlugTaken(candidate, excludeCategoryId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}
