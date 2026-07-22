/* ============================================
   EIFA COUTURE — Admin Inventory Data Access (server reads)
   ============================================
   Sibling to lib/admin/products-read.ts, at variant granularity
   instead of product granularity. Reads use the SERVER Supabase
   client since `src/app/admin/inventory/page.tsx` is a Server
   Component reading `searchParams` directly for SSR
   pagination/filtering — same reasoning as products-read.ts.

   `low_stock_at` is a per-row threshold (not a fixed constant), so
   "low stock" can't be expressed as a single PostgREST column filter
   (it's a column-vs-column comparison). Mirrors the
   `lowStockOnly`/post-fetch approach already used in
   lib/admin/products-read.ts: fetch every non-deleted variant once,
   then search/filter/sort/paginate in JS. Inventory lists are bounded
   by catalog size, not order volume, so this stays cheap.

   Server-only (imports `lib/supabase/server.ts`) — do not import from
   Client Components.
   ============================================ */

import { createClient as createServerClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface InventoryListRow {
  variant_id: string;
  inventory_id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  product_image_url: string | null;
  sku: string;
  size: string;
  color_name: string;
  quantity: number;
  reserved: number;
  low_stock_at: number;
  is_active: boolean;
  updated_at: string;
}

export interface InventoryListFilters {
  search?: string;
  stockFilter?: 'low' | 'out';
  sort?: 'stock_asc' | 'stock_desc' | 'name' | 'updated';
  page?: number;
  pageSize?: number;
}

export interface InventoryListResult {
  rows: InventoryListRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface InventorySummary {
  totalVariants: number;
  totalUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
}

type RawVariantRow = {
  id: string;
  sku: string;
  size: string;
  color_name: string;
  is_active: boolean;
  product: {
    id: string;
    name: string;
    slug: string;
    deleted_at: string | null;
    product_images: { url: string; is_primary: boolean }[];
  } | null;
  inventory: { id: string; quantity: number; reserved: number; low_stock_at: number; updated_at: string } | null;
};

/**
 * Every variant with tracked inventory, for a non-deleted product.
 * Shared by `listInventory` (which filters/sorts/paginates this in
 * JS) and `getInventorySummary` (which just aggregates it), so the
 * query and row-shaping logic live in exactly one place.
 */
async function fetchAllInventoryRows(supabase: SupabaseClient): Promise<{
  data: InventoryListRow[] | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('product_variants')
    .select(
      `
      id,
      sku,
      size,
      color_name,
      is_active,
      product:products!inner(id, name, slug, deleted_at, product_images(url, is_primary)),
      inventory(id, quantity, reserved, low_stock_at, updated_at)
    `
    )
    .is('product.deleted_at', null);

  if (error) {
    return { data: null, error: error.message };
  }

  const rows: InventoryListRow[] = ((data ?? []) as unknown as RawVariantRow[])
    .filter((row) => row.product && row.inventory)
    .map((row) => {
      const product = row.product!;
      const inventory = row.inventory!;
      const primaryImage = product.product_images.find((img) => img.is_primary) ?? product.product_images[0];

      return {
        variant_id: row.id,
        inventory_id: inventory.id,
        product_id: product.id,
        product_name: product.name,
        product_slug: product.slug,
        product_image_url: primaryImage?.url ?? null,
        sku: row.sku,
        size: row.size,
        color_name: row.color_name,
        quantity: inventory.quantity,
        reserved: inventory.reserved,
        low_stock_at: inventory.low_stock_at,
        is_active: row.is_active,
        updated_at: inventory.updated_at,
      };
    });

  return { data: rows, error: null };
}

export async function listInventory(filters: InventoryListFilters = {}): Promise<{
  data: InventoryListResult | null;
  error: string | null;
}> {
  const supabase = await createServerClient();
  const { data: allRows, error } = await fetchAllInventoryRows(supabase);

  if (error || !allRows) {
    return { data: null, error };
  }

  let rows = allRows;

  if (filters.search) {
    const term = filters.search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.product_name.toLowerCase().includes(term) ||
        r.sku.toLowerCase().includes(term) ||
        r.size.toLowerCase().includes(term) ||
        r.color_name.toLowerCase().includes(term)
    );
  }

  if (filters.stockFilter === 'low') {
    rows = rows.filter((r) => r.quantity > 0 && r.quantity <= r.low_stock_at);
  } else if (filters.stockFilter === 'out') {
    rows = rows.filter((r) => r.quantity === 0);
  }

  const sort = filters.sort ?? 'stock_asc';
  rows = [...rows].sort((a, b) => {
    switch (sort) {
      case 'stock_desc':
        return b.quantity - a.quantity;
      case 'name':
        return a.product_name.localeCompare(b.product_name);
      case 'updated':
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      case 'stock_asc':
      default:
        return a.quantity - b.quantity;
    }
  });

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const paginated = rows.slice(from, from + pageSize);

  return {
    data: { rows: paginated, totalCount: rows.length, page, pageSize },
    error: null,
  };
}

export async function getInventorySummary(): Promise<{
  data: InventorySummary | null;
  error: string | null;
}> {
  const supabase = await createServerClient();
  const { data: allRows, error } = await fetchAllInventoryRows(supabase);

  if (error || !allRows) {
    return { data: null, error };
  }

  return {
    data: {
      totalVariants: allRows.length,
      totalUnits: allRows.reduce((sum, r) => sum + r.quantity, 0),
      lowStockCount: allRows.filter((r) => r.quantity > 0 && r.quantity <= r.low_stock_at).length,
      outOfStockCount: allRows.filter((r) => r.quantity === 0).length,
    },
    error: null,
  };
}
