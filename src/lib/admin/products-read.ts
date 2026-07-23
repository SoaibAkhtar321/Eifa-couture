/* ============================================
   EIFA COUTURE — Admin Product Data Access (server reads)
   ============================================
   Sibling to `lib/data/products.ts`, not an extension of it — that
   file is shaped for the storefront (maps DB rows onto the UI-facing
   `Product` type, filters to `is_active` only, drops inactive
   variants). Admin needs raw DB rows, including inactive/unpublished
   ones, so this file talks to the tables directly.

   Reads (listProducts, getProduct) use the SERVER Supabase client,
   because `src/app/admin/products/page.tsx` is a Server Component
   reading `searchParams` directly for SSR pagination/filtering — same
   reasoning as `lib/admin/auth.ts`.

   This module is server-only (it imports `lib/supabase/server.ts`,
   which pulls in `next/headers`). It must never be imported from a
   Client Component for anything other than `import type` — see
   `lib/admin/products-write.ts` for the browser-client counterpart
   used by Client Component forms.
   ============================================ */

import { createClient as createServerClient } from '@/lib/supabase/server';
import type {
  DbProduct,
  DbProductImage,
  DbProductVariant,
  DbInventory,
} from '@/types/database';

/* ---------- List (Server Component read) ---------- */

export interface ProductListFilters {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  lowStockOnly?: boolean;
  sort?: 'newest' | 'updated' | 'name' | 'price';
  page?: number;
  pageSize?: number;
}

export interface ProductListRow extends DbProduct {
  category_name: string | null;
  primary_image_url: string | null;
  total_stock: number;
  variant_count: number;
}

export interface ProductListResult {
  rows: ProductListRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const SORT_COLUMNS: Record<NonNullable<ProductListFilters['sort']>, { column: string; ascending: boolean }> = {
  newest: { column: 'created_at', ascending: false },
  updated: { column: 'updated_at', ascending: false },
  name: { column: 'name', ascending: true },
  price: { column: 'price', ascending: true },
};

/**
 * Paginated/filtered/sorted product list for the admin table.
 * Category name, primary image, and stock totals are resolved via
 * nested selects rather than separate round-trips.
 */
export async function listProducts(filters: ProductListFilters = {}): Promise<{
  data: ProductListResult | null;
  error: string | null;
}> {
  const supabase = await createServerClient();

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const sort = SORT_COLUMNS[filters.sort ?? 'newest'];

  let query = supabase
    .from('products')
    .select(
      `
      *,
      category:categories(name),
      product_images(url, is_primary, variant_id),
      product_variants(id, is_active, inventory(quantity))
    `,
      { count: 'exact' }
    )
    .is('deleted_at', null);

  if (filters.search) {
    const term = filters.search.trim();
    query = query.or(`name.ilike.%${term}%,slug.ilike.%${term}%`);
  }
  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }
  if (filters.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }
  if (filters.isFeatured !== undefined) {
    query = query.eq('is_featured', filters.isFeatured);
  }

  query = query.order(sort.column, { ascending: sort.ascending }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  type RawRow = DbProduct & {
    category: { name: string } | null;
    product_images: { url: string; is_primary: boolean; variant_id: string | null }[];
    product_variants: { id: string; is_active: boolean; inventory: { quantity: number } | null }[];
  };

  let rows: ProductListRow[] = ((data ?? []) as unknown as RawRow[]).map((row) => {
    // Only the product-level gallery (variant_id is null) counts for the
    // list thumbnail — a variant's own primary image shouldn't stand in
    // for the product's, and both can be `is_primary = true` at once now.
    const productImages = row.product_images.filter((img) => !img.variant_id);
    const primaryImage = productImages.find((img) => img.is_primary) ?? productImages[0];
    const totalStock = row.product_variants.reduce((sum, v) => sum + (v.inventory?.quantity ?? 0), 0);

    return {
      ...row,
      category_name: row.category?.name ?? null,
      primary_image_url: primaryImage?.url ?? null,
      total_stock: totalStock,
      variant_count: row.product_variants.length,
    };
  });

  // low-stock filtering happens post-fetch since it depends on the
  // aggregated inventory total, not a column the query can filter on
  if (filters.lowStockOnly) {
    rows = rows.filter((row) => row.total_stock > 0 && row.total_stock <= 5);
  }

  return {
    data: { rows, totalCount: count ?? 0, page, pageSize },
    error: null,
  };
}

/* ---------- Single product (Server Component read) ---------- */

export interface ProductWithRelations extends DbProduct {
  product_images: DbProductImage[];
  product_variants: (DbProductVariant & { inventory: DbInventory | null })[];
}

export async function getProduct(id: string): Promise<{
  data: ProductWithRelations | null;
  error: string | null;
}> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      product_images(*),
      product_variants(*, inventory(*))
    `
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as unknown as ProductWithRelations, error: null };
}