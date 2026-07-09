'use client';

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
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/order-confirmation/${order.id}`}
                className="flex items-center justify-between border border-beige bg-white p-5 transition-colors hover:border-gold"
              >
                <div>
                  <p className="font-heading text-lg text-charcoal">Order #{order.orderNumber}</p>
                  <p className="text-sm text-charcoal/55">
                    {new Date(order.placedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    · {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <OrderStatusBadge status={STATUS_LABELS[order.status] as 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'} />
                  <span className="text-sm text-charcoal/70">{formatPrice(order.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
