'use server';

/* ============================================
   EIFA COUTURE — Admin Category Server Actions
   ============================================
   Every category change goes through here so that, in one place, we:
     1. confirm the caller is an admin (RLS is still the real boundary),
     2. write through the caller's own session (RLS applies),
     3. remove replaced / deleted images from Storage,
     4. write the audit log,
     5. refresh the storefront (footer cache + homepage + shop + audience
        pages) so the change is visible immediately.
   ============================================ */

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';

import { logAdminAction } from '@/lib/admin/audit-log';
import { categoryImagePathFromUrl, CATEGORY_IMAGE_BUCKET } from '@/lib/admin/category-images';
import type { CategoryInput } from '@/lib/admin/categories-write';
import { categoryFormSchema } from '@/lib/admin/validation';
import { createClient } from '@/lib/supabase/server';
import type { DbCategory, UserRole } from '@/types/database';

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

async function getAdminClient(): Promise<{ supabase: SupabaseServer } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Please sign in again.' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = (profile as { role: UserRole } | null)?.role;
  if (role !== 'admin' && role !== 'superadmin') return { error: 'Only admins can manage categories.' };

  return { supabase };
}

/** Makes every storefront surface that shows categories pick up the change now. */
function refreshStorefront() {
  // Footer links + other cached storefront reads (unstable_cache, 60s).
  revalidateTag('storefront-content', { expire: 0 });
  for (const path of ['/', '/shop', '/women', '/men', '/accessories']) {
    revalidatePath(path);
  }
  revalidatePath('/', 'layout'); // header / footer live in the shared layout
  revalidatePath('/admin/categories');
}

async function removeImageFile(supabase: SupabaseServer, url: string | null | undefined) {
  const path = categoryImagePathFromUrl(url);
  if (!path) return;
  // Best-effort: a leftover file is harmless, a failed save is not.
  await supabase.storage.from(CATEGORY_IMAGE_BUCKET).remove([path]);
}

export interface ActionResult {
  error: string | null;
  fieldErrors?: Record<string, string>;
}

/* ---------------- create / update ---------------- */

const saveSchema = z.object({
  id: z.string().uuid(),
  isNew: z.boolean(),
  values: categoryFormSchema,
});

export async function saveCategoryAction(raw: {
  id: string;
  isNew: boolean;
  values: CategoryInput;
}): Promise<ActionResult> {
  const guard = await getAdminClient();
  if ('error' in guard) return { error: guard.error };
  const { supabase } = guard;

  const parsed = saveSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0] === 'values' ? String(issue.path[1] ?? 'form') : 'form';
      fieldErrors[key] = issue.message;
    });
    return { error: 'Please check the highlighted fields.', fieldErrors };
  }

  const { id, isNew, values } = parsed.data;

  // Web address must be unique, soft-deleted rows included (DB UNIQUE).
  const { data: slugRows } = await supabase
    .from('categories')
    .select('id, deleted_at')
    .eq('slug', values.slug)
    .neq('id', id)
    .limit(1);
  const slugRow = ((slugRows ?? []) as { id: string; deleted_at: string | null }[])[0];
  if (slugRow) {
    return {
      error: 'That web address is already in use.',
      fieldErrors: {
        slug: slugRow.deleted_at
          ? 'This web address belongs to a category that was deleted earlier. Please choose a different one.'
          : 'Another category already uses this web address. Please choose a different one.',
      },
    };
  }

  // Parent rules: top-level only, never itself, and a category that already
  // has sub-categories must stay top-level (the storefront shows two levels).
  if (values.parent_id) {
    if (values.parent_id === id) {
      return { error: null, fieldErrors: { parent_id: 'A category cannot be inside itself.' } };
    }
    const { data: parent } = await supabase
      .from('categories')
      .select('id, parent_id')
      .eq('id', values.parent_id)
      .is('deleted_at', null)
      .maybeSingle();
    if (!parent) {
      return { error: null, fieldErrors: { parent_id: 'The chosen parent category no longer exists.' } };
    }
    if ((parent as { parent_id: string | null }).parent_id) {
      return { error: null, fieldErrors: { parent_id: 'Choose a top-level category as the parent.' } };
    }
    if (!isNew) {
      const { count } = await supabase
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .eq('parent_id', id)
        .is('deleted_at', null);
      if ((count ?? 0) > 0) {
        return {
          error: null,
          fieldErrors: { parent_id: 'This category has sub-categories of its own, so it has to stay top-level.' },
        };
      }
    }
  }

  let previousImageUrl: string | null = null;

  if (isNew) {
    const { error } = await supabase.from('categories').insert({ id, ...values });
    if (error) return mapDbError(error);
  } else {
    const { data: existing } = await supabase
      .from('categories')
      .select('image_url')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (!existing) return { error: 'This category no longer exists.' };
    previousImageUrl = (existing as Pick<DbCategory, 'image_url'>).image_url;

    const { error } = await supabase.from('categories').update(values).eq('id', id);
    if (error) return mapDbError(error);
  }

  // Old file is no longer used: remove it from Storage.
  if (previousImageUrl && previousImageUrl !== values.image_url) {
    await removeImageFile(supabase, previousImageUrl);
  }

  await logAdminAction({
    action: isNew ? 'create' : 'update',
    entityType: 'category',
    entityId: id,
    entityLabel: values.name,
    detail: isNew ? 'Category created' : 'Category updated',
  });

  refreshStorefront();
  return { error: null };
}

function mapDbError(error: { code?: string; message: string }): ActionResult {
  if (error.code === '23505') {
    return {
      error: 'That web address is already in use.',
      fieldErrors: { slug: 'Another category already uses this web address. Please choose a different one.' },
    };
  }
  if (error.code === '42501') {
    return { error: 'You do not have permission to change categories.' };
  }
  return { error: error.message };
}

/* ---------------- delete ---------------- */

export interface CategoryDeleteImpact {
  name: string;
  productCount: number;
  children: { id: string; name: string; productCount: number }[];
}

export async function getCategoryDeleteImpactAction(
  id: string
): Promise<{ data: CategoryDeleteImpact | null; error: string | null }> {
  const guard = await getAdminClient();
  if ('error' in guard) return { data: null, error: guard.error };
  const { supabase } = guard;

  const [{ data: category }, { data: children }] = await Promise.all([
    supabase.from('categories').select('id, name').eq('id', id).is('deleted_at', null).maybeSingle(),
    supabase.from('categories').select('id, name').eq('parent_id', id).is('deleted_at', null).order('sort_order'),
  ]);

  if (!category) return { data: null, error: 'This category no longer exists.' };

  const childRows = (children ?? []) as { id: string; name: string }[];
  const { data: counts, error } = await supabase.rpc('admin_category_product_counts');
  if (error) return { data: null, error: error.message };

  const countById = new Map(
    ((counts ?? []) as { category_id: string; product_count: number }[]).map((row) => [
      row.category_id,
      Number(row.product_count),
    ])
  );

  return {
    data: {
      name: (category as { name: string }).name,
      productCount: countById.get(id) ?? 0,
      children: childRows.map((child) => ({
        id: child.id,
        name: child.name,
        productCount: countById.get(child.id) ?? 0,
      })),
    },
    error: null,
  };
}

export async function deleteCategoryAction(input: {
  id: string;
  moveProductsTo: string | null;
  moveChildrenTo: string | null;
}): Promise<ActionResult> {
  const guard = await getAdminClient();
  if ('error' in guard) return { error: guard.error };
  const { supabase } = guard;

  if (!z.string().uuid().safeParse(input.id).success) return { error: 'Invalid category.' };

  const { data, error } = await supabase.rpc('admin_delete_category', {
    p_id: input.id,
    p_move_products_to: input.moveProductsTo,
    p_children_to: input.moveChildrenTo,
  });

  if (error) return { error: error.message };

  const result = data as {
    name: string;
    old_image_url: string | null;
    products_moved: number;
    children_moved: number;
  };

  await removeImageFile(supabase, result.old_image_url);

  await logAdminAction({
    action: 'delete',
    entityType: 'category',
    entityId: input.id,
    entityLabel: result.name,
    detail: `Deleted; ${result.products_moved} product(s) and ${result.children_moved} sub-categor${
      result.children_moved === 1 ? 'y' : 'ies'
    } moved`,
    metadata: {
      moveProductsTo: input.moveProductsTo,
      moveChildrenTo: input.moveChildrenTo,
    },
  });

  refreshStorefront();
  return { error: null };
}

/* ---------------- reorder ---------------- */

export async function reorderCategoriesAction(orderedIds: string[], parentLabel: string): Promise<ActionResult> {
  const guard = await getAdminClient();
  if ('error' in guard) return { error: guard.error };
  const { supabase } = guard;

  if (!z.array(z.string().uuid()).min(1).max(500).safeParse(orderedIds).success) {
    return { error: 'Invalid order.' };
  }

  const { error } = await supabase.rpc('admin_reorder_categories', { p_ids: orderedIds });
  if (error) return { error: error.message };

  await logAdminAction({
    action: 'update',
    entityType: 'category',
    entityLabel: parentLabel,
    detail: 'Display order changed',
  });

  refreshStorefront();
  return { error: null };
}
