/* ============================================
   EIFA COUTURE — Razorpay Webhook Handler
   ============================================
   The AUTHORITATIVE settlement path. Unlike /api/payments/razorpay/verify
   (which depends on the customer's browser successfully calling back),
   this route is called directly by Razorpay's servers and is the
   source of truth for payment outcomes — it's what catches a paid
   order whose browser tab closed before the client-side verify call
   could fire, and what releases stock for payments that genuinely
   failed.

   Security: verified via HMAC over the RAW request body using
   RAZORPAY_WEBHOOK_SECRET (configured separately from the API
   key/secret, in the Razorpay dashboard's Webhooks section — see
   lib/razorpay.ts for why these are two different secrets). This is
   the ONLY auth on this route — there is no user session, since
   Razorpay's servers aren't a logged-in user. Do not add
   session/cookie-based checks here; they'd never pass.

   Idempotency: both `mark_order_paid` and `release_order_reservation`
   are idempotent RPCs, and Razorpay explicitly redelivers webhooks on
   timeout/non-2xx, so every branch below is safe to run more than
   once for the same event.

   Configure in Razorpay dashboard → Settings → Webhooks:
     URL: https://<your-domain>/api/webhooks/razorpay
     Events: payment.captured, payment.failed
   ============================================ */

import { NextResponse, type NextRequest } from 'next/server';

import { verifyWebhookSignature } from '@/lib/razorpay';
import { createServiceClient } from '@/lib/supabase/service';

interface RazorpayWebhookPayload {
  event: string;
  payload: {
    payment?: {
      entity?: {
        id: string;
        order_id: string;
        notes?: { internal_order_id?: string };
      };
    };
  };
}

export async function POST(request: NextRequest) {
  // MUST read as raw text for signature verification — parsing to
  // JSON and re-stringifying would change whitespace/key order and
  // break the HMAC comparison against Razorpay's signature.
  const rawBody = await request.text();
  const signatureHeader = request.headers.get('x-razorpay-signature');

  if (!signatureHeader) {
    return NextResponse.json({ error: { message: 'Missing signature.' } }, { status: 400 });
  }

  let signatureValid: boolean;
  try {
    signatureValid = verifyWebhookSignature(rawBody, signatureHeader);
  } catch (err) {
    // Misconfigured RAZORPAY_WEBHOOK_SECRET — fail closed.
    console.error('[webhooks/razorpay] Webhook secret not configured', {
      error: err instanceof Error ? err.message : err,
    });
    return NextResponse.json({ error: { message: 'Webhook not configured.' } }, { status: 500 });
  }

  if (!signatureValid) {
    console.error('[webhooks/razorpay] Invalid webhook signature — request rejected.');
    return NextResponse.json({ error: { message: 'Invalid signature.' } }, { status: 400 });
  }

  let event: RazorpayWebhookPayload;
  try {
    event = JSON.parse(rawBody);
  } catch {
    console.error('[webhooks/razorpay] Payload was not valid JSON despite a valid signature.');
    return NextResponse.json({ error: { message: 'Invalid JSON.' } }, { status: 400 });
  }

  const paymentEntity = event.payload?.payment?.entity;

  if (!paymentEntity) {
    // Event type we don't act on (e.g. refund events). Acknowledge
    // with 200 so Razorpay doesn't retry it forever.
    return NextResponse.json({ received: true });
  }

  const razorpayOrderId = paymentEntity.order_id;
  const razorpayPaymentId = paymentEntity.id;

  const serviceClient = createServiceClient();

  // Look up our internal order by the Razorpay order id we stamped
  // onto payment_provider_ref in the create-order route — this is the
  // join key between "their" order and "ours".
  const { data: order, error: fetchError } = await serviceClient
    .from('orders')
    .select('id, payment_status')
    .eq('payment_provider_ref', razorpayOrderId)
    .maybeSingle<{ id: string; payment_status: string }>();

  if (fetchError || !order) {
    // Nothing we can match this to. Acknowledge anyway — retrying
    // won't make a matching order appear, and returning non-2xx here
    // just causes Razorpay to hammer us with retries indefinitely.
    console.error('[webhooks/razorpay] No order matches payment_provider_ref', {
      event: event.event,
      razorpayOrderId,
    });
    return NextResponse.json({ received: true });
  }

  if (event.event === 'payment.captured') {
    const { data: result, error: rpcError } = await serviceClient.rpc('mark_order_paid', {
      p_order_id: order.id,
      p_razorpay_payment_id: razorpayPaymentId,
      p_razorpay_signature: signatureHeader,
    });

    if (rpcError) {
      // Real failure (e.g. DB hiccup) — return 500 so Razorpay
      // retries this delivery later rather than silently losing it.
      console.error('[webhooks/razorpay] mark_order_paid RPC failed', {
        orderId: order.id,
        razorpayPaymentId,
        error: rpcError.message,
      });
      return NextResponse.json({ error: { message: 'Failed to settle order.' } }, { status: 500 });
    }

    if (result?.needs_stock_review) {
      // See migration 0016 — payment settled after this order's
      // reservation had already been released and current stock
      // couldn't fully cover it. Never blocks the webhook ack;
      // surfaced purely for ops reconciliation.
      console.warn('[webhooks/razorpay] Order paid but needs stock review', {
        orderId: order.id,
        orderNumber: result.order_number,
      });
    }

    return NextResponse.json({ received: true });
  }

  if (event.event === 'payment.failed') {
    const { error: rpcError } = await serviceClient.rpc('release_order_reservation', {
      p_order_id: order.id,
      p_reason: 'payment_failed',
    });

    if (rpcError) {
      console.error('[webhooks/razorpay] release_order_reservation RPC failed', {
        orderId: order.id,
        error: rpcError.message,
      });
      return NextResponse.json({ error: { message: 'Failed to release order.' } }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  }

  // Any other event type (refund.created, order.paid, etc.) — not
  // handled yet. Acknowledge so Razorpay stops retrying it.
  return NextResponse.json({ received: true });
}