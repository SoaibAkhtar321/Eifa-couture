/* ============================================
   EIFA COUTURE — Admin Collection Data Access (browser writes)
   ============================================
   Mirrors lib/admin/categories-write.ts: uses the BROWSER client so
   it can be called from Client Component forms, and relies on RLS
   (`is_admin()`) as the actual security boundary. Deletes are soft
   (deleted_at) elsewhere in the schema, but this file only covers
   create/update — collection deletion is a separate, not-yet-built
   milestone.

   `image_url` is deliberately never read or written here — image
   upload is out of scope for the create/edit form, so create leaves
   the column at its schema default and update never touches it,
   preserving whatever value (if any) is already set.
   ============================================ */

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { generateSlug } from '@/lib/utils';
import type { DbCollection } from '@/types/database';

export async function isCollectionSlugTaken(slug: string, excludeCollectionId?: string): Promise<boolean> {
  const supabase = createBrowserClient();

  let query = supabase.from('collections').select('id').eq('slug', slug).is('deleted_at', null);
  if (excludeCollectionId) {
    query = query.neq('id', excludeCollectionId);
  }

  const { data } = await query.limit(1);
  return (data?.length ?? 0) > 0;
}

export async function generateUniqueCollectionSlug(name: string, excludeCollectionId?: string): Promise<string> {
  const base = generateSlug(name);
  let candidate = base;
  let suffix = 2;

  while (await isCollectionSlugTaken(candidate, excludeCollectionId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export interface CollectionInput {
  name: string;
  slug: string;
  description: string;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
}

export async function createCollection(input: CollectionInput): Promise<{
  data: DbCollection | null;
  error: string | null;
}> {
  const supabase = createBrowserClient();

  if (await isCollectionSlugTaken(input.slug)) {
    return { data: null, error: 'That slug is already in use by another collection.' };
  }

  const { data, error } = await supabase.from('collections').insert(input).select().single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as DbCollection, error: null };
}

export async function updateCollection(
  id: string,
  input: CollectionInput
): Promise<{ data: DbCollection | null; error: string | null }> {
  const supabase = createBrowserClient();

  if (await isCollectionSlugTaken(input.slug, id)) {
    return { data: null, error: 'That slug is already in use by another collection.' };
  }

  const { data, error } = await supabase
    .from('collections')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as DbCollection, error: null };
}
