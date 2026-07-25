import StatCard from '@/components/admin/StatCard';
import FinanceRangeSwitch from '@/components/admin/finance/FinanceRangeSwitch';
import FinanceExportButtons from '@/components/admin/finance/FinanceExportButtons';
import SeriesChart from '@/components/admin/finance/SeriesChart';
import PaymentMethodBreakdown from '@/components/admin/finance/PaymentMethodBreakdown';
import RefundAnalyticsSection from '@/components/admin/finance/RefundAnalyticsSection';
import { getFinanceOverview } from '@/lib/admin/finance-read';
import type { FinancePreset } from '@/lib/admin/finance-range';
import { formatPrice } from '@/lib/utils';

export const metadata = { title: 'Finance' };

interface FinancePageProps {
  searchParams: Promise<{ range?: string; start?: string; end?: string }>;
}

const VALID_PRESETS: FinancePreset[] = [
  'today',
  'yesterday',
  'last7',
  'last30',
  'thisMonth',
  'lastMonth',
  'custom',
];

function parsePreset(value: string | undefined): FinancePreset {
  return VALID_PRESETS.includes(value as FinancePreset) ? (value as FinancePreset) : 'last30';
}

export default async function AdminFinancePage({ searchParams }: FinancePageProps) {
  const params = await searchParams;
  const preset = parsePreset(params.range);

  const { data, range, error } = await getFinanceOverview(preset, params.start, params.end);

  const rangeQuery = new URLSearchParams({
    range: preset,
    ...(preset === 'custom' && params.start ? { start: params.start } : {}),
    ...(preset === 'custom' && params.end ? { end: params.end } : {}),
  }).toString();

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-maroon">Finance</h1>
          <p className="text-charcoal/60 mt-1">
            Revenue, payments, and refunds
            {' — '}
            {range.start.slice(0, 10)} to {range.end.slice(0, 10)}
          </p>
        </div>
        <div className="flex flex-col items-start lg:items-end gap-3">
          <FinanceRangeSwitch active={preset} customStart={params.start} customEnd={params.end} />
          <FinanceExportButtons rangeQuery={rangeQuery} />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Couldn&apos;t load finance data: {error}
        </div>
      )}

      {data && (
        <>
          {/* ---------- Headline cards ---------- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Revenue" value={formatPrice(data.totals.totalRevenue)} />
            <StatCard label="Gross Revenue" value={formatPrice(data.totals.grossRevenue)} />
            <StatCard label="Net Revenue" value={formatPrice(data.totals.netRevenue)} />
            <StatCard label="Total Orders" value={data.totals.totalOrders.toLocaleString('en-IN')} />
            <StatCard label="Successful Payments" value={data.totals.successfulPayments.toLocaleString('en-IN')} />
            <StatCard
              label="Failed Payments"
              value={data.totals.failedPayments.toLocaleString('en-IN')}
              tone={data.totals.failedPayments > 0 ? 'warning' : 'default'}
            />
            <StatCard label="Pending Payments" value={data.totals.pendingPayments.toLocaleString('en-IN')} />
            <StatCard label="Total Refunds" value={data.totals.totalRefunds.toLocaleString('en-IN')} />
            <StatCard label="Refunded Amount" value={formatPrice(data.totals.refundedAmount)} />
            <StatCard
              label="Pending Refund Amount"
              value={formatPrice(data.totals.pendingRefundAmount)}
              tone={data.totals.pendingRefundAmount > 0 ? 'warning' : 'default'}
            />
            <StatCard label="Avg. Order Value" value={formatPrice(data.totals.averageOrderValue)} />
            <StatCard label="Payment Success Rate" value={`${data.totals.paymentSuccessRate}%`} />
          </div>

          {/* ---------- Charts ---------- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-lg border border-charcoal/10 bg-ivory p-6">
              <h2 className="font-heading text-lg text-maroon mb-4">Daily Revenue</h2>
              <SeriesChart
                points={data.dailySeries.map((d) => ({ label: d.date, value: d.revenue }))}
                style="bar"
              />
            </div>

            <div className="rounded-lg border border-charcoal/10 bg-ivory p-6">
              <h2 className="font-heading text-lg text-maroon mb-4">Revenue Over Time (cumulative)</h2>
              <SeriesChart
                points={data.cumulativeRevenue.map((d) => ({ label: d.date, value: d.cumulativeRevenue }))}
                style="line"
              />
            </div>

            <div className="rounded-lg border border-charcoal/10 bg-ivory p-6">
              <h2 className="font-heading text-lg text-maroon mb-4">Weekly Revenue</h2>
              <SeriesChart
                points={data.weeklySeries.map((w) => ({ label: w.weekStart, value: w.revenue }))}
                style="bar"
              />
            </div>

            <div className="rounded-lg border border-charcoal/10 bg-ivory p-6">
              <h2 className="font-heading text-lg text-maroon mb-4">Monthly Revenue</h2>
              <SeriesChart
                points={data.monthlySeries.map((m) => ({ label: m.monthStart, value: m.revenue }))}
                style="bar"
              />
            </div>

            <div className="rounded-lg border border-charcoal/10 bg-ivory p-6">
              <h2 className="font-heading text-lg text-maroon mb-4">Orders Over Time</h2>
              <SeriesChart
                points={data.dailySeries.map((d) => ({ label: d.date, value: d.orders }))}
                style="bar"
                valueFormat="number"
                color="#C9A227"
              />
            </div>

            <div className="rounded-lg border border-charcoal/10 bg-ivory p-6">
              <h2 className="font-heading text-lg text-maroon mb-4">Refund Trend</h2>
              <SeriesChart
                points={data.dailySeries.map((d) => ({ label: d.date, value: d.refundedAmount }))}
                style="line"
                emptyMessage="No refunds in this range."
              />
            </div>
          </div>

          {/* ---------- Payment method analytics ---------- */}
          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6">
            <h2 className="font-heading text-lg text-maroon mb-4">Payment Method Analytics</h2>
            <PaymentMethodBreakdown rows={data.paymentMethods} />
          </div>

          {/* ---------- Refund analytics ---------- */}
          <div>
            <h2 className="font-heading text-lg text-maroon mb-4">Refund Analytics</h2>
            <RefundAnalyticsSection data={data.refundAnalytics} />
          </div>
        </>
      )}
    </div>
  );
}
