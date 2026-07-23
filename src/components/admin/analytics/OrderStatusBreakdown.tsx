import { cn } from '@/lib/utils';
import type { StatusBreakdownPoint } from '@/lib/admin/analytics-read';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
  refunded: 'Refunded',
};

interface OrderStatusBreakdownProps {
  breakdown: StatusBreakdownPoint[];
}

export default function OrderStatusBreakdown({ breakdown }: OrderStatusBreakdownProps) {
  if (breakdown.length === 0) {
    return <p className="text-sm text-charcoal/50">No orders in this range.</p>;
  }

  const total = breakdown.reduce((sum, b) => sum + b.count, 0);
  const max = Math.max(...breakdown.map((b) => b.count));

  return (
    <div className="space-y-3">
      {breakdown.map((row) => {
        const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
        const widthPct = max > 0 ? (row.count / max) * 100 : 0;
        const isNegative = row.status === 'cancelled' || row.status === 'returned' || row.status === 'refunded';

        return (
          <div key={row.status}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-charcoal/70">{STATUS_LABELS[row.status] ?? row.status}</span>
              <span className="text-charcoal/50">
                {row.count} · {pct}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-charcoal/5">
              <div
                className={cn('h-2 rounded-full', isNegative ? 'bg-charcoal/30' : 'bg-gold')}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
