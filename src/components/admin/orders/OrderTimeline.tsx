import type { OrderStatus } from '@/types/database';
import { formatDate } from '@/lib/utils';
import {
  getHistoryActorLabel,
  getHistoryEventLabel,
  isHistoryEventNegative,
  type OrderHistoryEntry,
} from '@/lib/admin/orders-types';

const FLOW: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
const TERMINAL_LABEL: Partial<Record<OrderStatus, string>> = {
  cancelled: 'Cancelled',
  returned: 'Returned',
  refunded: 'Refunded',
};

/**
 * Order Timeline. Prefers the real `order_status_history` log (Phase 9)
 * when it has any rows — each row already carries its own label, actor,
 * optional note, and timestamp. Orders placed before Phase 9 have no
 * history rows at all, so this falls back to the original synthesized
 * trail (derived from placed_at/updated_at) rather than rendering an
 * empty timeline.
 */
export default function OrderTimeline({
  status,
  placedAt,
  updatedAt,
  history,
}: {
  status: OrderStatus;
  placedAt: string;
  updatedAt: string;
  history?: OrderHistoryEntry[];
}) {
  if (history && history.length > 0) {
    return (
      <section className="rounded-lg border border-charcoal/10 bg-ivory p-5">
        <h2 className="font-heading text-lg text-maroon mb-4">Timeline</h2>

        <ol className="space-y-3">
          {history.map((entry) => {
            const negative = isHistoryEventNegative(entry);
            return (
              <li key={entry.id} className="flex items-start gap-3 text-sm">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${negative ? 'bg-red-500' : 'bg-maroon'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-charcoal">{getHistoryEventLabel(entry)}</span>
                    <span className="shrink-0 text-xs text-charcoal/50">{formatDate(entry.createdAt, 'long')}</span>
                  </div>
                  <p className="text-xs text-charcoal/50">{getHistoryActorLabel(entry)}</p>
                  {entry.notes && <p className="mt-1 text-xs text-charcoal/70 italic">"{entry.notes}"</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    );
  }

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