/* ============================================
   EIFA COUTURE — Admin Collection Data Access (server reads)
   ============================================
   Sibling to `lib/admin/products-read.ts`, same conventions: server
   Supabase client, raw DB rows (including inactive ones), paginated
   list read for the admin table. Product count is resolved via a
   nested count select on `product_collections` rather than a
   separate round-trip per row.

   Server-only (imports `lib/supabase/server.ts`, which pulls in
   `next/headers`) — only import from Server Components, or via
   `import type` from Client Components.
   ============================================ */

import { createClient as createServerClient } from '@/lib/supabase/server';
import type { DbCollection } from '@/types/database';

/* ---------- List (Server Component read) ---------- */

export interface CollectionListFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CollectionListRow extends DbCollection {
  product_count: number;
}

export interface CollectionListResult {
  rows: CollectionListRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/**
 * Paginated/filtered collection list for the admin table. Product
 * count is resolved via a nested `product_collections(count)` select
 * rather than a per-row query.
 */
export async function listCollections(filters: CollectionListFilters = {}): Promise<{
  data: CollectionListResult | null;
  error: string | null;
}> {
  const supabase = await createServerClient();

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('collections')
    .select(
      `
      *,
      product_collections(count)
    `,
      { count: 'exact' }
    )
    .is('deleted_at', null);

  if (filters.search) {
    const term = filters.search.trim();
    query = query.or(`name.ilike.%${term}%,slug.ilike.%${term}%`);
  }
  if (filters.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }

  query = query.order('sort_order', { ascending: true }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  type RawRow = DbCollection & {
    product_collections: { count: number }[];
  };

  const rows: CollectionListRow[] = ((data ?? []) as unknown as RawRow[]).map((row) => {
    const { product_collections, ...collection } = row;
    return {
      ...collection,
      product_count: product_collections[0]?.count ?? 0,
    };
  });

  return {
    data: { rows, totalCount: count ?? 0, page, pageSize },
    error: null,
  };
}