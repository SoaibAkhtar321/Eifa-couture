import Link from 'next/link';
import OrderStatusBadge from '@/components/account/OrderStatusBadge';

export const metadata = { title: 'My Orders | Eifa Couture' };

// Placeholder data — replace with Supabase query on `orders` table.
const orders: { id: string; date: string; status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'; total: string }[] = [];

export default function OrdersPage() {
  return (
    <main className="bg-ivory">
      <section className="luxury-container py-10 sm:py-14 lg:py-20">
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-charcoal/45 sm:text-[11px]">
          <Link href="/account" className="hover:text-maroon">Account</Link>
          <span>/</span>
          <span className="text-charcoal/70">Orders</span>
        </nav>

        <h1 className="font-heading text-4xl text-charcoal sm:text-5xl">My Orders</h1>

        {orders.length === 0 ? (
          <div className="mt-8 border border-beige bg-white p-8 text-center">
            <p className="text-sm text-charcoal/55">You haven&apos;t placed any orders yet.</p>
            <Link href="/shop" className="btn-luxury btn-luxury-primary mt-6 inline-flex">Start Shopping</Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between border border-beige bg-white p-5">
                <div>
                  <p className="font-heading text-lg text-charcoal">Order #{order.id}</p>
                  <p className="text-sm text-charcoal/55">{order.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <OrderStatusBadge status={order.status} />
                  <span className="text-sm text-charcoal/70">{order.total}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}