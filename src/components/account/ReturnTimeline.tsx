import { RETURN_STATUS_LABEL } from '@/lib/order-policy';
import { formatPrice } from '@/lib/utils';
import type { ReturnStatus } from '@/types/database';

export interface CustomerReturn {
  id: string;
  order_item_id: string;
  status: ReturnStatus;
  reason: string;
  is_exchange: boolean;
  exchange_size: string | null;
  quantity: number;
  admin_notes: string | null;
  refund_amount: number | null;
  requested_at: string;
  resolved_at: string | null;
  pickup_courier: string | null;
  pickup_tracking_number: string | null;
  /** YYYY-MM-DD */
  pickup_date: string | null;
}

const REFUND_FLOW: ReturnStatus[] = ['requested', 'approved', 'picked_up', 'received', 'refunded'];
const EXCHANGE_FLOW: ReturnStatus[] = ['requested', 'approved', 'picked_up', 'received', 'exchanged'];

function fmt(date: string) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(
    new Date(date)
  );
}

function fmtDay(date: string) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(`${date}T00:00:00`)
  );
}

/** Progress of each return/exchange on an order. Only the request and
 *  closing times are known, so intermediate steps show no time. */
export default function ReturnTimeline({
  returns,
  itemNames,
}: {
  returns: CustomerReturn[];
  itemNames: Record<string, string>;
}) {
  if (returns.length === 0) return null;

  return (
    <div className="mt-8 border-t border-beige pt-5">
      <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Returns &amp; exchanges</p>

      <div className="mt-4 space-y-6">
        {returns.map((r) => {
          const flow = r.is_exchange ? EXCHANGE_FLOW : REFUND_FLOW;
          // An exchange that ends in a refund still finishes the flow.
          const finalStep = r.status === 'refunded' && r.is_exchange ? 'refunded' : null;
          const steps = finalStep ? [...EXCHANGE_FLOW.slice(0, 4), 'refunded' as ReturnStatus] : flow;
          const rejected = r.status === 'rejected';
          const current = steps.indexOf(r.status);

          return (
            <div key={r.id} className="rounded-lg border border-beige p-4">
              <p className="text-sm font-medium text-charcoal">
                {r.is_exchange ? 'Exchange' : 'Return'}: {itemNames[r.order_item_id] ?? 'Item'} × {r.quantity}
                {r.is_exchange && r.exchange_size ? ` → size ${r.exchange_size}` : ''}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {r.reason} · Requested {fmt(r.requested_at)}
              </p>

              {rejected ? (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  <p className="font-medium">This request was not approved.</p>
                  {r.admin_notes && <p className="mt-1">{r.admin_notes}</p>}
                </div>
              ) : (
                <ol className="mt-3 space-y-1.5">
                  {steps.map((step, i) => {
                    const done = i <= current;
                    return (
                      <li key={step} className="flex items-center gap-2 text-xs">
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] ${
                            done ? 'border-maroon bg-maroon text-white' : 'border-beige text-ink-muted'
                          }`}
                        >
                          {done ? '✓' : ''}
                        </span>
                        <span className={done ? 'text-charcoal' : 'text-ink-muted'}>{RETURN_STATUS_LABEL[step]}</span>
                        {step === r.status && r.resolved_at && (
                          <span className="text-ink-muted">· {fmt(r.resolved_at)}</span>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}

              {!rejected && (r.status === 'approved' || r.status === 'picked_up') && (
                <div className="mt-3 rounded-md border border-beige bg-cream/60 p-3 text-xs text-ink-soft">
                  {(r.pickup_courier || r.pickup_tracking_number || r.pickup_date) && (
                    <p className="text-charcoal">
                      <span className="font-medium">Pickup:</span>{' '}
                      {[
                        r.pickup_courier,
                        r.pickup_tracking_number ? `Tracking ${r.pickup_tracking_number}` : null,
                        r.pickup_date ? fmtDay(r.pickup_date) : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                  {r.status === 'approved' && (
                    <p className="mt-1">Please keep the item packed and ready for the courier.</p>
                  )}
                </div>
              )}

              {!rejected && r.admin_notes && (
                <p className="mt-2 text-xs italic text-ink-soft">“{r.admin_notes}”</p>
              )}
              {r.status === 'refunded' && r.refund_amount !== null && (
                <p className="mt-2 text-xs text-ink-soft">
                  {formatPrice(Number(r.refund_amount))} refunded to your original payment method. It usually reflects in 5–7 business days.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
