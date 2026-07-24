import { notFound } from 'next/navigation';
import Link from 'next/link';

import { getOrderById, getOrderStatusHistory } from '@/lib/admin/orders';
import OrderStatusUpdate from '@/components/admin/orders/OrderStatusUpdate';
import OrderTimeline from '@/components/admin/orders/OrderTimeline';
import { formatPrice, formatDate } from '@/lib/utils';

export const metadata = { title: 'Order detail' };

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  // Run in parallel — the order and its history are independent
  // queries, so no reason to wait on one before starting the other.
  const [{ data: order, error }, { data: history }] = await Promise.all([
    getOrderById(id),
    getOrderStatusHistory(id),
  ]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        {error}
      </div>
    );
  }
  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/orders" className="text-sm text-charcoal/50 hover:text-maroon">
            ← Orders
          </Link>
          <h1 className="font-heading text-3xl text-maroon mt-1">{order.orderNumber}</h1>
          <p className="text-charcoal/60 mt-1">Placed {formatDate(order.placedAt, 'long')}</p>
        </div>
        <OrderStatusUpdate orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-lg border border-charcoal/10 bg-ivory p-5">
            <h2 className="font-heading text-lg text-maroon mb-4">Items</h2>
            <div className="divide-y divide-charcoal/5">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-beige/60">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-charcoal">{item.name}</p>
                    <p className="text-xs text-charcoal/50">
                      {item.size} · {item.colorName} · Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-charcoal">{formatPrice(item.unitPrice * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-1.5 border-t border-charcoal/10 pt-4 text-sm">
              <div className="flex justify-between text-charcoal/70">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-charcoal/70">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-charcoal/70">
                <span>Shipping</span>
                <span>{formatPrice(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between font-medium text-charcoal pt-1.5 border-t border-charcoal/10">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </section>

          <OrderTimeline
            status={order.status}
            placedAt={order.placedAt}
            updatedAt={order.updatedAt}
            history={history}
          />
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-charcoal/10 bg-ivory p-5">
            <h2 className="font-heading text-lg text-maroon mb-3">Customer</h2>
            <p className="text-sm text-charcoal">{order.shippingAddress.fullName}</p>
            <p className="text-sm text-charcoal/70">{order.shippingAddress.phone}</p>
            {order.shippingAddress.email && (
              <p className="text-sm text-charcoal/70">{order.shippingAddress.email}</p>
            )}
          </section>

          <section className="rounded-lg border border-charcoal/10 bg-ivory p-5">
            <h2 className="font-heading text-lg text-maroon mb-3">Shipping address</h2>
            <p className="text-sm text-charcoal/80 leading-relaxed">
              {order.shippingAddress.addressLine1}
              {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
            </p>
          </section>

          <section className="rounded-lg border border-charcoal/10 bg-ivory p-5">
            <h2 className="font-heading text-lg text-maroon mb-3">Payment</h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-charcoal/60">Method</span>
                <span className="capitalize text-charcoal">{order.paymentProvider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal/60">Status</span>
                <span className="capitalize text-charcoal">{order.paymentStatus}</span>
              </div>
              {order.paymentProviderRef && (
                <div className="flex justify-between">
                  <span className="text-charcoal/60">Reference</span>
                  <span className="text-charcoal">{order.paymentProviderRef}</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}