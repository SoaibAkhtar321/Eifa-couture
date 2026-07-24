'use client';

/* ============================================
   EIFA COUTURE — Order Confirmation
   ============================================
   Read-only summary for a single order, fetched by `orderId` from the
   route. This is intentionally NOT the checkout form — no cart, no
   Buy Now session, no `createOrder()` call. It exists purely to show
   the customer what they just bought (or what a past order looked
   like, when reached from Account → Orders), and to carry them
   through the rest of the Razorpay payment lifecycle when the first
   attempt didn't finish cleanly.

   Payment state mapping (see lib/orders.ts + migration 0015 — there
   is no literal 'processing'/'cancelled' payment_status column, so
   these are derived):
     - successful  → payment_status = 'paid' (or 'refunded', post-hoc)
     - cancelled   → payment_status = 'failed' AND status = 'cancelled'
     - failed      → payment_status = 'failed' AND status != 'cancelled'
     - pending     → payment_status = 'pending'
     - processing  → not persisted; it's this component's own transient
                      phase while a retry's verify() call is in flight,
                      right after Razorpay's handler fires and before we
                      know whether it settled.

   Retry Payment reuses lib/payments.ts (Phase 3/4, already built):
   createRazorpayOrderForInternalOrder() is idempotent server-side for
   an unpaid order, so calling it again here never re-runs the
   Postgres `create_order` RPC and never touches inventory reservation
   — that only ever happens once, at initial checkout.
   ============================================ */


import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';
import { fetchOrderById, type OrderDetail } from '@/lib/orders';
import {
  createRazorpayOrderForInternalOrder,
  loadRazorpayScript,
  openRazorpayCheckout,
  verifyRazorpayPayment,
} from '@/lib/payments';
import { formatPrice } from '@/lib/utils';


const DEFAULT_PRODUCT_IMAGE = '/images/categories/kurtas.png';

type PaymentUiState = 'pending' | 'processing' | 'successful' | 'failed' | 'cancelled';

type RetryPhase = 'idle' | 'launching' | 'awaiting_payment' | 'verifying';

// `shipping_address` is stored as a jsonb snapshot (see
// `addressToShippingSnapshot` in lib/orders.ts), so OrderDetail types
// it loosely as Record<string, unknown>. This narrows it for display.
interface ShippingAddressSnapshot {
  full_name?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
}

function formatOrderDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatOrderDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function derivePaymentState(order: OrderDetail, isRetryInFlight: boolean): PaymentUiState {
  if (isRetryInFlight) return 'processing';
  if (order.paymentStatus === 'paid' || order.paymentStatus === 'refunded') return 'successful';
  if (order.paymentStatus === 'failed') {
    return order.status === 'cancelled' ? 'cancelled' : 'failed';
  }
  return 'pending';
}

const PAYMENT_BADGE_STYLES: Record<PaymentUiState, string> = {
  pending: 'bg-gold/15 text-gold',
  processing: 'bg-gold/15 text-gold',
  successful: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-600',
  cancelled: 'bg-charcoal/10 text-charcoal/70',
};

const PAYMENT_BADGE_LABELS: Record<PaymentUiState, string> = {
  pending: 'Payment Pending',
  processing: 'Processing Payment',
  successful: 'Payment Successful',
  failed: 'Payment Failed',
  cancelled: 'Payment Cancelled',
};

function PaymentStateBadge({ state }: { state: PaymentUiState }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.15em] ${PAYMENT_BADGE_STYLES[state]}`}
    >
      {PAYMENT_BADGE_LABELS[state]}
    </span>
  );
}

export default function OrderConfirmationPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;

  const { user, isLoading: isAuthLoading } = useAuth();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [retryPhase, setRetryPhase] = useState<RetryPhase>('idle');
  const [retryError, setRetryError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!user || !orderId) return null;

    const { data, error } = await fetchOrderById(user.id, orderId);
    if (error) return null;
    if (data) setOrder(data);
    return data;
  }, [user, orderId]);

  useEffect(() => {
    if (isAuthLoading || !user || !orderId) return;

    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setLoadError(null);
      setNotFound(false);

      const { data, error } = await fetchOrderById(user.id, orderId);

      if (cancelled) return;

      if (error) {
        setLoadError('We could not load this order. Please try again.');
      } else if (!data) {
        setNotFound(true);
      } else {
        setOrder(data);
      }

      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isAuthLoading, orderId]);

  /**
   * Polls fetchOrderById a few times before giving up. Used only when
   * the client-side verify() call itself errored (e.g. dropped
   * connection) after Razorpay already reported success — the
   * webhook (already built, Phase 3) may still confirm the payment
   * independently, and this lets the page catch up to that instead
   * of leaving the customer on a stale "pending" screen.
   */
  const pollForConfirmation = useCallback(
    async (maxAttempts = 5, intervalMs = 3000) => {
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
        const data = await loadOrder();
        if (data && data.paymentStatus !== 'pending') return;
      }
    },
    [loadOrder]
  );

  const handleRetryPayment = async () => {
    if (!order || !user) return;

    setRetryError(null);
    setRetryPhase('launching');

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setRetryError('Could not load the payment gateway. Please check your connection and try again.');
      setRetryPhase('idle');
      return;
    }

    const { data: razorpayOrder, error: razorpayError } = await createRazorpayOrderForInternalOrder(
      order.id
    );

    if (razorpayError || !razorpayOrder) {
      setRetryError(razorpayError?.message ?? 'Could not initiate payment. Please try again.');
      setRetryPhase('idle');
      return;
    }

    setRetryPhase('awaiting_payment');

    const shippingAddress = (order.shippingAddress ?? {}) as ShippingAddressSnapshot;

    const opened = openRazorpayCheckout({
      razorpayOrderId: razorpayOrder.razorpayOrderId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderNumber: razorpayOrder.orderNumber,
      customerName: shippingAddress.full_name ?? user.email ?? '',
      customerEmail: user.email ?? '',
      customerPhone: shippingAddress.phone,
      onSuccess: async (response) => {
        setRetryPhase('verifying');

        const { data: verified, error: verifyError } = await verifyRazorpayPayment({
          orderId: order.id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });

        if (verifyError || !verified) {
          // Fast-path verification failed, but the webhook may still
          // settle it — poll briefly instead of immediately showing
          // an error.
          await pollForConfirmation();
          setRetryPhase('idle');
          return;
        }

        await loadOrder();
        setRetryPhase('idle');
      },
      onDismiss: () => {
        setRetryError("Payment was not completed. You can retry whenever you're ready.");
        setRetryPhase('idle');
      },
    });

    if (!opened) {
      setRetryError('Could not open the payment window. Please try again.');
      setRetryPhase('idle');
    }
  };

  const shippingAddress = (order?.shippingAddress ?? {}) as ShippingAddressSnapshot;
  const paymentState: PaymentUiState | null = order ? derivePaymentState(order, retryPhase === 'verifying') : null;
  const isRetryBusy = retryPhase === 'launching' || retryPhase === 'awaiting_payment';

  const retryButton = (
    <button
      type="button"
      onClick={handleRetryPayment}
      disabled={isRetryBusy}
      className="btn-luxury btn-luxury-primary text-center disabled:cursor-not-allowed disabled:opacity-60"
    >
      {retryPhase === 'launching' && 'Preparing Payment…'}
      {retryPhase === 'awaiting_payment' && 'Waiting For Payment…'}
      {(retryPhase === 'idle' || retryPhase === 'verifying') && 'Retry Payment'}
    </button>
  );

  return (
    <main className="bg-ivory">
      <section className="border-b border-beige bg-gradient-to-b from-cream/70 to-ivory">
        <div className="luxury-container py-5 sm:py-6">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-charcoal/45 sm:text-[11px]"
          >
            <Link href="/" className="hover:text-maroon">
              Home
            </Link>

            <span>/</span>

            <Link href="/account/orders" className="hover:text-maroon">
              Orders
            </Link>

            <span>/</span>

            <span className="text-charcoal/70">Confirmation</span>
          </nav>
        </div>
      </section>

      <section className="py-8 sm:py-12 lg:py-16">
        <div className="luxury-container">
          {isAuthLoading || (isLoading && !order) ? (
            <div className="mx-auto max-w-2xl border border-beige bg-white p-8 text-center">
              <p className="text-sm text-charcoal/55">Loading your order…</p>
            </div>
          ) : !user ? (
            <div className="mx-auto max-w-2xl border border-beige bg-white p-8 text-center">
              <p className="text-sm text-charcoal/55">Please sign in to view this order.</p>
              <Link
                href={`/login?redirect=${encodeURIComponent(`/order-confirmation/${orderId}`)}`}
                className="btn-luxury btn-luxury-primary mt-6 inline-flex"
              >
                Sign In
              </Link>
            </div>
          ) : loadError ? (
            <div className="mx-auto max-w-2xl border border-beige bg-white p-8 text-center">
              <p className="text-sm text-red-600">{loadError}</p>
            </div>
          ) : notFound || !order || !paymentState ? (
            <div className="mx-auto max-w-2xl border border-beige bg-white p-8 text-center">
              <p className="text-sm text-charcoal/55">We couldn&apos;t find this order.</p>
              <Link href="/account/orders" className="btn-luxury btn-luxury-primary mt-6 inline-flex">
                View My Orders
              </Link>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl">
              <div className="border border-gold/40 bg-white px-6 py-12 text-center shadow-sm sm:px-10">
                {paymentState === 'processing' ? (
                  <>
                    <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-2xl text-gold">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                    </span>

                    <PaymentStateBadge state="processing" />

                    <h1 className="mt-4 font-heading text-3xl text-charcoal sm:text-4xl">
                      Confirming Your Payment
                    </h1>

                    <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-charcoal/55 sm:text-base">
                      This usually takes just a few seconds. We&apos;ll update this page
                      automatically the moment your payment is confirmed — please don&apos;t
                      close this window.
                    </p>
                  </>
                ) : paymentState === 'successful' ? (
                  <>
                    <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-2xl text-gold">
                      ✓
                    </span>

                    <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.3em] text-gold sm:text-xs">
                      Order Confirmed
                    </span>

                    <h1 className="font-heading text-3xl text-charcoal sm:text-4xl">
                      Thank You For Your Order
                    </h1>

                    <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-charcoal/55 sm:text-base">
                      Your payment was successful and your order has been placed. We&apos;ll
                      send updates to your email as it&apos;s processed and shipped.
                    </p>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      <span className="font-heading text-lg text-charcoal">
                        Order #{order.orderNumber}
                      </span>

                      <PaymentStateBadge state="successful" />
                    </div>

                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-charcoal/45">
                      Placed on {formatOrderDate(order.placedAt)}
                    </p>

                    {order.paymentProvider === 'razorpay' && (
                      <div className="mx-auto mt-6 max-w-sm space-y-1.5 border-t border-beige pt-5 text-left text-xs text-charcoal/55">
                        {order.paymentVerifiedAt && (
                          <p>
                            <span className="text-charcoal/40">Paid on:</span>{' '}
                            {formatOrderDateTime(order.paymentVerifiedAt)}
                          </p>
                        )}
                        {order.razorpayPaymentId && (
                          <p>
                            <span className="text-charcoal/40">Payment ID:</span>{' '}
                            {order.razorpayPaymentId}
                          </p>
                        )}
                        {order.razorpayOrderId && (
                          <p>
                            <span className="text-charcoal/40">Razorpay Order ID:</span>{' '}
                            {order.razorpayOrderId}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                      <Link href="/shop" className="btn-luxury btn-luxury-primary text-center">
                        Continue Shopping
                      </Link>

                      <Link href="/account/orders" className="btn-luxury btn-luxury-secondary text-center">
                        View My Orders
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-2xl text-gold">
                      {paymentState === 'pending' ? '⏳' : '✕'}
                    </span>

                    <PaymentStateBadge state={paymentState} />

                    <h1 className="mt-4 font-heading text-3xl text-charcoal sm:text-4xl">
                      {paymentState === 'pending' && 'Your Payment Is Still Pending'}
                      {paymentState === 'failed' && 'Your Payment Did Not Go Through'}
                      {paymentState === 'cancelled' && 'This Order Was Cancelled'}
                    </h1>

                    <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-charcoal/55 sm:text-base">
                      {paymentState === 'pending' &&
                        "We placed your order but haven't received your payment yet. Complete payment now to confirm it — nothing will be charged twice."}
                      {paymentState === 'failed' &&
                        "We couldn't confirm payment for this order. This can happen if the payment was declined or the connection dropped mid-way. No amount has been charged for this attempt — you can safely retry."}
                      {paymentState === 'cancelled' &&
                        'This order was cancelled before payment was completed and any reserved stock has been released. You can retry payment if the items are still available.'}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      <span className="font-heading text-lg text-charcoal">
                        Order #{order.orderNumber}
                      </span>
                    </div>

                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-charcoal/45">
                      Placed on {formatOrderDate(order.placedAt)}
                    </p>

                    {retryError && (
                      <p className="mx-auto mt-4 max-w-md text-sm text-red-600">{retryError}</p>
                    )}

                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                      {order.paymentProvider === 'razorpay' && retryButton}

                      <Link href="/account/orders" className="btn-luxury btn-luxury-secondary text-center">
                        View My Orders
                      </Link>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
                <div className="border border-beige bg-white p-5 sm:p-6">
                  <h2 className="font-heading text-2xl text-charcoal">Order Items</h2>

                  <div className="mt-5 divide-y divide-beige/70">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-4 py-4">
                        <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-beige">
                          <Image
                            src={item.imageUrl || DEFAULT_PRODUCT_IMAGE}
                            alt={item.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 font-subheading text-base leading-snug text-charcoal">
                            {item.name}
                          </h3>

                          <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-charcoal/45">
                            {item.size} / {item.colorName}
                          </p>

                          <p className="mt-2 text-sm text-charcoal/60">Qty: {item.quantity}</p>
                        </div>

                        <p className="shrink-0 text-sm text-charcoal">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <aside className="h-fit space-y-6">
                  <div className="border border-beige bg-white p-5 sm:p-6">
                    <h2 className="font-heading text-xl text-charcoal">Delivery Address</h2>

                    <div className="mt-4 text-sm leading-7 text-charcoal/60">
                      <p className="font-subheading text-charcoal">{shippingAddress.full_name}</p>

                      <p>
                        {shippingAddress.address_line1}
                        {shippingAddress.address_line2 ? `, ${shippingAddress.address_line2}` : ''}
                      </p>

                      <p>
                        {shippingAddress.city}, {shippingAddress.state} — {shippingAddress.pincode}
                      </p>

                      <p>Phone: {shippingAddress.phone}</p>
                    </div>
                  </div>

                  <div className="border border-beige bg-white p-5 sm:p-6">
                    <h2 className="font-heading text-xl text-charcoal">Order Summary</h2>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between text-sm text-charcoal/60">
                        <span>Subtotal</span>
                        <span>{formatPrice(order.subtotal)}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm text-charcoal/60">
                        <span>Shipping</span>
                        <span>
                          {order.shippingFee === 0 ? 'Complimentary' : formatPrice(order.shippingFee)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-beige pt-4">
                        <span className="font-body text-xs uppercase tracking-[0.2em] text-charcoal/55">
                          Total
                        </span>

                        <span className="font-heading text-2xl text-charcoal">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
