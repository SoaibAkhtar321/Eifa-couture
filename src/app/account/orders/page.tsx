import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/ui/CartDrawer';

import { MOCK_ORDERS } from '@/lib/mock-data';
import { formatDate, formatPrice } from '@/lib/utils';

import type { Order, OrderStatus } from '@/types';

export const metadata: Metadata = {
  title: 'My Orders | Eifa Couture',
  description:
    'View your Eifa Couture order history, delivery status, and past handcrafted Chikankari purchases.',
};

const STATUS_META: Record<
  OrderStatus,
  { label: string; dot: string; text: string; bg: string }
> = {
  pending: {
    label: 'Pending',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
  },
  confirmed: {
    label: 'Confirmed',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
  },
  processing: {
    label: 'Processing',
    dot: 'bg-gold-dark',
    text: 'text-gold-dark',
    bg: 'bg-gold/10',
  },
  shipped: {
    label: 'Shipped',
    dot: 'bg-maroon',
    text: 'text-maroon',
    bg: 'bg-maroon/10',
  },
  out_for_delivery: {
    label: 'Out For Delivery',
    dot: 'bg-maroon',
    text: 'text-maroon',
    bg: 'bg-maroon/10',
  },
  delivered: {
    label: 'Delivered',
    dot: 'bg-emerald-600',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
  cancelled: {
    label: 'Cancelled',
    dot: 'bg-charcoal/40',
    text: 'text-charcoal/60',
    bg: 'bg-beige',
  },
  returned: {
    label: 'Returned',
    dot: 'bg-charcoal/40',
    text: 'text-charcoal/60',
    bg: 'bg-beige',
  },
  refunded: {
    label: 'Refunded',
    dot: 'bg-charcoal/40',
    text: 'text-charcoal/60',
    bg: 'bg-beige',
  },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] ${meta.bg} ${meta.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function OrderCard({ order }: { order: Order }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <article className="border border-beige bg-white p-5 sm:p-6 lg:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-beige pb-5">
        <div>
          <p className="font-body text-[10px] uppercase tracking-[0.24em] text-charcoal/45">
            Order Placed
          </p>

          <p className="mt-1.5 font-subheading text-sm text-charcoal">
            {formatDate(order.createdAt, 'long')}
          </p>

          <p className="mt-3 font-body text-[10px] uppercase tracking-[0.24em] text-charcoal/45">
            Order ID
          </p>

          <p className="mt-1.5 font-subheading text-sm font-medium text-maroon">
            {order.id}
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <StatusBadge status={order.status} />

          <p className="text-right font-heading text-2xl text-charcoal">
            {formatPrice(order.total)}
          </p>

          <p className="text-right text-xs text-charcoal/50">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>
      </div>

      <div className="divide-y divide-beige">
        {order.items.map((item, index) => (
          <div
            key={`${order.id}-${item.productId}-${index}`}
            className="flex items-center gap-4 py-4"
          >
            <div className="relative h-16 w-14 flex-shrink-0 overflow-hidden bg-cream sm:h-20 sm:w-16">
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="truncate font-heading text-lg text-charcoal sm:text-xl">
                {item.name}
              </h3>

              <p className="mt-1 text-xs text-charcoal/50">
                Size: {item.size} &middot; Colour: {item.color} &middot; Qty:{' '}
                {item.quantity}
              </p>
            </div>

            <p className="flex-shrink-0 text-sm font-medium text-charcoal">
              {formatPrice(item.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-beige pt-5">
        <p className="text-xs leading-6 text-charcoal/50">
          {order.trackingNumber
            ? `Tracking Number: ${order.trackingNumber}`
            : 'Tracking number will appear once your order ships.'}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/track-order?orderId=${order.id}`}
            className="font-body text-xs uppercase tracking-[0.2em] text-maroon transition-colors hover:text-gold"
          >
            Track Order →
          </Link>

          <Link
            href="/contact"
            className="font-body text-xs uppercase tracking-[0.2em] text-charcoal/45 transition-colors hover:text-maroon"
          >
            Need Help?
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function AccountOrdersPage() {
  const orders = [...MOCK_ORDERS].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <>
      <Header />

      <main className="bg-ivory">
        <section className="border-b border-beige bg-gradient-to-b from-cream/70 to-ivory">
          <div className="luxury-container py-6 sm:py-8 lg:py-12">
            <nav
              aria-label="Breadcrumb"
              className="mb-5 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-charcoal/45 sm:text-[11px]"
            >
              <Link href="/" className="hover:text-maroon">
                Home
              </Link>

              <span>/</span>

              <Link href="/account" className="hover:text-maroon">
                Account
              </Link>

              <span>/</span>

              <span className="text-charcoal/70">My Orders</span>
            </nav>

            <div className="max-w-2xl">
              <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.3em] text-gold sm:text-xs">
                Order History
              </span>

              <h1 className="font-heading text-4xl leading-tight text-charcoal sm:text-5xl lg:text-6xl">
                My Orders
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-charcoal/55 sm:text-base">
                Review your past and ongoing Eifa Couture orders, delivery
                status, and handcrafted pieces.
              </p>
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-14 lg:py-20">
          <div className="luxury-container">
            {orders.length === 0 ? (
              <div className="mx-auto max-w-xl border border-beige bg-white px-6 py-12 text-center">
                <h2 className="font-heading text-3xl text-charcoal">
                  No Orders Yet
                </h2>

                <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-charcoal/55">
                  When you place an order, it will show up here with full
                  tracking and delivery details.
                </p>

                <Link
                  href="/shop"
                  className="btn-luxury btn-luxury-primary mt-8 inline-flex"
                >
                  Explore Collection
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-7 flex flex-col gap-3 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="font-body text-[10px] uppercase tracking-[0.28em] text-gold sm:text-xs">
                      {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
                    </p>

                    <h2 className="mt-2 font-heading text-3xl text-charcoal sm:text-4xl">
                      Order History
                    </h2>
                  </div>

                  <Link
                    href="/shop"
                    className="font-body text-xs uppercase tracking-[0.2em] text-maroon transition-colors hover:text-gold"
                  >
                    Continue Shopping →
                  </Link>
                </div>

                <div className="space-y-5 sm:space-y-6">
                  {orders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
      <CartDrawer />
    </>
  );
}
