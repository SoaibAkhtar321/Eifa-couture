import StatCard from '@/components/admin/StatCard';
import RevenueChart from '@/components/admin/analytics/RevenueChart';
import OrderStatusBreakdown from '@/components/admin/analytics/OrderStatusBreakdown';
import TopProductsTable from '@/components/admin/analytics/TopProductsTable';
import TopCategoriesTable from '@/components/admin/analytics/TopCategoriesTable';
import AnalyticsRangeSwitch from '@/components/admin/analytics/AnalyticsRangeSwitch';
import { getAnalyticsOverview, type AnalyticsRange } from '@/lib/admin/analytics-read';
import { formatPrice } from '@/lib/utils';

export const metadata = { title: 'Analytics' };

interface AnalyticsPageProps {
  searchParams: Promise<{ range?: string }>;
}

const VALID_RANGES: AnalyticsRange[] = [7, 30, 90];

function parseRange(value: string | undefined): AnalyticsRange {
  const parsed = Number(value) as AnalyticsRange;
  return VALID_RANGES.includes(parsed) ? parsed : 30;
}

export default async function AdminAnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const params = await searchParams;
  const rangeDays = parseRange(params.range);

  const { data, error } = await getAnalyticsOverview(rangeDays);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-maroon">Analytics</h1>
          <p className="text-charcoal/60 mt-1">Revenue, orders, and top performers over time.</p>
        </div>
        <AnalyticsRangeSwitch active={rangeDays} />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Couldn&apos;t load analytics: {error}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Revenue (paid orders)" value={formatPrice(data.totals.revenue)} />
            <StatCard label="Orders" value={data.totals.orders.toLocaleString('en-IN')} />
            <StatCard label="Avg. order value" value={formatPrice(data.totals.averageOrderValue)} />
            <StatCard label="New customers" value={data.totals.newCustomers.toLocaleString('en-IN')} />
          </div>

          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6">
            <h2 className="font-heading text-lg text-maroon mb-4">Revenue trend</h2>
            <RevenueChart series={data.revenueSeries} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-lg border border-charcoal/10 bg-ivory p-6">
              <h2 className="font-heading text-lg text-maroon mb-4">Order status breakdown</h2>
              <OrderStatusBreakdown breakdown={data.statusBreakdown} />
            </div>

            <div className="rounded-lg border border-charcoal/10 bg-ivory p-6">
              <h2 className="font-heading text-lg text-maroon mb-4">Top categories by revenue</h2>
              <TopCategoriesTable categories={data.topCategories} />
            </div>
          </div>

          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6">
            <h2 className="font-heading text-lg text-maroon mb-4">Top products by revenue</h2>
            <TopProductsTable products={data.topProducts} />
          </div>
        </>
      )}
    </div>
  );
}
