'use client';

/* ============================================
   EIFA COUTURE — Order Confirmation
   ============================================
   Read-only summary for a single order, fetched by `orderId` from the
   route. This is intentionally NOT the checkout form — no cart, no
   Buy Now session, no `createOrder()` call. It exists purely to show
   the customer what they just bought (or what a past order looked
   like, when reached from Account → Orders).
   ============================================ */


import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import OrderStatusBadge from '@/components/account/OrderStatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { fetchOrderById, type OrderDetail } from '@/lib/orders';
import { formatPrice } from '@/lib/utils';
import type { OrderStatus } from '@/types/database';


const DEFAULT_PRODUCT_IMAGE = '/images/categories/kurtas.png';

// Mirrors the mapping in account/orders/page.tsx — kept in sync
// manually since that one isn't exported. If you change one, change
// both.
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Processing",
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Cancelled",
  refunded: "Cancelled",
};

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

export default function OrderConfirmationPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;

  const { user, isLoading: isAuthLoading } = useAuth();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

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

  const shippingAddress = (order?.shippingAddress ?? {}) as ShippingAddressSnapshot;

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
          ) : notFound || !order ? (
            <div className="mx-auto max-w-2xl border border-beige bg-white p-8 text-center">
              <p className="text-sm text-charcoal/55">We couldn&apos;t find this order.</p>
              <Link href="/account/orders" className="btn-luxury btn-luxury-primary mt-6 inline-flex">
                View My Orders
              </Link>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl">
              <div className="border border-gold/40 bg-white px-6 py-12 text-center shadow-sm sm:px-10">
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
                  Your order has been placed successfully. We&apos;ll send updates to your email
                  as it&apos;s processed and shipped.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <span className="font-heading text-lg text-charcoal">
                    Order #{order.orderNumber}
                  </span>

                  <OrderStatusBadge status={STATUS_LABELS[order.status]} />
                </div>

                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-charcoal/45">
                  Placed on {formatOrderDate(order.placedAt)}
                </p>

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link href="/shop" className="btn-luxury btn-luxury-primary text-center">
                    Continue Shopping
                  </Link>

                  <Link href="/account/orders" className="btn-luxury btn-luxury-secondary text-center">
                    View My Orders
                  </Link>
                </div>
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