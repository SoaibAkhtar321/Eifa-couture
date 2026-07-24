'use client';

/* ============================================
   EIFA COUTURE — Razorpay Client Helpers
   ============================================
   Browser-side counterpart to `lib/razorpay.ts` (which is server-only
   and must never be imported here). This file:

     1. Lazily injects the Razorpay Checkout.js script (once per page
        load, shared across retries).
     2. Wraps the two payment API routes (`/create-order`, `/verify`)
        with typed fetch helpers.
     3. Wraps `window.Razorpay` construction/`.open()` so the checkout
        page never touches the raw SDK shape directly.

   Retry / idempotency model: creating a Razorpay order for the same
   internal order id is idempotent server-side (see the API route), so
   this file is free to call `createRazorpayOrderForInternalOrder`
   again on retry without any special-casing — the server always
   returns the same `razorpayOrderId` for an unpaid order.
   ============================================ */

export interface RazorpayOrderResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  orderNumber: string;
}

export interface VerifyPaymentResponse {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
}

export type PaymentApiError = { message: string };

const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptPromise: Promise<boolean> | null = null;

/** Injects Checkout.js exactly once; concurrent/retry calls share the same promise. */
export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SCRIPT_SRC}"]`
    );

    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      scriptPromise = null; // allow a later retry to re-attempt the load
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return scriptPromise;
}

async function parseJsonResponse<T>(
  response: Response
): Promise<{ data: T | null; error: PaymentApiError | null }> {
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      data: null,
      error: json?.error ?? { message: 'Something went wrong. Please try again.' },
    };
  }

  return { data: json as T, error: null };
}

/**
 * Creates (or, on retry, fetches the existing) Razorpay Order for an
 * already-created internal order. Safe to call repeatedly.
 */
export async function createRazorpayOrderForInternalOrder(
  orderId: string
): Promise<{ data: RazorpayOrderResponse | null; error: PaymentApiError | null }> {
  try {
    const response = await fetch('/api/payments/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });

    return await parseJsonResponse<RazorpayOrderResponse>(response);
  } catch {
    return {
      data: null,
      error: { message: 'Could not reach the payment server. Check your connection.' },
    };
  }
}

/** Forwards Checkout.js's success callback payload to our /verify route. */
export async function verifyRazorpayPayment(payload: {
  orderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ data: VerifyPaymentResponse | null; error: PaymentApiError | null }> {
  try {
    const response = await fetch('/api/payments/razorpay/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return await parseJsonResponse<VerifyPaymentResponse>(response);
  } catch {
    return {
      data: null,
      error: { message: 'Could not verify your payment. Check your connection.' },
    };
  }
}

export interface OpenCheckoutParams {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  /** Fired once with the raw Checkout.js success payload. */
  onSuccess: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  /** Fired when the customer closes the modal without completing payment. */
  onDismiss: () => void;
}

interface RazorpayCheckoutInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckoutInstance;
  }
}

/**
 * Opens Razorpay's Checkout.js modal. Returns `false` (without
 * throwing) if the SDK script isn't loaded yet or the publishable key
 * is missing, so callers can show an inline error instead of crashing.
 */
export function openRazorpayCheckout(params: OpenCheckoutParams): boolean {
  if (typeof window === 'undefined' || !window.Razorpay) return false;

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!keyId) {
    console.error('NEXT_PUBLIC_RAZORPAY_KEY_ID is not set.');
    return false;
  }

  const rzp = new window.Razorpay({
    key: keyId,
    amount: params.amount,
    currency: params.currency,
    name: 'Eifa Couture',
    description: `Order ${params.orderNumber}`,
    order_id: params.razorpayOrderId,
    prefill: {
      name: params.customerName,
      email: params.customerEmail,
      contact: params.customerPhone ?? '',
    },
    theme: { color: '#5A0B22' },
    handler: (response: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => {
      params.onSuccess(response);
    },
    modal: {
      // Checkout.js only fires this when the customer dismisses the
      // modal themselves — it does NOT fire after `handler` runs.
      ondismiss: () => {
        params.onDismiss();
      },
    },
  });

  rzp.open();
  return true;
}