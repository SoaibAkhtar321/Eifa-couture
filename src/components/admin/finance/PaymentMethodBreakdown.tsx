import { formatPrice } from '@/lib/utils';
import { PAYMENT_METHOD_LABELS, type PaymentMethodRow } from '@/lib/admin/finance-read';

interface PaymentMethodBreakdownProps {
  rows: PaymentMethodRow[];
}

export default function PaymentMethodBreakdown({ rows }: PaymentMethodBreakdownProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-charcoal/50">No successful payments in this range.</p>;
  }

  const max = Math.max(...rows.map((r) => r.count));

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.method}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-charcoal/70">{PAYMENT_METHOD_LABELS[row.method]}</span>
            <span className="text-charcoal/50">
              {row.count} · {row.percentage}% · {formatPrice(row.revenue)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-charcoal/5">
            <div
              className="h-2 rounded-full bg-gold"
              style={{ width: `${max > 0 ? (row.count / max) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
