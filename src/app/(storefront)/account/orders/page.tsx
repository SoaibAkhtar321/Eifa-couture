'use client';

/* ============================================
   EIFA COUTURE — Account → Orders (list)
   ============================================
   Payment-state derivation mirrors order-confirmation/[orderId]/page.tsx
   (Phase 5) — see that file's header comment for why 'processing' and
   'cancelled' aren't literal `payment_status` values. Kept as a small
   local copy rather than a shared import so this list page and the
   detail page can each be pasted/verified independently, per the
   project's usual workflow.

   Both action buttons below route to the SAME destination
   (/order-confirmation/[orderId]) — that page is also the Order
   Details view and is where the actual Razorpay retry flow lives
   (script load, checkout modal, verify, polling). This page only
   decides *whether* to surface "Retry Payment" alongside "View Order".
   ============================================ */

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { useAuth } from '@/hooks/useAuth';
import { fetchOrders, type OrderSummary } from '@/lib/orders';
import { formatPrice } from '@/lib/utils';
import OrderStatusBadge from '@/components/account/OrderStatusBadge';

const STATUS_LABELS: Record<OrderSummary['status'], string> = {
  pending: 'Pending',
  confirmed: 'Processing',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Cancelled',
  refunded: 'Cancelled',
};

type PaymentUiState = 'pending' | 'successful' | 'failed' | 'cancelled';

function derivePaymentState(order: OrderSummary): PaymentUiState {
  if (order.paymentStatus === 'paid' || order.paymentStatus === 'refunded') return 'successful';
  if (order.paymentStatus === 'failed') {
    return order.status === 'cancelled' ? 'cancelled' : 'failed';
  }
  return 'pending';
}

const PAYMENT_BADGE_STYLES: Record<PaymentUiState, string> = {
  pending: 'bg-gold/15 text-gold',
  successful: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-600',
  cancelled: 'bg-charcoal/10 text-charcoal/70',
};

const PAYMENT_BADGE_LABELS: Record<PaymentUiState, string> = {
  pending: 'Payment Pending',
  successful: 'Payment Successful',
  failed: 'Payment Failed',
  cancelled: 'Payment Cancelled',
};

const PAYMENT_METHOD_LABELS: Record<OrderSummary['paymentProvider'], string> = {
  razorpay: 'Razorpay',
  stripe: 'Stripe',
  cod: 'Cash on Delivery',
  other: 'Other',
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

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function OrdersPage() {
  const { user, isLoading: isAuthLoading } = useAuth();

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading || !user) return;

    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setLoadError(null);

      const { data, error } = await fetchOrders(user.id);

      if (cancelled) return;

      if (error) setLoadError('We could not load your orders. Please try again.');
      else setOrders(data);

      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isAuthLoading]);

  return (
    <main className="bg-ivory">
      <section className="luxury-container py-10 sm:py-14 lg:py-20">
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-charcoal/45 sm:text-[11px]">
          <Link href="/account" className="hover:text-maroon">Account</Link>
          <span>/</span>
          <span className="text-charcoal/70">Orders</span>
        </nav>

        <h1 className="font-heading text-4xl text-charcoal sm:text-5xl">My Orders</h1>

        {isAuthLoading || (isLoading && !loadError) ? (
          <div className="mt-8 border border-beige bg-white p-8 text-center">
            <p className="text-sm text-charcoal/55">Loading your orders…</p>
          </div>
        ) : !user ? (
          <div className="mt-8 border border-beige bg-white p-8 text-center">
            <p className="text-sm text-charcoal/55">Please sign in to view your orders.</p>
            <Link href="/login" className="btn-luxury btn-luxury-primary mt-6 inline-flex">Sign In</Link>
          </div>
        ) : loadError ? (
          <div className="mt-8 border border-beige bg-white p-8 text-center">
            <p className="text-sm text-red-600">{loadError}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-8 border border-beige bg-white p-8 text-center">
            <p className="text-sm text-charcoal/55">You haven&apos;t placed any orders yet.</p>
            <Link href="/shop" className="btn-luxury btn-luxury-primary mt-6 inline-flex">Start Shopping</Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {orders.map((order) => {
              const paymentState = derivePaymentState(order);
              const needsRetry =
                order.paymentProvider === 'razorpay' &&
                (paymentState === 'pending' || paymentState === 'failed' || paymentState === 'cancelled');

              return (
                <div
                  key={order.id}
                  className="border border-beige bg-white p-5 transition-colors hover:border-gold/60"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-heading text-lg text-charcoal">Order #{order.orderNumber}</p>
                      <p className="text-sm text-charcoal/55">
                        {formatDate(order.placedAt)} · {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <OrderStatusBadge status={STATUS_LABELS[order.status] as 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'} />
                      <PaymentStateBadge state={paymentState} />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-x-6 gap-y-1 text-xs text-charcoal/55 sm:grid-cols-2 lg:grid-cols-4">
                    <p>
                      <span className="text-charcoal/40">Payment Method: </span>
                      {PAYMENT_METHOD_LABELS[order.paymentProvider]}
                    </p>

                    {order.paymentVerifiedAt && (
                      <p>
                        <span className="text-charcoal/40">Paid On: </span>
                        {formatDateTime(order.paymentVerifiedAt)}
                      </p>
                    )}

                    {order.razorpayOrderId && (
                      <p className="truncate" title={order.razorpayOrderId}>
                        <span className="text-charcoal/40">Razorpay Order ID: </span>
                        {order.razorpayOrderId}
                      </p>
                    )}

                    {order.razorpayPaymentId && (
                      <p className="truncate" title={order.razorpayPaymentId}>
                        <span className="text-charcoal/40">Razorpay Payment ID: </span>
                        {order.razorpayPaymentId}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <span className="text-sm text-charcoal/70">{formatPrice(order.total)}</span>

                    <div className="flex flex-wrap gap-3">
                      {needsRetry && (
                        <Link
                          href={`/order-confirmation/${order.id}`}
                          className="btn-luxury btn-luxury-primary text-center"
                        >
                          Retry Payment
                        </Link>
                      )}

                      <Link
                        href={`/order-confirmation/${order.id}`}
                        className="btn-luxury btn-luxury-secondary text-center"
                      >
                        View Order
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
