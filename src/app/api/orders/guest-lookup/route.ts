/* ============================================
   EIFA COUTURE — Guest order lookup
   ============================================
   POST /api/orders/guest-lookup   body: { orderNumber, email }

   Lets a guest on a different device find their order with the order
   number and the email typed at checkout. Rate-limited; every failure
   is the same generic 404 (see lib/returns/guest-order-access.ts).
   Returns only what the order tracker needs — no address, phone or
   payment identifiers.
   ============================================ */

import { NextResponse, type NextRequest } from 'next/server';

import { DEFAULT_RETURN_WINDOW_DAYS, getReturnEligibility } from '@/lib/order-policy';
import {
  findGuestOrder,
  guestCredentialsSchema,
  guestNotFound,
  guestRateLimited,
} from '@/lib/returns/guest-order-access';
import { createServiceClient } from '@/lib/supabase/service';
import type { OrderStatus, PaymentStatus } from '@/types/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = guestCredentialsSchema.safeParse(json);
  if (!parsed.success) return guestNotFound();

  const blocked = guestRateLimited(request, parsed.data.orderNumber, 'guest-lookup');
  if (blocked) return blocked;

  const order = await findGuestOrder(parsed.data);
  if (!order) return guestNotFound();

  const service = createServiceClient();

  const [{ data: items }, { data: returns }, { data: settings }] = await Promise.all([
    service
      .from('order_items')
      .select('id, product_id, name, size, color_name, quantity')
      .eq('order_id', order.id),
    service
      .from('order_returns')
      .select(
        'id, order_item_id, status, reason, is_exchange, exchange_size, quantity, admin_notes, refund_amount, requested_at, resolved_at, pickup_courier, pickup_tracking_number, pickup_date'
      )
      .eq('order_id', order.id)
      .order('requested_at', { ascending: false }),
    service.from('store_settings').select('return_window_days').limit(1).maybeSingle(),
  ]);

  const windowDays =
    typeof settings?.return_window_days === 'number' ? settings.return_window_days : DEFAULT_RETURN_WINDOW_DAYS;

  const eligibility = getReturnEligibility(
    {
      status: order.status as OrderStatus,
      payment_status: order.payment_status as PaymentStatus,
      delivered_at: order.delivered_at,
    },
    windowDays
  );

  return NextResponse.json({
    order: {
      orderNumber: order.order_number,
      status: order.status,
      paymentStatus: order.payment_status,
      placedAt: order.placed_at,
      deliveredAt: order.delivered_at,
      canRequestReturn: eligibility.ok,
      returnBlockedMessage: eligibility.ok ? null : eligibility.message,
      items: (items ?? []).map((i) => ({
        id: i.id,
        productId: i.product_id,
        name: i.name,
        size: i.size,
        colorName: i.color_name,
        quantity: i.quantity,
      })),
    },
    returns: returns ?? [],
  });
}
