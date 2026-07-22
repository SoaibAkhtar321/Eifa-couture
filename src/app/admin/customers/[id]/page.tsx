import { notFound } from 'next/navigation';
import Link from 'next/link';

import { getCustomerDetail } from '@/lib/admin/customers-read';
import StatCard from '@/components/admin/StatCard';
import ErrorState from '@/components/admin/ErrorState';
import { formatPrice, formatDate } from '@/lib/utils';

export const metadata = { title: 'Customer detail' };

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-charcoal/10 text-charcoal/70',
  confirmed: 'bg-gold/15 text-gold',
  processing: 'bg-gold/15 text-gold',
  shipped: 'bg-maroon/10 text-maroon',
  out_for_delivery: 'bg-maroon/10 text-maroon',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  returned: 'bg-red-100 text-red-600',
  refunded: 'bg-charcoal/10 text-charcoal/50',
};

export default async function AdminCustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  const { data: customer, error } = await getCustomerDetail(id);

  if (error) {
    return <ErrorState message={error} />;
  }
  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/customers" className="text-sm text-charcoal/50 hover:text-maroon">
            ← Customers
          </Link>
          <h1 className="font-heading text-3xl text-maroon mt-1">{customer.displayName || 'Unnamed customer'}</h1>
          <p className="text-charcoal/60 mt-1">Registered {formatDate(customer.createdAt, 'long')}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            customer.isActive ? 'bg-green-100 text-green-800' : 'bg-charcoal/10 text-charcoal/50'
          }`}
        >
          {customer.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total orders" value={String(customer.totalOrders)} />
        <StatCard label="Total spending" value={formatPrice(customer.totalSpent)} />
        <StatCard label="Registered" value={formatDate(customer.createdAt, 'short')} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-lg border border-charcoal/10 bg-ivory p-5">
            <h2 className="font-heading text-lg text-maroon mb-4">Recent orders</h2>
            {customer.recentOrders.length === 0 ? (
              <p className="text-sm text-charcoal/50">No orders placed yet.</p>
            ) : (
              <div className="divide-y divide-charcoal/5">
                {customer.recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between gap-4 py-3 hover:bg-beige/30 -mx-2 px-2 rounded-md transition-colors"
                  >
                    <div>
                      <p className="font-medium text-charcoal">{order.orderNumber}</p>
                      <p className="text-xs text-charcoal/50">{formatDate(order.placedAt, 'short')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                          STATUS_BADGE[order.status] ?? 'bg-charcoal/10 text-charcoal/70'
                        }`}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </span>
                      <p className="text-charcoal w-24 text-right">{formatPrice(order.total)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-charcoal/10 bg-ivory p-5">
            <h2 className="font-heading text-lg text-maroon mb-3">Contact information</h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-charcoal/60">Phone</span>
                <span className="text-charcoal text-right">{customer.phone ?? '—'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-charcoal/60">Email</span>
                <span className="text-charcoal text-right break-all">{customer.email ?? '—'}</span>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-charcoal/10 bg-ivory p-5">
            <h2 className="font-heading text-lg text-maroon mb-3">Saved addresses</h2>
            {customer.addresses.length === 0 ? (
              <p className="text-sm text-charcoal/50">No saved addresses.</p>
            ) : (
              <div className="space-y-4">
                {customer.addresses.map((address) => (
                  <div key={address.id} className="border-t border-charcoal/5 pt-3 first:border-0 first:pt-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-charcoal capitalize">{address.type}</p>
                      {address.is_default && (
                        <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gold">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-charcoal">{address.full_name}</p>
                    <p className="text-sm text-charcoal/70">{address.phone}</p>
                    <p className="text-sm text-charcoal/80 leading-relaxed mt-1">
                      {address.address_line1}
                      {address.address_line2 ? `, ${address.address_line2}` : ''}
                      <br />
                      {address.city}, {address.state} {address.pincode}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
