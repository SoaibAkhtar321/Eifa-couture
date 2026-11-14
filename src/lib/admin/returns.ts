/* ============================================
   EIFA COUTURE — Admin Returns Data Access (server read)
   ============================================
   Server-only (server Supabase client). Admins can read every row via
   the `returns_select_own_or_admin` policy. Writes never happen here:
   they go through /api/admin/returns/[id].
   ============================================ */

import { createClient } from '@/lib/supabase/server';
import type { ReturnStatus } from '@/types/database';
import type { AdminReturnRecord } from './returns-types';

export type { AdminReturnRecord } from './returns-types';

interface RawRow {
  id: string;
  status: ReturnStatus;
  reason: string;
  details: string | null;
  quantity: number;
  is_exchange: boolean;
  exchange_size: string | null;
  admin_notes: string | null;
  refund_amount: number | null;
  requested_at: string;
  resolved_at: string | null;
  order_items: { name: string; size: string; color_name: string } | null;
}

export async function getOrderReturns(orderId: string): Promise<{
  data: AdminReturnRecord[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('order_returns')
    .select(
      'id, status, reason, details, quantity, is_exchange, exchange_size, admin_notes, refund_amount, requested_at, resolved_at, order_items ( name, size, color_name )'
    )
    .eq('order_id', orderId)
    .order('requested_at', { ascending: false });

  if (error) return { data: [], error: error.message };

  const rows = ((data ?? []) as unknown as RawRow[]).map(
    (r): AdminReturnRecord => ({
      id: r.id,
      status: r.status,
      reason: r.reason,
      details: r.details,
      quantity: r.quantity,
      isExchange: r.is_exchange,
      exchangeSize: r.exchange_size,
      adminNotes: r.admin_notes,
      refundAmount: r.refund_amount === null ? null : Number(r.refund_amount),
      requestedAt: r.requested_at,
      resolvedAt: r.resolved_at,
      itemName: r.order_items?.name ?? 'Item',
      itemSize: r.order_items?.size ?? '',
      itemColor: r.order_items?.color_name ?? '',
    })
  );

  return { data: rows, error: null };
}
