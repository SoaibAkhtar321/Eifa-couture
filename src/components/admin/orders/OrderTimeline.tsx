import type { OrderStatus } from '@/types/database';
import { formatDate } from '@/lib/utils';

const FLOW: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
const TERMINAL_LABEL: Partial<Record<OrderStatus, string>> = {
  cancelled: 'Cancelled',
  returned: 'Returned',
  refunded: 'Refunded',
};

/**
 * Synthetic timeline — there is no order_status_history table (see audit),
 * so this derives a best-effort trail from placed_at/updated_at rather than
 * a real per-transition log.
 */
export default function OrderTimeline({
  status,
  placedAt,
  updatedAt,
}: {
  status: OrderStatus;
  placedAt: string;
  updatedAt: string;
}) {
  const isTerminalException = status in TERMINAL_LABEL;
  const currentIndex = FLOW.indexOf(status);

  return (
    <section className="rounded-lg border border-charcoal/10 bg-ivory p-5">
      <h2 className="font-heading text-lg text-maroon mb-4">Timeline</h2>

      <ol className="space-y-3">
        <li className="flex items-center gap-3 text-sm">
          <span className="h-2 w-2 rounded-full bg-maroon" />
          <span className="text-charcoal">Order placed</span>
          <span className="ml-auto text-xs text-charcoal/50">{formatDate(placedAt, 'long')}</span>
        </li>

        {isTerminalException ? (
          <li className="flex items-center gap-3 text-sm">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-charcoal">{TERMINAL_LABEL[status]}</span>
            <span className="ml-auto text-xs text-charcoal/50">{formatDate(updatedAt, 'long')}</span>
          </li>
        ) : (
          FLOW.slice(1).map((step, i) => {
            const reached = currentIndex >= i + 1;
            return (
              <li key={step} className="flex items-center gap-3 text-sm">
                <span className={`h-2 w-2 rounded-full ${reached ? 'bg-maroon' : 'bg-charcoal/15'}`} />
                <span className={reached ? 'text-charcoal capitalize' : 'text-charcoal/40 capitalize'}>
                  {step.replace(/_/g, ' ')}
                </span>
                {reached && step === status && (
                  <span className="ml-auto text-xs text-charcoal/50">{formatDate(updatedAt, 'long')}</span>
                )}
              </li>
            );
          })
        )}
      </ol>
    </section>
  );
}