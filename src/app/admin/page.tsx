import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

import StatCard from '@/components/admin/StatCard';
import { formatPrice } from '@/lib/utils';

export const metadata = { title: 'Dashboard' };

async function getDashboardStats() {
  const supabase = await createClient();

  const [
    { count: productCount },
    { count: orderCount },
    { count: customerCount },
    { data: inventoryRows },
    { data: paidOrders },
    { count: returnsAwaitingReview },
  ] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('inventory').select('id, quantity, low_stock_at'),
    supabase.from('orders').select('total').eq('payment_status', 'paid'),
    supabase.from('order_returns').select('id', { count: 'exact', head: true }).eq('status', 'requested'),
  ]);

  const lowStockCount = (
    (inventoryRows ?? []) as { quantity: number; low_stock_at: number }[]
  ).filter((row) => row.quantity <= row.low_stock_at).length;

  const revenue = ((paidOrders ?? []) as { total: number }[]).reduce(
    (sum, row) => sum + row.total,
    0
  );

  return {
    productCount: productCount ?? 0,
    orderCount: orderCount ?? 0,
    customerCount: customerCount ?? 0,
    lowStockCount,
    revenue,
    returnsAwaitingReview: returnsAwaitingReview ?? 0,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-maroon">Dashboard</h1>
        <p className="text-ink-muted mt-1">An overview of your store, right now.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Revenue (paid orders)" value={formatPrice(stats.revenue)} />
        <StatCard label="Total orders" value={stats.orderCount.toLocaleString('en-IN')} />
        <StatCard label="Active products" value={stats.productCount.toLocaleString('en-IN')} />
        <StatCard
          label="Low stock variants"
          value={stats.lowStockCount.toLocaleString('en-IN')}
          tone={stats.lowStockCount > 0 ? 'warning' : 'default'}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Registered customers" value={stats.customerCount.toLocaleString('en-IN')} />
        <Link href="/admin/returns" className="block rounded-lg transition-shadow hover:shadow-md">
          <StatCard
            label="Returns awaiting review"
            value={stats.returnsAwaitingReview.toLocaleString('en-IN')}
            tone={stats.returnsAwaitingReview > 0 ? 'warning' : 'default'}
          />
        </Link>
      </div>

      <div className="rounded-lg border border-charcoal/10 bg-ivory p-6">
        <p className="text-sm text-ink-muted">
          Product, order, and customer management modules are coming next — this dashboard will
          gain trend charts and recent-activity feeds as those modules land.
        </p>
      </div>
    </div>
  );
}