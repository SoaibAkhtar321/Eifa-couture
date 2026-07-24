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
     Events: payment.authorized, payment.captured, payment.failed
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
  } catch {
    // Misconfigured RAZORPAY_WEBHOOK_SECRET — fail closed.
    return NextResponse.json({ error: { message: 'Webhook not configured.' } }, { status: 500 });
  }

  if (!signatureValid) {
    return NextResponse.json({ error: { message: 'Invalid signature.' } }, { status: 400 });
  }

  let event: RazorpayWebhookPayload;
  try {
    event = JSON.parse(rawBody);
  } catch {
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
    return NextResponse.json({ received: true });
  }

  if (event.event === 'payment.authorized') {
    // Manual-capture flow: the payment is held/authorized but not yet
    // captured, so order/payment status don't change here — only
    // `payment.captured` (via mark_order_paid) settles the order. This
    // is a pure audit entry so an authorized-but-never-captured payment
    // still shows up in the timeline. Best-effort: a logging failure
    // must not turn into a 500, since Razorpay would just redeliver
    // forever for an event that doesn't require any state change.
    const { error: historyError } = await serviceClient.from('order_status_history').insert({
      order_id: order.id,
      event_type: 'payment_authorized',
      actor_type: 'webhook',
      notes: razorpayPaymentId,
    });

    if (historyError) {
      console.error('Failed to record payment_authorized history:', historyError.message);
    }

    return NextResponse.json({ received: true });
  }

  if (event.event === 'payment.captured') {
    const { error: rpcError } = await serviceClient.rpc('mark_order_paid', {
      p_order_id: order.id,
      p_razorpay_payment_id: razorpayPaymentId,
      p_razorpay_signature: signatureHeader,
      p_actor_type: 'webhook',
    });

    if (rpcError) {
      // Real failure (e.g. DB hiccup) — return 500 so Razorpay
      // retries this delivery later rather than silently losing it.
      return NextResponse.json({ error: { message: 'Failed to settle order.' } }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  }

  if (event.event === 'payment.failed') {
    const { error: rpcError } = await serviceClient.rpc('release_order_reservation', {
      p_order_id: order.id,
      p_reason: 'payment_failed',
      p_actor_type: 'webhook',
    });

    if (rpcError) {
      return NextResponse.json({ error: { message: 'Failed to release order.' } }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  }

  // Any other event type (refund.created, order.paid, etc.) — not
  // handled yet. Acknowledge so Razorpay stops retrying it.
  return NextResponse.json({ received: true });
}