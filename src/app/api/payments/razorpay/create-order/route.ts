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
  const limit = rateLimit(`razorpay-create-order:${ip}`, RATE_LIMITS.login);

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
    .select('id, order_number, total, status, cancelled_by, payment_status, payment_provider, payment_provider_ref')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .maybeSingle<
      Pick<
        DbOrder,
        | 'id'
        | 'order_number'
        | 'total'
        | 'status'
        | 'cancelled_by'
        | 'payment_status'
        | 'payment_provider'
        | 'payment_provider_ref'
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

  // A deliberately cancelled order (by the customer or an admin) must
  // not be payable again — otherwise a late payment would settle and
  // bring it back to life. System expiry (cancelled_by = 'system')
  // stays retryable, as before.
  if (order.status === 'cancelled' && (order.cancelled_by === 'customer' || order.cancelled_by === 'admin')) {
    return NextResponse.json(
      { error: { message: 'This order was cancelled. Please place a new order.' } },
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

      // Only log this as a genuine "retry" when the previous attempt
      // actually failed — a plain page refresh on a still-pending order
      // isn't a retry and shouldn't spam the timeline. Best-effort: a
      // logging failure here must not block the customer from paying.
      if (order.payment_status === 'failed') {
        const { error: historyError } = await createServiceClient()
          .from('order_status_history')
          .insert({
            order_id: order.id,
            event_type: 'payment_retried',
            actor_type: 'customer',
            actor_id: user.id,
          });

        if (historyError) {
          console.error('Failed to record payment_retried history:', historyError.message);
        }
      }

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
  } catch (razorpayError) {
    console.error('[create-order] Razorpay order creation failed:', razorpayError);
    return NextResponse.json(
      { error: { message: 'Could not initiate payment. Please try again.' } },
      { status: 502 }
    );
  }

  // Service-role write: payment_provider_ref has no client-writable
  // RLS policy by design (see migration 0015 notes), so only trusted
  // server code can set it.
  let serviceClient: ReturnType<typeof createServiceClient>;
  try {
    serviceClient = createServiceClient();
  } catch (configError) {
    console.error('[create-order] Service client misconfigured:', configError);
    return NextResponse.json(
      { error: { message: 'Payment service is not configured. Please contact support.' } },
      { status: 500 }
    );
  }

  const { data: linkedRows, error: updateError } = await serviceClient
    .from('orders')
    .update({ payment_provider_ref: razorpayOrder.razorpayOrderId })
    .eq('id', order.id)
    .select('id');

  // A zero-row update means the order id matched nothing; treat it as a
  // failure too, otherwise the customer would pay for an unlinked order.
  if (updateError || !linkedRows || linkedRows.length === 0) {
    console.error('[create-order] Failed to link Razorpay order to order row:', {
      orderId: order.id,
      razorpayOrderId: razorpayOrder.razorpayOrderId,
      code: updateError?.code,
      message: updateError?.message,
      details: updateError?.details,
      hint: updateError?.hint,
      rowsUpdated: linkedRows?.length ?? 0,
    });

    // Dev-only: surface the real cause in the UI so it is visible without
    // digging through the terminal. Never exposed in production.
    const devDetail =
      process.env.NODE_ENV !== 'production' && updateError
        ? ` [dev: ${updateError.code ?? 'no-code'} ${updateError.message}]`
        : '';

    return NextResponse.json(
      { error: { message: `Could not link payment to order. Please try again.${devDetail}` } },
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