/* ============================================
   EIFA COUTURE — Customer Order Cancel Route
   ============================================
   POST /api/orders/[id]/cancel   body: { reason?: string }

   Lets a signed-in customer cancel their OWN order before it ships.
   All rules are enforced server-side inside the `cancel_order_by_customer`
   RPC (migration 20261114150000): ownership, status, shipped_at, stock
   restore, history row — under one row lock.

   For a paid order the money has to go back. Razorpay is an external
   HTTP call, so it follows the same two-step pattern as the admin
   refund route: initiate_refund → Razorpay → finalize_refund. If any
   refund step fails the order stays cancelled (the customer's intent
   is honoured and stock is back), the refund row is marked failed, and
   an admin can retry from the order's Refund panel. The response says
   which of the two happened so the UI never over-promises.
   ============================================ */

import { NextResponse, type NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';

import { rateLimit, rateLimitResponseHeaders, RATE_LIMITS } from '@/lib/rate-limit';
import { createRazorpayRefund } from '@/lib/razorpay';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

const bodySchema = z.object({
  reason: z.string().trim().max(300).optional(),
});

const ERROR_RESPONSES: Record<string, { status: number; message: string }> = {
  order_not_found: { status: 404, message: 'Order not found.' },
  order_already_closed: { status: 409, message: 'This order is already closed.' },
  order_not_cancellable: {
    status: 409,
    message: 'This order has already shipped, so it can no longer be cancelled. You can request a return after delivery.',
  },
  refund_in_progress: { status: 409, message: 'A refund has already been started on this order.' },
};

function mapRpcError(message: string): { status: number; message: string } {
  for (const [code, mapped] of Object.entries(ERROR_RESPONSES)) {
    if (message.includes(code)) return mapped;
  }
  return { status: 500, message: 'Could not cancel the order. Please try again.' };
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await context.params;

  if (!z.string().uuid().safeParse(orderId).success) {
    return NextResponse.json({ error: { message: 'Invalid order id.' } }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: { message: 'Please sign in to cancel an order.' } }, { status: 401 });
  }

  const limit = await rateLimit(`order-cancel:${user.id}`, RATE_LIMITS.orderCancel);
  if (!limit.success) {
    return NextResponse.json(
      { error: { message: 'Too many attempts. Please wait a moment and try again.' } },
      { status: 429, headers: rateLimitResponseHeaders(limit.retryAfterSeconds!) }
    );
  }

  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: { message: 'Invalid request.' } }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: cancelled, error: cancelError } = await service.rpc('cancel_order_by_customer', {
    p_order_id: orderId,
    p_user_id: user.id,
    p_reason: parsed.data.reason ?? null,
  });

  if (cancelError || !cancelled) {
    const mapped = mapRpcError(cancelError?.message ?? '');
    return NextResponse.json({ error: { message: mapped.message } }, { status: mapped.status });
  }

  const result = cancelled as {
    id: string;
    order_number: string;
    total: number;
    needs_refund: boolean;
    payment_provider: string;
  };

  // ---- Unpaid order: nothing to refund. ----
  if (!result.needs_refund) {
    return NextResponse.json({
      orderId: result.id,
      orderNumber: result.order_number,
      cancelled: true,
      refund: 'not_required',
    });
  }

  // ---- Paid order: refund the full amount. ----
  const amount = Number(result.total);
  const idempotencyKey = randomUUID();

  type RefundOutcome = 'initiated' | 'pending_manual';
  let refund: RefundOutcome = 'pending_manual';

  try {
    if (result.payment_provider !== 'razorpay') {
      throw new Error('Order was not paid via Razorpay; refund must be handled manually.');
    }

    const { data: initiated, error: initiateError } = await service.rpc('initiate_refund', {
      p_order_id: orderId,
      p_amount: amount,
      p_reason: 'Order cancelled by customer',
      p_idempotency_key: idempotencyKey,
      p_initiated_by: user.id,
    });

    if (initiateError || !initiated) {
      throw new Error(initiateError?.message ?? 'initiate_refund returned nothing');
    }

    const { refund_id: refundId, razorpay_payment_id: razorpayPaymentId } = initiated as {
      refund_id: string;
      razorpay_payment_id: string;
    };

    try {
      const razorpayResult = await createRazorpayRefund({
        razorpayPaymentId,
        amountInPaise: Math.round(amount * 100),
        idempotencyKey,
        notes: {
          internal_order_id: result.id,
          order_number: result.order_number,
          refund_id: refundId,
          source: 'customer_cancel',
        },
      });

      await service.rpc('finalize_refund', {
        p_refund_id: refundId,
        p_status: 'processed',
        p_razorpay_refund_id: razorpayResult.razorpayRefundId,
        p_error_message: null,
      });

      refund = 'initiated';
    } catch (err) {
      await service.rpc('finalize_refund', {
        p_refund_id: refundId,
        p_status: 'failed',
        p_razorpay_refund_id: null,
        p_error_message: err instanceof Error ? err.message : 'Razorpay refund request failed.',
      });
      throw err;
    }

    await service.from('order_status_history').insert({
      order_id: result.id,
      event_type: 'payment_refunded',
      previous_status: null,
      new_status: null,
      actor_type: 'system',
      notes: `Refund of ₹${amount.toFixed(2)} initiated for cancelled order.`,
    });
  } catch (err) {
    // The order IS cancelled; only the money movement needs a human.
    console.error('[order-cancel] refund step failed for', result.order_number, err);

    await service.from('order_status_history').insert({
      order_id: result.id,
      event_type: 'payment_refunded',
      previous_status: null,
      new_status: null,
      actor_type: 'system',
      notes: 'Automatic refund failed after customer cancel — needs manual refund from the Refund panel.',
    });
  }

  return NextResponse.json({
    orderId: result.id,
    orderNumber: result.order_number,
    cancelled: true,
    refund,
  });
}
