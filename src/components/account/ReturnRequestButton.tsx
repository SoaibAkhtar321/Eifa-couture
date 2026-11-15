'use client';

import { useEffect, useState } from 'react';

import { RETURN_REASONS } from '@/lib/order-policy';
import { createClient } from '@/lib/supabase/client';

export interface ReturnableItem {
  id: string;
  productId: string | null;
  name: string;
  size: string | null;
  colorName: string | null;
  quantity: number;
}

interface ReturnRequestButtonProps {
  orderId: string;
  orderNumber: string;
  item: ReturnableItem;
  onRequested: () => void;
  /** Guest-on-another-device flow: post here instead of the signed-in route. */
  endpoint?: string;
  /** Extra fields sent with the request (the guest's order number + email). */
  extraBody?: Record<string, string>;
}

/** "Return / exchange" button + request dialog. The server checks every
 *  rule (window, quantity, stock); this only collects the request. */
export default function ReturnRequestButton({
  orderId,
  orderNumber,
  item,
  onRequested,
  endpoint,
  extraBody,
}: ReturnRequestButtonProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'return' | 'exchange'>('return');
  const [reason, setReason] = useState<string>(RETURN_REASONS[0]);
  const [details, setDetails] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sizes, setSizes] = useState<string[]>([]);
  const [exchangeSize, setExchangeSize] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sizes offered for exchange: active variants of the same product and colour.
  useEffect(() => {
    if (!open || mode !== 'exchange' || !item.productId || sizes.length > 0) return;
    let active = true;
    createClient()
      .from('product_variants')
      .select('size')
      .eq('product_id', item.productId)
      .eq('color_name', item.colorName ?? '')
      .eq('is_active', true)
      .then(({ data }) => {
        if (!active) return;
        const list = ((data ?? []) as { size: string }[]).map((v) => v.size);
        setSizes(list);
        setExchangeSize((current) => current || list[0] || '');
      });
    return () => {
      active = false;
    };
  }, [open, mode, item.productId, item.colorName, sizes.length]);

  async function submit() {
    if (mode === 'exchange' && !exchangeSize) {
      setError('Choose the size you want in exchange.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint ?? `/api/orders/${orderId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...extraBody,
          orderItemId: item.id,
          quantity,
          reason,
          details: details.trim() || undefined,
          isExchange: mode === 'exchange',
          exchangeSize: mode === 'exchange' ? exchangeSize : undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error?.message ?? 'Could not submit your request. Please try again.');
        return;
      }
      setOpen(false);
      onRequested();
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
        className="rounded-full border border-maroon px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-maroon transition-colors hover:bg-maroon hover:text-white"
      >
        Return / exchange
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="return-request-title"
          className="fixed inset-0 z-[100] flex items-end justify-center bg-charcoal/50 p-4 sm:items-center"
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <h2 id="return-request-title" className="font-heading text-2xl text-charcoal">
              Return or exchange
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              {item.name} · Order {orderNumber}
            </p>

            <fieldset className="mt-5 flex gap-5 text-sm text-charcoal" disabled={busy}>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="radio" name="return-mode" checked={mode === 'return'} onChange={() => setMode('return')} className="accent-maroon" />
                Return for refund
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="radio" name="return-mode" checked={mode === 'exchange'} onChange={() => setMode('exchange')} className="accent-maroon" />
                Exchange size
              </label>
            </fieldset>

            {mode === 'exchange' && (
              <label className="mt-4 block text-sm text-charcoal">
                <span className="text-xs uppercase tracking-[0.18em] text-ink-muted">New size</span>
                <select
                  value={exchangeSize}
                  onChange={(e) => setExchangeSize(e.target.value)}
                  disabled={busy}
                  className="mt-1 w-full rounded-md border border-beige bg-white px-3 py-2 text-base outline-none focus:border-gold sm:text-sm"
                >
                  {sizes.length === 0 && <option value="">No sizes available</option>}
                  {sizes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {item.quantity > 1 && (
              <label className="mt-4 block text-sm text-charcoal">
                <span className="text-xs uppercase tracking-[0.18em] text-ink-muted">Quantity</span>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  disabled={busy}
                  className="mt-1 w-full rounded-md border border-beige bg-white px-3 py-2 text-base outline-none focus:border-gold sm:text-sm"
                >
                  {Array.from({ length: item.quantity }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="mt-4 block text-sm text-charcoal">
              <span className="text-xs uppercase tracking-[0.18em] text-ink-muted">Reason</span>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={busy}
                className="mt-1 w-full rounded-md border border-beige bg-white px-3 py-2 text-base outline-none focus:border-gold sm:text-sm"
              >
                {RETURN_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block text-sm text-charcoal">
              <span className="text-xs uppercase tracking-[0.18em] text-ink-muted">Details (optional)</span>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                disabled={busy}
                rows={3}
                maxLength={1000}
                className="mt-1 w-full rounded-md border border-beige bg-white px-3 py-2 text-base outline-none focus:border-gold sm:text-sm"
              />
            </label>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => setOpen(false)}
                className="rounded-full border border-beige px-5 py-2 text-xs font-medium uppercase tracking-wider text-charcoal hover:bg-cream disabled:opacity-50"
              >
                Close
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={submit}
                className="rounded-full bg-maroon px-5 py-2 text-xs font-medium uppercase tracking-wider text-white hover:opacity-90 disabled:opacity-50"
              >
                {busy ? 'Submitting…' : 'Submit request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
