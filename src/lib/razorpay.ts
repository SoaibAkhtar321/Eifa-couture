/* ============================================
   EIFA COUTURE — Razorpay Server Helpers
   ============================================
   Thin wrapper around the `razorpay` npm SDK plus the two signature
   verification schemes Razorpay uses:

     1. Checkout callback signature (order_id|payment_id, HMAC with
        key_secret) — verifies the payload the browser hands back to
        our /verify route after Checkout.js completes.
     2. Webhook signature (raw request body, HMAC with a SEPARATE
        webhook_secret configured in the Razorpay dashboard) — verifies
        server-to-server webhook deliveries.

   These are deliberately two different secrets/algorithms even though
   both are HMAC-SHA256, because they protect two different trust
   boundaries: the callback secret proves "this request round-tripped
   through Razorpay's Checkout for this specific order", while the
   webhook secret proves "this HTTP request actually came from
   Razorpay's servers". Never reuse one to verify the other.

   Server-only module — imports `razorpay` (which itself makes HTTP
   calls with the key secret), so this must never be imported into a
   Client Component.
   ============================================ */

import crypto from 'crypto';
import Razorpay from 'razorpay';

const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

function assertServerCredentials() {
  if (!keyId || !keySecret) {
    throw new Error(
      'Missing Razorpay server credentials. Ensure NEXT_PUBLIC_RAZORPAY_KEY_ID ' +
        'and RAZORPAY_KEY_SECRET are set (see .env.example).'
    );
  }
}

/**
 * Lazily-constructed singleton. Not built at module load time so that
 * importing this file in a context missing env vars (e.g. a build-time
 * static analysis pass) doesn't throw before we even know it's needed.
 */
let _instance: Razorpay | null = null;

export function getRazorpayInstance(): Razorpay {
  assertServerCredentials();

  if (!_instance) {
    _instance = new Razorpay({
      key_id: keyId!,
      key_secret: keySecret!,
    });
  }

  return _instance;
}

export interface CreateRazorpayOrderParams {
  /** Amount in the smallest currency unit (paise for INR). */
  amountInPaise: number;
  /** Our internal order id — stored as Razorpay order `receipt` and `notes`. */
  internalOrderId: string;
  /** Our internal order number, for readability in the Razorpay dashboard. */
  orderNumber: string;
}

export interface RazorpayOrderResult {
  razorpayOrderId: string;
  amount: number;
  currency: string;
}

/**
 * Creates a Razorpay Order (their term for a payment intent). Auto-
 * capture is the account-level default in the Razorpay dashboard —
 * this SDK call does not set `payment_capture` explicitly, so it
 * inherits whatever the dashboard is configured for. Confirm that's
 * set to "automatic capture" before going live, or payments will
 * authorize but never actually settle.
 */
export async function createRazorpayOrder(
  params: CreateRazorpayOrderParams
): Promise<RazorpayOrderResult> {
  const instance = getRazorpayInstance();

  const order = await instance.orders.create({
    amount: Math.round(params.amountInPaise),
    currency: 'INR',
    receipt: params.internalOrderId,
    notes: {
      internal_order_id: params.internalOrderId,
      order_number: params.orderNumber,
    },
  });

  return {
    razorpayOrderId: order.id,
    amount: Number(order.amount),
    currency: order.currency,
  };
}

/**
 * Verifies the signature Razorpay Checkout.js hands back to the
 * browser on payment success, which the client then forwards to our
 * /api/payments/razorpay/verify route. Formula per Razorpay docs:
 * HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret).
 *
 * Uses timingSafeEqual to avoid leaking signature-match timing info,
 * even though this is a low-value side channel here — cheap to do
 * right and there's no reason not to.
 */
export function verifyCheckoutSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  assertServerCredentials();

  const expected = crypto
    .createHmac('sha256', keySecret!)
    .update(`${params.razorpayOrderId}|${params.razorpayPaymentId}`)
    .digest('hex');

  return safeCompare(expected, params.razorpaySignature);
}

/**
 * Verifies the `X-Razorpay-Signature` header on incoming webhook
 * requests. MUST be called against the raw request body string —
 * not a re-serialized JSON.parse'd object — since any whitespace or
 * key-order difference will change the HMAC and reject a legitimate
 * webhook. Callers must read the request body as text before parsing.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
  if (!webhookSecret) {
    throw new Error(
      'Missing RAZORPAY_WEBHOOK_SECRET. Set it from the same value configured ' +
        'in the Razorpay dashboard under Settings → Webhooks (see .env.example).'
    );
  }

  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

  return safeCompare(expected, signatureHeader);
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  // timingSafeEqual throws on length mismatch rather than returning
  // false, and length itself can be a side channel, so check lengths
  // with a non-short-circuiting comparison-adjacent step first: pad
  // is unnecessary here since HMAC-SHA256 hex digests are always a
  // fixed 64 chars, but an attacker-supplied signature could be any
  // length, so we must guard the throw.
  if (bufA.length !== bufB.length) return false;

  return crypto.timingSafeEqual(bufA, bufB);
}