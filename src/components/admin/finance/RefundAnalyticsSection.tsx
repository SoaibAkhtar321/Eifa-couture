import StatCard from '@/components/admin/StatCard';
import { formatPrice } from '@/lib/utils';
import type { FinanceRefundAnalytics } from '@/lib/admin/finance-read';

interface RefundAnalyticsSectionProps {
  data: FinanceRefundAnalytics;
}

export default function RefundAnalyticsSection({ data }: RefundAnalyticsSectionProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard label="Refund Requests" value={data.totalRefundRequests.toLocaleString('en-IN')} />
      <StatCard label="Successful" value={data.successfulRefunds.toLocaleString('en-IN')} />
      <StatCard
        label="Pending"
        value={data.pendingRefunds.toLocaleString('en-IN')}
        tone={data.pendingRefunds > 0 ? 'warning' : 'default'}
      />
      <StatCard label="Failed" value={data.failedRefunds.toLocaleString('en-IN')} />
      <StatCard label="Total Refunded" value={formatPrice(data.totalRefundedAmount)} />
      <StatCard label="Refund %" value={`${data.refundPercentage}%`} />
    </div>
  );
}
