/* ============================================
   EIFA COUTURE — Razorpay Verify Route
   ============================================
   Called by the client immediately after Razorpay Checkout's
   `handler` callback fires with a successful payment. This is the
   FAST path to marking an order paid (the webhook in
   /api/webhooks/razorpay is the durable/authoritative path that
   covers cases where the browser never gets to call this — tab
   closed, network drop, etc.).

   Both paths converge on the same `mark_order_paid` RPC, which is
   idempotent (see migration 0015), so whichever fires first wins and
   the other is a no-op. This route does NOT trust the client-supplied
   order id/payment id pairing until the HMAC signature proves it came
   from a genuine Razorpay Checkout completion for the order we
   created — that's the entire point of `verifyCheckoutSignature`.
   ============================================ */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { getClientIp, rateLimit, rateLimitResponseHeaders, RATE_LIMITS } from '@/lib/rate-limit';
import { verifyCheckoutSignature } from '@/lib/razorpay';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import type { DbOrder } from '@/types/database';

const bodySchema = z.object({
  orderId: z.string().uuid(),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit(`razorpay-verify:${ip}`, RATE_LIMITS.razorpayVerify);

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

  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  // Session-scoped: confirms the caller actually owns this order
  // before we do anything with it.
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: { message: 'Not authenticated.' } }, { status: 401 });
  }

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, order_number, payment_provider_ref, payment_status')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .maybeSingle<Pick<DbOrder, 'id' | 'order_number' | 'payment_provider_ref' | 'payment_status'>>();

  if (fetchError || !order) {
    return NextResponse.json({ error: { message: 'Order not found.' } }, { status: 404 });
  }

  // The order's stored payment_provider_ref must match the
  // razorpay_order_id the client is presenting — otherwise a customer
  // could take a valid signature from THEIR OWN completed payment and
  // replay it against a different order id of theirs (or, if this
  // check were missing, of anyone's).
  if (order.payment_provider_ref !== razorpay_order_id) {
    return NextResponse.json(
      { error: { message: 'Payment does not match this order.' } },
      { status: 400 }
    );
  }

  const signatureValid = verifyCheckoutSignature({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  });

  if (!signatureValid) {
    // Signal only — never log the signature/payment id values
    // themselves, since a bad signature could originate from a
    // tampering attempt and we don't want to help an attacker
    // correlate probes via log output.
    console.error('[razorpay/verify] Signature verification failed', {
      orderId,
      razorpayOrderId: razorpay_order_id,
    });
    return NextResponse.json(
      { error: { message: 'Payment signature verification failed.' } },
      { status: 400 }
    );
  }

  // Signature is proven genuine — now settle via the service-role
  // RPC. mark_order_paid is idempotent, so if the webhook already
  // beat us to it, this is a safe no-op that just confirms success.
  const serviceClient = createServiceClient();
  const { data: result, error: rpcError } = await serviceClient.rpc('mark_order_paid', {
    p_order_id: orderId,
    p_razorpay_payment_id: razorpay_payment_id,
    p_razorpay_signature: razorpay_signature,
    // This route only ever runs off the customer's own browser callback
    // after Razorpay Checkout completes, so the history row attributes
    // the settlement to them rather than the webhook.
    p_actor_type: 'customer',
  });

  if (rpcError) {
    console.error('[razorpay/verify] mark_order_paid RPC failed', {
      orderId,
      razorpayPaymentId: razorpay_payment_id,
      error: rpcError.message,
    });
    return NextResponse.json(
      { error: { message: 'Could not confirm payment. Please contact support.' } },
      { status: 500 }
    );
  }

  if (result?.needs_stock_review) {
    // Payment succeeded but this order's reservation had already been
    // released (declined-card retry, or retry after the 30-minute
    // stale-reservation sweep) and current stock couldn't fully cover
    // it — see migration 0016. Never blocks the customer; surfaced
    // here purely so ops can reconcile.
    console.warn('[razorpay/verify] Order paid but needs stock review', {
      orderId,
      orderNumber: result.order_number,
    });
  }

  return NextResponse.json({
    id: result.id,
    orderNumber: result.order_number,
    status: result.status,
    paymentStatus: result.payment_status,
  });
}