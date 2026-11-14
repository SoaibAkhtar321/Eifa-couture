/* ============================================
   EIFA COUTURE — Admin Return Workflow Route
   ============================================
   POST /api/admin/returns/[id]
   body: { action, notes?, restock? }
   action: approve | reject | picked_up | received | refunded | exchanged

   Every status change goes through the `admin_update_return` RPC
   (transition map, stock, history row — see migration 20261114160000).

   'refunded' also moves money, so it reuses the same two-step pattern
   as the admin refund route: initiate_refund -> Razorpay ->
   finalize_refund. To make a retry safe, the refund id is saved on the
   return BEFORE Razorpay is called:
     - refund processed but the return update failed -> retry skips
       Razorpay and only finishes the status change (no double refund)
     - refund still 'processing'                      -> blocked
     - refund failed                                  -> a new refund
       may be started

   The refund is the item's share of what the customer actually paid
   (coupon discount spread across items), never more than the
   remaining refundable balance (initiate_refund enforces that).
   ============================================ */

import { NextResponse, type NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';

import { logAdminAction } from '@/lib/admin/audit-log';
import { rateLimit, rateLimitResponseHeaders, RATE_LIMITS } from '@/lib/rate-limit';
import { createRazorpayRefund } from '@/lib/razorpay';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import type { UserRole } from '@/types/database';

const ACTION_TO_STATUS = {
  approve: 'approved',
  reject: 'rejected',
  picked_up: 'picked_up',
  received: 'received',
  refunded: 'refunded',
  exchanged: 'exchanged',
} as const;

const bodySchema = z.object({
  action: z.enum(['approve', 'reject', 'picked_up', 'received', 'refunded', 'exchanged']),
  notes: z.string().trim().max(500).optional(),
  restock: z.boolean().optional(),
});

const ERROR_RESPONSES: Record<string, { status: number; message: string }> = {
  return_not_found: { status: 404, message: 'Return not found.' },
  invalid_transition: { status: 409, message: 'This return cannot move to that step from its current status.' },
  not_an_exchange: { status: 409, message: 'This is a return, not an exchange.' },
  rejection_note_required: { status: 400, message: 'Add a note explaining why the request is rejected.' },
  exchange_variant_unavailable: { status: 409, message: 'The exchange size no longer exists.' },
  exchange_out_of_stock: { status: 409, message: 'The exchange size is out of stock.' },
  invalid_refund_amount: { status: 400, message: 'Refund amount must be greater than zero.' },
  order_not_paid: { status: 409, message: 'Only paid orders can be refunded.' },
  order_already_refunded: { status: 409, message: 'This order has already been fully refunded.' },
  refund_exceeds_captured_amount: {
    status: 400,
    message: 'The refund would exceed the amount still refundable on this order.',
  },
  missing_payment_id: { status: 400, message: 'This order has no captured payment to refund.' },
  unsupported_payment_provider: { status: 400, message: 'This order was not paid via Razorpay.' },
};

function mapRpcError(message: string): { status: number; message: string } {
  for (const [code, mapped] of Object.entries(ERROR_RESPONSES)) {
    if (message.includes(code)) return mapped;
  }
  return { status: 500, message: 'Could not update the return. Please try again.' };
}

const fail = (status: number, message: string) =>
  NextResponse.json({ error: { message } }, { status });

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: returnId } = await context.params;

  if (!z.string().uuid().safeParse(returnId).success) {
    return fail(400, 'Invalid return id.');
  }

  // ---- Auth: same session + role check as the admin refund route ----
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return fail(401, 'Not authenticated.');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = (profile as { role: UserRole } | null)?.role;
  if (profileError || !profile || (role !== 'admin' && role !== 'superadmin')) {
    return fail(403, 'Admin access required.');
  }

  const limit = rateLimit(`admin-refund:${user.id}`, RATE_LIMITS.adminRefund);
  if (!limit.success) {
    return NextResponse.json(
      { error: { message: 'Too many requests. Please slow down.' } },
      { status: 429, headers: rateLimitResponseHeaders(limit.retryAfterSeconds!) }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return fail(400, 'Invalid request body.');

  const { action, notes, restock } = parsed.data;
  const toStatus = ACTION_TO_STATUS[action];
  const service = createServiceClient();

  const { data: ret } = await service
    .from('order_returns')
    .select('id, status, order_id, order_item_id, quantity, refund_id')
    .eq('id', returnId)
    .maybeSingle<{
      id: string;
      status: string;
      order_id: string;
      order_item_id: string;
      quantity: number;
      refund_id: string | null;
    }>();

  if (!ret) return fail(404, 'Return not found.');

  let refundAmount: number | null = null;
  let razorpayRefundId: string | null = null;

  // ---------------- Money step (only for 'refunded') ----------------
  if (toStatus === 'refunded') {
    if (ret.status !== 'received') {
      return fail(409, 'A return can only be refunded after it is marked received.');
    }

    // A refund may already exist from an earlier attempt.
    let existing: { status: string; amount: number; razorpay_refund_id: string | null } | null = null;
    if (ret.refund_id) {
      const { data } = await service
        .from('refunds')
        .select('status, amount, razorpay_refund_id')
        .eq('id', ret.refund_id)
        .maybeSingle<{ status: string; amount: number; razorpay_refund_id: string | null }>();
      existing = data;
    }

    if (existing?.status === 'processing') {
      return fail(409, 'A refund for this return is already in progress.');
    }

    if (existing?.status === 'processed') {
      // Money already moved; only the return status is left to record.
      refundAmount = Number(existing.amount);
      razorpayRefundId = existing.razorpay_refund_id;
    } else {
      const [{ data: order }, { data: item }] = await Promise.all([
        service
          .from('orders')
          .select('id, order_number, subtotal, discount')
          .eq('id', ret.order_id)
          .maybeSingle<{ id: string; order_number: string; subtotal: number; discount: number }>(),
        service
          .from('order_items')
          .select('unit_price')
          .eq('id', ret.order_item_id)
          .maybeSingle<{ unit_price: number }>(),
      ]);

      if (!order || !item) return fail(404, 'Order item not found.');

      const subtotal = Number(order.subtotal);
      const discount = Number(order.discount ?? 0);
      const paidRatio = subtotal > 0 ? Math.max(0, (subtotal - discount) / subtotal) : 1;
      const amount = Math.round(Number(item.unit_price) * ret.quantity * paidRatio * 100) / 100;

      if (!Number.isFinite(amount) || amount <= 0) {
        return fail(400, 'Refund amount must be greater than zero.');
      }

      const idempotencyKey = randomUUID();
      const { data: initiated, error: initiateError } = await service.rpc('initiate_refund', {
        p_order_id: order.id,
        p_amount: amount,
        p_reason: `Return approved (${order.order_number})`,
        p_idempotency_key: idempotencyKey,
        p_initiated_by: user.id,
      });

      if (initiateError || !initiated) {
        const mapped = mapRpcError(initiateError?.message ?? '');
        return fail(mapped.status, mapped.message);
      }

      const { refund_id: refundId, razorpay_payment_id: razorpayPaymentId } = initiated as {
        refund_id: string;
        razorpay_payment_id: string;
      };

      // Link BEFORE calling Razorpay so a retry can see this attempt.
      const { error: linkError } = await service
        .from('order_returns')
        .update({ refund_id: refundId })
        .eq('id', returnId);

      if (linkError) {
        await service.rpc('finalize_refund', {
          p_refund_id: refundId,
          p_status: 'failed',
          p_razorpay_refund_id: null,
          p_error_message: 'Could not link refund to return.',
        });
        return fail(500, 'Could not start the refund. Please try again.');
      }

      try {
        const result = await createRazorpayRefund({
          razorpayPaymentId,
          amountInPaise: Math.round(amount * 100),
          idempotencyKey,
          notes: {
            internal_order_id: order.id,
            order_number: order.order_number,
            refund_id: refundId,
            return_id: returnId,
            source: 'return',
          },
        });
        razorpayRefundId = result.razorpayRefundId;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Razorpay refund request failed.';
        await service.rpc('finalize_refund', {
          p_refund_id: refundId,
          p_status: 'failed',
          p_razorpay_refund_id: null,
          p_error_message: message,
        });
        return fail(502, message);
      }

      const { error: finalizeError } = await service.rpc('finalize_refund', {
        p_refund_id: refundId,
        p_status: 'processed',
        p_razorpay_refund_id: razorpayRefundId,
        p_error_message: null,
      });

      if (finalizeError) {
        return fail(
          500,
          'Refund was processed by Razorpay but could not be recorded. Reference: ' + razorpayRefundId
        );
      }

      refundAmount = amount;
    }
  }

  // ---------------- Status step (all actions) ----------------
  const { data: updated, error: updateError } = await service.rpc('admin_update_return', {
    p_return_id: returnId,
    p_admin_id: user.id,
    p_to: toStatus,
    p_notes: notes ?? null,
    p_restock: restock ?? false,
    p_refund_amount: refundAmount,
  });

  if (updateError || !updated) {
    const mapped = mapRpcError(updateError?.message ?? '');
    const message =
      toStatus === 'refunded' && refundAmount !== null
        ? 'The refund was issued, but the return status could not be updated. Press "Mark refunded" again — it will not refund twice.'
        : mapped.message;
    return fail(mapped.status, message);
  }

  const result = updated as { id: string; order_id: string; order_number: string; status: string };

  await logAdminAction({
    action: 'return',
    entityType: 'order',
    entityId: result.order_id,
    entityLabel: result.order_number,
    detail: `Return ${returnId.slice(0, 8)} -> ${result.status}${notes ? ` — ${notes}` : ''}`,
    metadata: {
      return_id: returnId,
      status: result.status,
      refund_amount: refundAmount,
      razorpay_refund_id: razorpayRefundId,
      restock: restock ?? false,
    },
  });

  return NextResponse.json({
    returnId: result.id,
    orderId: result.order_id,
    status: result.status,
    refundAmount,
  });
}
