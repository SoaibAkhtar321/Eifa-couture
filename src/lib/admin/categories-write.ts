/* ============================================
   EIFA COUTURE — Admin Category Data Access (browser writes)
   ============================================
   Mirrors lib/admin/products-write.ts: uses the BROWSER client so it
   can be called from Client Component forms, and relies on RLS
   (`is_admin()`, see supabase/migrations/0005_rls_policies.sql) as
   the actual security boundary. Deletes are soft (deleted_at) so a
   category can't disappear out from under products that still
   reference it via category_id.
   ============================================ */

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { generateSlug } from '@/lib/utils';
import type { DbCategory } from '@/types/database';

export async function isCategorySlugTaken(slug: string, excludeCategoryId?: string): Promise<boolean> {
  const supabase = createBrowserClient();

  let query = supabase.from('categories').select('id').eq('slug', slug).is('deleted_at', null);
  if (excludeCategoryId) {
    query = query.neq('id', excludeCategoryId);
  }

  const { data } = await query.limit(1);
  return (data?.length ?? 0) > 0;
}

export async function generateUniqueCategorySlug(name: string, excludeCategoryId?: string): Promise<string> {
  const base = generateSlug(name);
  let candidate = base;
  let suffix = 2;

  while (await isCategorySlugTaken(candidate, excludeCategoryId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export interface CategoryInput {
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
}

export async function createCategory(input: CategoryInput): Promise<{
  data: DbCategory | null;
  error: string | null;
}> {
  const supabase = createBrowserClient();

  if (await isCategorySlugTaken(input.slug)) {
    return { data: null, error: 'That slug is already in use by another category.' };
  }

  const { data, error } = await supabase.from('categories').insert(input).select().single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as DbCategory, error: null };
}

export async function updateCategory(
  id: string,
  input: CategoryInput
): Promise<{ data: DbCategory | null; error: string | null }> {
  const supabase = createBrowserClient();

  if (input.parent_id === id) {
    return { data: null, error: 'A category cannot be its own parent.' };
  }

  if (await isCategorySlugTaken(input.slug, id)) {
    return { data: null, error: 'That slug is already in use by another category.' };
  }

  const { data, error } = await supabase
    .from('categories')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as DbCategory, error: null };
}

/**
 * Soft-deletes a category. Products that reference it via category_id
 * keep the reference (the column is ON DELETE SET NULL only for a hard
 * delete, which we deliberately never do here) — the storefront/admin
 * category filters just stop listing it once deleted_at is set.
 */
export async function softDeleteCategory(id: string): Promise<{ error: string | null }> {
  const supabase = createBrowserClient();
  const { error } = await supabase
    .from('categories')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  return { error: error?.message ?? null };
}