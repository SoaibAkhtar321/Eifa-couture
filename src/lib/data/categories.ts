/* ============================================
   EIFA COUTURE — Category Data Access
   ============================================
   Shared Supabase query layer for the `categories` table, mapped onto
   the existing UI-facing `Category` shape (types/index.ts). See
   products.ts for the reasoning behind this pattern.
   ============================================ */

import { getKnownCategoryImage } from '@/lib/utils';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Category } from '@/types';
import type { DbCategory } from '@/types/database';


function mapCategoryRow(row: DbCategory): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    // Uploaded image first; the seeded categories keep their bundled
    // picture; everything else is '' and renders the neutral placeholder
    // (see CategoryImage). The latest-product-photo step sits between
    // the two in fetchActiveCategoriesWithImages.
    image: row.image_url ?? getKnownCategoryImage(row.slug) ?? '',
    parentId: row.parent_id,
    audience: row.audience ?? null,
    isActive: row.is_active,
    order: row.sort_order,
  };
}

export async function fetchActiveCategories(
  supabase: SupabaseClient
): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  if (error || !data) return [];
  return (data as DbCategory[]).map(mapCategoryRow);
}

export async function fetchCategoryBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) return null;
  return mapCategoryRow(data as DbCategory);
}

/**
 * Active categories with a guaranteed REAL image: the admin-uploaded
 * category image first, otherwise the newest product photo in that
 * category (or its sub-categories), and only then the neutral
 * placeholder (an empty `image`, drawn by CategoryImage). Keeps homepage and audience tiles relevant without the
 * admin having to upload a picture for every category.
 */
export async function fetchActiveCategoriesWithImages(
  supabase: SupabaseClient
): Promise<Category[]> {
  const [categories, productResult] = await Promise.all([
    fetchActiveCategories(supabase),
    supabase
      .from('products')
      .select('category_id, product_images ( url, is_primary, sort_order, variant_id )')
      .eq('is_active', true)
      .is('deleted_at', null)
      .not('category_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(300),
  ]);

  type Row = {
    category_id: string;
    product_images: { url: string; is_primary: boolean; sort_order: number; variant_id: string | null }[];
  };

  // Newest product image per category id.
  const latestByCategory = new Map<string, string>();
  for (const row of (productResult.data ?? []) as unknown as Row[]) {
    if (latestByCategory.has(row.category_id)) continue;
    const image = (row.product_images ?? [])
      .filter((img) => !img.variant_id)
      .sort((a, b) => (a.is_primary === b.is_primary ? a.sort_order - b.sort_order : a.is_primary ? -1 : 1))[0];
    if (image) latestByCategory.set(row.category_id, image.url);
  }

  // Rows that have an uploaded image keep it; the rest fall back.
  const { data: imageRows } = await supabase
    .from('categories')
    .select('id, image_url')
    .eq('is_active', true)
    .is('deleted_at', null);
  const uploaded = new Set(
    ((imageRows ?? []) as { id: string; image_url: string | null }[])
      .filter((row) => !!row.image_url)
      .map((row) => row.id)
  );

  const childrenOf = new Map<string, Category[]>();
  for (const category of categories) {
    if (!category.parentId) continue;
    childrenOf.set(category.parentId, [...(childrenOf.get(category.parentId) ?? []), category]);
  }

  return categories.map((category) => {
    if (uploaded.has(category.id)) return category;
    const own = latestByCategory.get(category.id);
    const fromChild = (childrenOf.get(category.id) ?? [])
      .map((child) => latestByCategory.get(child.id))
      .find(Boolean);
    const image = own ?? fromChild;
    return image ? { ...category, image } : category;
  });
}
