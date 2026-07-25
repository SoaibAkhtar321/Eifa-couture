/* ============================================
   EIFA COUTURE — Admin Refund Route
   ============================================
   Issues a full or partial refund for a paid Razorpay order. This is
   the first /api/admin/* route in the codebase — `requireAdmin()`
   (lib/admin/auth.ts) isn't usable here since it calls `redirect()`,
   which only works from Server Components/Actions, so this route
   does its own session + role check and returns JSON 401/403 instead.

   Flow (see migration 0017 for the full reasoning):
     1. Confirm caller is an authenticated admin/superadmin.
     2. Look up the order with the SERVICE-ROLE client — this route
        needs razorpay_payment_id and payment_status regardless of
        which admin is looking, and the actual authorization gate is
        the role check above, not RLS.
     3. Call `initiate_refund` (service-role RPC). This locks the
        order row and validates paid/not-exceeding-captured/no
        duplicate — see the migration for why this must happen BEFORE
        the Razorpay call, and why the lock makes concurrent refund
        clicks safe.
     4. Call Razorpay's refund API directly (lib/razorpay.ts,
        createRazorpayRefund) with an idempotency key.
     5. Call `finalize_refund` to record the outcome — 'processed' on
        Razorpay success, 'failed' (with the error message) if the
        Razorpay call throws. Either way the refund row is left in a
        terminal state, never stuck 'processing' from this route's
        point of view.

   A failure between steps 3 and 5 (e.g. the server crashes right
   after Razorpay confirms the refund but before finalize_refund
   runs) would leave a 'processing' row with money already refunded
   on Razorpay's side. That gap is deliberately not covered by a
   webhook in this phase (Razorpay's `refund.processed` webhook event
   would close it, but wiring a new webhook event into
   /api/webhooks/razorpay is left for a follow-up — see the testing
   checklist) — reconciling any such row is a manual, rare-case admin
   task: check Razorpay's dashboard for the payment's refund history
   and update the `refunds` row directly.
   ============================================ */

import { NextResponse, type NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';

import { rateLimit, rateLimitResponseHeaders, RATE_LIMITS } from '@/lib/rate-limit';
import { createRazorpayRefund } from '@/lib/razorpay';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { logAdminAction } from '@/lib/admin/audit-log';
import type { UserRole } from '@/types/database';

const bodySchema = z.object({
  // Rupees, matching orders.total's unit. Omit for a full refund of
  // whatever remains refundable.
  amount: z.coerce.number().positive().optional(),
  reason: z.string().trim().max(500).optional(),
});

interface PostgresRpcError {
  message?: string;
}

const ERROR_RESPONSES: Record<string, { status: number; message: string }> = {
  order_not_found: { status: 404, message: 'Order not found.' },
  unsupported_payment_provider: { status: 400, message: 'This order was not paid via Razorpay.' },
  missing_payment_id: { status: 400, message: 'This order has no captured payment to refund.' },
  order_not_paid: { status: 409, message: 'Only paid orders can be refunded.' },
  invalid_refund_amount: { status: 400, message: 'Refund amount must be greater than zero.' },
  order_already_refunded: { status: 409, message: 'This order has already been fully refunded.' },
  refund_exceeds_captured_amount: {
    status: 400,
    message: 'Refund amount exceeds the amount still available to refund on this order.',
  },
};

function mapRpcError(error: PostgresRpcError | null): { status: number; message: string } {
  const message = error?.message ?? '';
  for (const [code, mapped] of Object.entries(ERROR_RESPONSES)) {
    if (message.includes(code)) return mapped;
  }
  return { status: 500, message: 'Could not process the refund. Please try again.' };
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await context.params;

  if (!z.string().uuid().safeParse(orderId).success) {
    return NextResponse.json({ error: { message: 'Invalid order id.' } }, { status: 400 });
  }

  // ---- Auth: session-scoped client confirms who's calling ----
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: { message: 'Not authenticated.' } }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', user.id)
    .single();

  const role = (profile as { role: UserRole } | null)?.role;

  if (profileError || !profile || (role !== 'admin' && role !== 'superadmin')) {
    return NextResponse.json({ error: { message: 'Admin access required.' } }, { status: 403 });
  }

  const limit = rateLimit(`admin-refund:${user.id}`, RATE_LIMITS.adminRefund);
  if (!limit.success) {
    return NextResponse.json(
      { error: { message: 'Too many refund requests. Please slow down.' } },
      { status: 429, headers: rateLimitResponseHeaders(limit.retryAfterSeconds!) }
    );
  }

  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: { message: 'Invalid request body.' } }, { status: 400 });
  }

  const { reason } = parsed.data;

  // ---- Service-role client for everything from here: refund writes
  // have no client-writable RLS policy by design (see migration 0017
  // — same trust boundary as mark_order_paid). ----
  const serviceClient = createServiceClient();

  const { data: order, error: fetchError } = await serviceClient
    .from('orders')
    .select('id, order_number, total, payment_status, payment_provider, razorpay_payment_id')
    .eq('id', orderId)
    .maybeSingle<{
      id: string;
      order_number: string;
      total: number;
      payment_status: string;
      payment_provider: string;
      razorpay_payment_id: string | null;
    }>();

  if (fetchError || !order) {
    return NextResponse.json({ error: { message: 'Order not found.' } }, { status: 404 });
  }

  // Default to a full refund of whatever's left refundable when no
  // amount is given. initiate_refund computes and enforces the exact
  // refundable ceiling from the `refunds` table itself (accounting
  // for any prior partial refunds), so passing the order's face
  // total here for "full refund" is safe — the RPC will clamp/reject
  // rather than trust this figure blindly.
  const amount = parsed.data.amount ?? Number(order.total);

  const idempotencyKey = randomUUID();

  const { data: initiated, error: initiateError } = await serviceClient.rpc('initiate_refund', {
    p_order_id: orderId,
    p_amount: amount,
    p_reason: reason ?? null,
    p_idempotency_key: idempotencyKey,
    p_initiated_by: user.id,
  });

  if (initiateError || !initiated) {
    const mapped = mapRpcError(initiateError);
    return NextResponse.json({ error: { message: mapped.message } }, { status: mapped.status });
  }

  const refundId = (initiated as { refund_id: string }).refund_id;
  const razorpayPaymentId = (initiated as { razorpay_payment_id: string }).razorpay_payment_id;

  let razorpayResult;
  try {
    razorpayResult = await createRazorpayRefund({
      razorpayPaymentId,
      amountInPaise: Math.round(amount * 100),
      idempotencyKey,
      notes: {
        internal_order_id: order.id,
        order_number: order.order_number,
        refund_id: refundId,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Razorpay refund request failed.';

    await serviceClient.rpc('finalize_refund', {
      p_refund_id: refundId,
      p_status: 'failed',
      p_razorpay_refund_id: null,
      p_error_message: message,
    });

    return NextResponse.json({ error: { message } }, { status: 502 });
  }

  const { data: finalized, error: finalizeError } = await serviceClient.rpc('finalize_refund', {
    p_refund_id: refundId,
    p_status: 'processed',
    p_razorpay_refund_id: razorpayResult.razorpayRefundId,
    p_error_message: null,
  });

  if (finalizeError || !finalized) {
    // The refund succeeded on Razorpay's side but we couldn't record
    // it — see the header comment on the manual-reconciliation gap.
    return NextResponse.json(
      {
        error: {
          message:
            'Refund was processed by Razorpay but could not be recorded. Please contact support with reference: ' +
            razorpayResult.razorpayRefundId,
        },
      },
      { status: 500 }
    );
  }

  const result = finalized as {
    order_id: string;
    order_number: string;
    payment_status: string;
    total_refunded: number;
  };

  await logAdminAction({
    action: 'refund',
    entityType: 'order',
    entityId: order.id,
    entityLabel: order.order_number,
    detail: `Refunded ${amount.toFixed(2)}${reason ? ` — ${reason}` : ''}`,
    metadata: {
      refund_id: refundId,
      razorpay_refund_id: razorpayResult.razorpayRefundId,
      amount,
      payment_status: result.payment_status,
    },
  });

  return NextResponse.json({
    refundId,
    razorpayRefundId: razorpayResult.razorpayRefundId,
    orderId: result.order_id,
    orderNumber: result.order_number,
    amount,
    paymentStatus: result.payment_status,
    totalRefunded: result.total_refunded,
  });
}
