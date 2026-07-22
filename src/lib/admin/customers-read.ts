/* ============================================
   EIFA COUTURE — Admin Customer Data Access (server reads)
   ============================================
   Read-only module: no write path exists here on purpose — the admin
   Customer Management screens never edit, delete, change roles, or
   touch passwords. Sibling to `lib/admin/products-read.ts` /
   `lib/admin/orders.ts` in shape and conventions.

   Reads use the SERVER Supabase client, because both
   `src/app/admin/customers/page.tsx` and
   `src/app/admin/customers/[id]/page.tsx` are Server Components
   reading `searchParams`/`params` directly for SSR pagination — same
   reasoning as `lib/admin/auth.ts` and `lib/admin/products-read.ts`.

   Email note: `profiles` intentionally never stores email (see
   `supabase/migrations/0002_core_tables.sql` — auth.users already
   owns it and isn't queryable from the client). We surface the best
   available email by reading it off the customer's most recent
   order's `shipping_address` snapshot, the same jsonb field
   `lib/admin/orders.ts` already reads for `shippingAddress.email`.
   This module is server-only (imports `lib/supabase/server.ts`,
   which pulls in `next/headers`).
   ============================================ */

import { createClient as createServerClient } from '@/lib/supabase/server';
import type { DbAddress } from '@/types/database';

/* ---------- List (Server Component read) ---------- */

export interface CustomerListFilters {
  search?: string;
  isActive?: boolean;
  sort?: 'newest' | 'oldest' | 'name';
  page?: number;
  pageSize?: number;
}

export interface CustomerListRow {
  id: string;
  displayName: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
}

export interface CustomerListResult {
  rows: CustomerListRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const SORT_COLUMNS: Record<NonNullable<CustomerListFilters['sort']>, { column: string; ascending: boolean }> = {
  newest: { column: 'created_at', ascending: false },
  oldest: { column: 'created_at', ascending: true },
  name: { column: 'display_name', ascending: true },
};

/**
 * Paginated/filtered/sorted customer list for the admin table.
 * Order count and lifetime spend are resolved via a nested select
 * (`orders(total)`) and summed in JS — same pattern
 * `listProducts` uses to aggregate `total_stock` from nested
 * `product_variants`, rather than a separate round-trip per row.
 */
export async function listCustomers(filters: CustomerListFilters = {}): Promise<{
  data: CustomerListResult | null;
  error: string | null;
}> {
  const supabase = await createServerClient();

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const sort = SORT_COLUMNS[filters.sort ?? 'newest'];

  let query = supabase
    .from('profiles')
    .select(
      `
      id, display_name, phone, is_active, created_at,
      orders(total)
    `,
      { count: 'exact' }
    )
    .eq('role', 'customer')
    .is('deleted_at', null);

  if (filters.search) {
    const term = filters.search.trim();
    query = query.or(`display_name.ilike.%${term}%,phone.ilike.%${term}%`);
  }
  if (filters.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }

  query = query.order(sort.column, { ascending: sort.ascending }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  type RawRow = {
    id: string;
    display_name: string;
    phone: string | null;
    is_active: boolean;
    created_at: string;
    orders: { total: number }[];
  };

  const rows: CustomerListRow[] = ((data ?? []) as unknown as RawRow[]).map((row) => ({
    id: row.id,
    displayName: row.display_name,
    phone: row.phone,
    isActive: row.is_active,
    createdAt: row.created_at,
    orderCount: row.orders.length,
    totalSpent: row.orders.reduce((sum, o) => sum + Number(o.total), 0),
  }));

  return {
    data: { rows, totalCount: count ?? 0, page, pageSize },
    error: null,
  };
}

/* ---------- Single customer (Server Component read) ---------- */

export interface CustomerRecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  placedAt: string;
}

export interface CustomerDetail {
  id: string;
  displayName: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  recentOrders: CustomerRecentOrder[];
  addresses: DbAddress[];
}

const RECENT_ORDERS_LIMIT = 5;

export async function getCustomerDetail(id: string): Promise<{
  data: CustomerDetail | null;
  error: string | null;
}> {
  const supabase = await createServerClient();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name, phone, is_active, created_at')
    .eq('id', id)
    .eq('role', 'customer')
    .is('deleted_at', null)
    .maybeSingle();

  if (profileError) {
    return { data: null, error: profileError.message };
  }
  if (!profile) {
    return { data: null, error: null };
  }

  const [ordersResult, addressesResult] = await Promise.all([
    supabase
      .from('orders')
      .select('id, order_number, status, total, placed_at, shipping_address')
      .eq('user_id', id)
      .order('placed_at', { ascending: false }),
    supabase
      .from('addresses')
      .select('*')
      .eq('user_id', id)
      .order('is_default', { ascending: false }),
  ]);

  if (ordersResult.error) {
    return { data: null, error: ordersResult.error.message };
  }
  if (addressesResult.error) {
    return { data: null, error: addressesResult.error.message };
  }

  type OrderRow = {
    id: string;
    order_number: string;
    status: string;
    total: number;
    placed_at: string;
    shipping_address: Record<string, unknown> | null;
  };

  const orderRows = (ordersResult.data ?? []) as unknown as OrderRow[];
  const totalSpent = orderRows.reduce((sum, o) => sum + Number(o.total), 0);

  // Best-effort email: most recent order's shipping address snapshot.
  const email =
    (orderRows.find((o) => typeof o.shipping_address?.email === 'string')?.shipping_address?.email as
      | string
      | undefined) ?? null;

  const profileRow = profile as {
    id: string;
    display_name: string;
    phone: string | null;
    is_active: boolean;
    created_at: string;
  };

  return {
    data: {
      id: profileRow.id,
      displayName: profileRow.display_name,
      phone: profileRow.phone,
      email,
      isActive: profileRow.is_active,
      createdAt: profileRow.created_at,
      totalOrders: orderRows.length,
      totalSpent,
      recentOrders: orderRows.slice(0, RECENT_ORDERS_LIMIT).map((o) => ({
        id: o.id,
        orderNumber: o.order_number,
        status: o.status,
        total: Number(o.total),
        placedAt: o.placed_at,
      })),
      addresses: (addressesResult.data ?? []) as DbAddress[],
    },
    error: null,
  };
}
