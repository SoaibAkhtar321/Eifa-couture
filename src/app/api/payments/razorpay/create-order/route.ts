/* ============================================
   EIFA COUTURE — Razorpay Create-Order Route
   ============================================
   Called by the client right after our own `create_order` RPC
   returns (see lib/orders.ts). Takes our internal order id, creates a
   matching Razorpay Order for that amount, and stamps
   `payment_provider_ref` on our order row so the two are linked.

   Auth model: this route uses the SESSION-scoped client (RLS-bound)
   to look up the order — a customer can only fetch their own order,
   so this route can never be used to probe/pay another user's order
   by guessing an id. The service-role client is only reached for the
   `payment_provider_ref` UPDATE, since that column has no
   authenticated-writable RLS policy (only the RPCs and this trusted
   server code may set it).

   Idempotent: if `payment_provider_ref` is already set (e.g. the
   customer's browser retried this call, or they refreshed on the
   checkout page), we return the existing Razorpay order rather than
   creating a second one — Razorpay would happily create a duplicate
   otherwise, leaving the customer with two live payment intents for
   one internal order.
   ============================================ */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { createRazorpayOrder } from '@/lib/razorpay';
import { getClientIp, rateLimit, rateLimitResponseHeaders, RATE_LIMITS } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import type { DbOrder } from '@/types/database';

const bodySchema = z.object({
  orderId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit(`razorpay-create-order:${ip}`, RATE_LIMITS.razorpayCreateOrder);

  if (!limit.success) {
    return NextResponse.json(
      { error: { message: 'Too many requests. Please try again shortly.' } },
      { status: 429, headers: rateLimitResponseHeaders(limit.retryAfterSeconds!) }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: { message: 'Invalid request body.' } }, { status: 400 });
  }

  const { orderId } = parsed.data;

  // Session-scoped client: RLS ensures this SELECT can only ever see
  // an order belonging to the signed-in user.
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: { message: 'Not authenticated.' } }, { status: 401 });
  }

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, order_number, total, payment_status, payment_provider, payment_provider_ref')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .maybeSingle<
      Pick<
        DbOrder,
        'id' | 'order_number' | 'total' | 'payment_status' | 'payment_provider' | 'payment_provider_ref'
      >
    >();

  if (fetchError || !order) {
    return NextResponse.json({ error: { message: 'Order not found.' } }, { status: 404 });
  }

  if (order.payment_provider !== 'razorpay') {
    return NextResponse.json(
      { error: { message: 'This order is not set up for Razorpay payment.' } },
      { status: 400 }
    );
  }

  if (order.payment_status === 'paid') {
    return NextResponse.json(
      { error: { message: 'This order has already been paid.' } },
      { status: 409 }
    );
  }

  // Idempotent replay: a Razorpay order already exists for this
  // internal order (e.g. duplicate client call, refreshed checkout
  // page). Re-fetch it from Razorpay rather than creating a second
  // one, so retries never produce two live payment intents.
  if (order.payment_provider_ref) {
    try {
      const instance = (await import('@/lib/razorpay')).getRazorpayInstance();
      const existing = await instance.orders.fetch(order.payment_provider_ref);

      return NextResponse.json({
        razorpayOrderId: existing.id,
        amount: Number(existing.amount),
        currency: existing.currency,
        orderNumber: order.order_number,
      });
    } catch {
      // Fall through and create a fresh one if the stored ref is
      // somehow no longer valid on Razorpay's side (shouldn't happen
      // in practice, but don't hard-fail the checkout over it).
    }
  }

  const amountInPaise = Math.round(Number(order.total) * 100);

  if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
    return NextResponse.json(
      { error: { message: 'Order total is invalid for payment.' } },
      { status: 400 }
    );
  }

  let razorpayOrder;
  try {
    razorpayOrder = await createRazorpayOrder({
      amountInPaise,
      internalOrderId: order.id,
      orderNumber: order.order_number,
    });
  } catch (err) {
    console.error('[razorpay/create-order] Razorpay order creation failed', {
      orderId: order.id,
      orderNumber: order.order_number,
      error: err instanceof Error ? err.message : err,
    });
    return NextResponse.json(
      { error: { message: 'Could not initiate payment. Please try again.' } },
      { status: 502 }
    );
  }

  // Service-role write: payment_provider_ref has no client-writable
  // RLS policy by design (see migration 0015 notes), so only trusted
  // server code can set it.
  const serviceClient = createServiceClient();
  const { error: updateError } = await serviceClient
    .from('orders')
    .update({ payment_provider_ref: razorpayOrder.razorpayOrderId })
    .eq('id', order.id);

  if (updateError) {
    console.error('[razorpay/create-order] Failed to stamp payment_provider_ref', {
      orderId: order.id,
      razorpayOrderId: razorpayOrder.razorpayOrderId,
      error: updateError.message,
    });
    return NextResponse.json(
      { error: { message: 'Could not link payment to order. Please try again.' } },
      { status: 500 }
    );
  }

  // Best-effort audit row: the Razorpay order is now linked, which is
  // the "payment initiated" moment. This never blocks checkout — a
  // logging failure here shouldn't stop the customer from paying.
  const { error: historyError } = await serviceClient.from('order_status_history').insert({
    order_id: order.id,
    event_type: 'razorpay_order_created',
    actor_type: 'customer',
    actor_id: user.id,
    notes: null,
  });

  if (historyError) {
    console.error('Failed to record order status history:', historyError.message);
  }

  return NextResponse.json({
    razorpayOrderId: razorpayOrder.razorpayOrderId,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    orderNumber: order.order_number,
  });
}