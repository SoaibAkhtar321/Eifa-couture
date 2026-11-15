/* ============================================
   EIFA COUTURE — Admin Returns Data Access (server read)
   ============================================
   Server-only (server Supabase client). Admins can read every row via
   the `returns_select_own_or_admin` policy. Writes never happen here:
   they go through /api/admin/returns/[id].
   ============================================ */

import { createClient } from '@/lib/supabase/server';
import type { ReturnStatus } from '@/types/database';
import {
  computeReturnRefundPreview,
  type AdminReturnRecord,
  type AdminReturnRefund,
} from './returns-types';

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
  refund_id: string | null;
  pickup_courier: string | null;
  pickup_tracking_number: string | null;
  pickup_date: string | null;
  requested_at: string;
  resolved_at: string | null;
  order_items: { name: string; size: string; color_name: string; unit_price: number } | null;
}

interface RawRefund {
  id: string;
  status: string;
  amount: number;
  error_message: string | null;
  processed_at: string | null;
}

export async function getOrderReturns(orderId: string): Promise<{
  data: AdminReturnRecord[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('order_returns')
    .select(
      'id, status, reason, details, quantity, is_exchange, exchange_size, admin_notes, refund_amount, refund_id, pickup_courier, pickup_tracking_number, pickup_date, requested_at, resolved_at, order_items ( name, size, color_name, unit_price )'
    )
    .eq('order_id', orderId)
    .order('requested_at', { ascending: false });

  if (error) return { data: [], error: error.message };

  const raw = (data ?? []) as unknown as RawRow[];

  // Refund status + the order's paid ratio, for the refund button and badge.
  // Separate queries: a failure here must not hide the returns themselves.
  const refundIds = raw.map((r) => r.refund_id).filter((id): id is string => Boolean(id));
  const [{ data: orderRow }, { data: refundRows }] = await Promise.all([
    supabase.from('orders').select('subtotal, discount').eq('id', orderId).maybeSingle(),
    refundIds.length > 0
      ? supabase.from('refunds').select('id, status, amount, error_message, processed_at').in('id', refundIds)
      : Promise.resolve({ data: [] as RawRefund[] }),
  ]);

  const order = orderRow as { subtotal: number; discount: number | null } | null;
  const refundsById = new Map<string, AdminReturnRefund>();
  for (const f of (refundRows ?? []) as RawRefund[]) {
    refundsById.set(f.id, {
      status: f.status,
      amount: Number(f.amount),
      errorMessage: f.error_message,
      processedAt: f.processed_at,
    });
  }

  const rows = raw.map((r): AdminReturnRecord => {
    const unitPrice = r.order_items ? Number(r.order_items.unit_price) : null;
    const preview =
      order && unitPrice !== null
        ? computeReturnRefundPreview(unitPrice, r.quantity, Number(order.subtotal), Number(order.discount ?? 0))
        : null;

    return {
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
      pickupCourier: r.pickup_courier,
      pickupTrackingNumber: r.pickup_tracking_number,
      pickupDate: r.pickup_date,
      refundPreview: preview !== null && Number.isFinite(preview) && preview > 0 ? preview : null,
      refund: r.refund_id ? (refundsById.get(r.refund_id) ?? null) : null,
    };
  });

  return { data: rows, error: null };
}
