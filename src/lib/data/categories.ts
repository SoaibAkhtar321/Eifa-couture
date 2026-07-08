/* ============================================
   EIFA COUTURE — Category Data Access
   ============================================
   Shared Supabase query layer for the `categories` table, mapped onto
   the existing UI-facing `Category` shape (types/index.ts). See
   products.ts for the reasoning behind this pattern.
   ============================================ */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Category } from '@/types';
import type { DbCategory } from '@/types/database';

const CATEGORY_PLACEHOLDER_IMAGES: Record<string, string> = {
  'womens-kurtas': '/images/categories/kurtas.png',
  'mens-kurtas': '/images/categories/men-kurtas.png',
  anarkalis: '/images/categories/anarkali.png',
  dupattas: '/images/categories/dupattas.png',
  sarees: '/images/categories/sarees.png',
  'palazzo-sets': '/images/categories/palazzo.png',
  'bridal-collection': '/images/categories/bridal.png',
  accessories: '/images/categories/dupattas.png',
  'crochet-bags': '/images/categories/dupattas.png',
};
const DEFAULT_PLACEHOLDER_IMAGE = '/images/categories/kurtas.png';

function mapCategoryRow(row: DbCategory): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    image:
      row.image_url ??
      CATEGORY_PLACEHOLDER_IMAGES[row.slug] ??
      DEFAULT_PLACEHOLDER_IMAGE,
    parentId: row.parent_id,
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
