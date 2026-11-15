/* ============================================
   EIFA COUTURE — Admin Returns Inbox (server read)
   ============================================
   Server-only (server Supabase client). Lists returns across all
   orders for /admin/returns and counts the ones awaiting review for
   the sidebar badge and dashboard card. Read-only: every change to a
   return still goes through /api/admin/returns/[id].
   Admins can read every row via `returns_select_own_or_admin`.
   ============================================ */

import { createClient } from '@/lib/supabase/server';
import type { ReturnStatus } from '@/types/database';
import {
  OPEN_RETURN_STATUSES,
  RETURN_INBOX_FILTER_OPTIONS,
  type ReturnInboxFilter,
  type ReturnInboxResult,
  type ReturnInboxRow,
} from './returns-types';

export * from './returns-types';

const PAGE_SIZE = 20;

/** Accepts only a known filter value; anything else falls back to "open". */
export function parseReturnInboxFilter(value: string | undefined): ReturnInboxFilter {
  const match = RETURN_INBOX_FILTER_OPTIONS.find((option) => option.value === value);
  return match ? match.value : 'open';
}

/**
 * Order numbers are letters, digits and dashes. Anything else is dropped
 * so the term can never carry LIKE wildcards or filter syntax.
 */
function sanitizeOrderSearch(raw: string | undefined): string {
  return (raw ?? '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 40);
}

interface RawInboxRow {
  id: string;
  order_id: string;
  status: ReturnStatus;
  reason: string;
  quantity: number;
  is_exchange: boolean;
  requested_at: string;
  order_items: { name: string; size: string; color_name: string } | null;
  orders:
    | { order_number: string; shipping_address: { full_name?: string } | null }
    | { order_number: string; shipping_address: { full_name?: string } | null }[]
    | null;
}

export async function listReturns(options: {
  filter?: ReturnInboxFilter;
  search?: string;
  page?: number;
}): Promise<{ data: ReturnInboxResult | null; error: string | null }> {
  const supabase = await createClient();

  const filter = options.filter ?? 'open';
  const page = Math.max(1, Math.floor(options.page ?? 1) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const term = sanitizeOrderSearch(options.search);

  let query = supabase
    .from('order_returns')
    .select(
      'id, order_id, status, reason, quantity, is_exchange, requested_at, order_items ( name, size, color_name ), orders!inner ( order_number, shipping_address )',
      { count: 'exact' }
    );

  if (filter === 'open') {
    query = query.in('status', [...OPEN_RETURN_STATUSES]);
  } else if (filter !== 'all') {
    query = query.eq('status', filter);
  }

  if (term) {
    query = query.ilike('orders.order_number', `%${term}%`);
  }

  query = query.order('requested_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) return { data: null, error: error.message };

  const rows = ((data ?? []) as unknown as RawInboxRow[]).map((r): ReturnInboxRow => {
    const order = Array.isArray(r.orders) ? r.orders[0] : r.orders;
    return {
      id: r.id,
      orderId: r.order_id,
      orderNumber: order?.order_number ?? '—',
      customerName: order?.shipping_address?.full_name?.trim() || '—',
      itemName: r.order_items?.name ?? 'Item',
      itemSize: r.order_items?.size ?? '',
      itemColor: r.order_items?.color_name ?? '',
      quantity: r.quantity,
      isExchange: r.is_exchange,
      reason: r.reason,
      status: r.status,
      requestedAt: r.requested_at,
    };
  });

  return { data: { rows, totalCount: count ?? 0, page, pageSize: PAGE_SIZE }, error: null };
}

/** Number of returns still waiting for the first admin review. */
export async function getRequestedReturnCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('order_returns')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'requested');

  return error ? 0 : (count ?? 0);
}
