'use client';

import { useState } from 'react';

import { CANCEL_REASONS } from '@/lib/order-policy';

export type CancelOutcome = {
  /** 'not_required' = unpaid order, 'initiated' = refund sent to Razorpay,
   *  'pending_manual' = cancelled but the refund needs the store's help. */
  refund: 'not_required' | 'initiated' | 'pending_manual';
};

interface CancelOrderButtonProps {
  orderId: string;
  orderNumber: string;
  /** Paid orders get a refund note in the confirmation copy. */
  isPaid: boolean;
  onCancelled: (outcome: CancelOutcome) => void;
  className?: string;
}

/** "Cancel order" button + reason dialog. Server enforces every rule;
 *  this only collects the reason and shows the result. */
export default function CancelOrderButton({
  orderId,
  orderNumber,
  isPaid,
  onCancelled,
  className = '',
}: CancelOrderButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(CANCEL_REASONS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error?.message ?? 'Could not cancel the order. Please try again.');
        return;
      }
      setOpen(false);
      onCancelled({ refund: body.refund ?? 'not_required' });
    } catch {
      setError('Network problem. Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-full border border-red-300 px-4 py-2 text-xs font-medium uppercase tracking-wider text-red-700 transition-colors hover:bg-red-50 ${className}`}
      >
        Cancel order
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-order-title"
          className="fixed inset-0 z-[100] flex items-end justify-center bg-charcoal/50 p-4 sm:items-center"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 id="cancel-order-title" className="font-heading text-2xl text-charcoal">
              Cancel order {orderNumber}?
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              {isPaid
                ? 'Your full payment will be refunded to the original payment method. It usually reflects in 5–7 business days.'
                : 'This order has not been paid, so nothing will be charged.'}
            </p>

            <fieldset className="mt-5 space-y-2" disabled={busy}>
              <legend className="text-xs uppercase tracking-[0.18em] text-ink-muted">Reason</legend>
              {CANCEL_REASONS.map((r) => (
                <label key={r} className="flex cursor-pointer items-center gap-3 text-sm text-charcoal">
                  <input
                    type="radio"
                    name="cancel-reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-maroon"
                  />
                  {r}
                </label>
              ))}
            </fieldset>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => setOpen(false)}
                className="rounded-full border border-beige px-5 py-2 text-xs font-medium uppercase tracking-wider text-charcoal hover:bg-cream disabled:opacity-50"
              >
                Keep order
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={submit}
                className="rounded-full bg-red-700 px-5 py-2 text-xs font-medium uppercase tracking-wider text-white hover:bg-red-800 disabled:opacity-50"
              >
                {busy ? 'Cancelling…' : 'Yes, cancel order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
