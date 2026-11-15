'use client';

/* ============================================
   EIFA COUTURE — Guest order lookup (track + return)
   ============================================
   For someone who ordered as a guest and is on another device or
   browser. They enter the order number and the email used at
   checkout; the server (rate-limited, generic failure) returns the
   order status and its returns. Return requests re-send the same
   credentials, so access is verified again each time.
   ============================================ */

import { FormEvent, useState } from 'react';

import ReturnRequestButton from '@/components/account/ReturnRequestButton';
import ReturnTimeline, { type CustomerReturn } from '@/components/account/ReturnTimeline';
import { ORDER_STATUS_LABEL, OPEN_RETURN_STATUSES } from '@/lib/order-policy';
import type { OrderStatus } from '@/types/database';

interface GuestItem {
  id: string;
  productId: string | null;
  name: string;
  size: string | null;
  colorName: string | null;
  quantity: number;
}

interface GuestLookupResult {
  order: {
    orderNumber: string;
    status: OrderStatus;
    placedAt: string;
    canRequestReturn: boolean;
    returnBlockedMessage: string | null;
    items: GuestItem[];
  };
  returns: CustomerReturn[];
}

const inputClass =
  'mt-1 w-full rounded-md border border-beige bg-white px-3 py-2 text-base outline-none focus:border-gold sm:text-sm';

export default function GuestOrderLookup() {
  const [open, setOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GuestLookupResult | null>(null);

  async function lookup(event?: FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/orders/guest-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: orderNumber.trim(), email: email.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult(null);
        setError(body?.error?.message ?? 'Could not look up your order. Please try again.');
        return;
      }
      setResult(body as GuestLookupResult);
    } catch {
      setError('Network problem. Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  const itemNames: Record<string, string> = Object.fromEntries(
    (result?.order.items ?? []).map((i) => [i.id, i.name])
  );

  return (
    <div className="mt-8 border-t border-beige pt-6 text-left">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full text-center text-sm text-maroon underline underline-offset-4"
        >
          Ordered as a guest? Find your order
        </button>
      ) : (
        <>
          <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Find your guest order</p>
          <form onSubmit={lookup} className="mt-3 space-y-3">
            <label className="block text-sm text-charcoal">
              <span className="text-xs uppercase tracking-[0.18em] text-ink-muted">Order number</span>
              <input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                required
                maxLength={40}
                autoComplete="off"
                className={inputClass}
              />
            </label>
            <label className="block text-sm text-charcoal">
              <span className="text-xs uppercase tracking-[0.18em] text-ink-muted">Email used at checkout</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={254}
                autoComplete="email"
                className={inputClass}
              />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="btn-luxury btn-luxury-primary inline-flex w-full justify-center disabled:opacity-50"
            >
              {busy ? 'Looking…' : 'Find order'}
            </button>
          </form>
        </>
      )}

      {result && (
        <div className="mt-6">
          <p className="font-heading text-xl text-charcoal">Order {result.order.orderNumber}</p>
          <p className="mt-1 text-sm text-ink-soft">
            Status: <span className="font-medium text-charcoal">{ORDER_STATUS_LABEL[result.order.status] ?? result.order.status}</span>
          </p>

          <div className="mt-4 divide-y divide-beige rounded-lg border border-beige">
            {result.order.items.map((item) => {
              const itemReturns = result.returns.filter((r) => r.order_item_id === item.id);
              const hasOpen = itemReturns.some((r) => OPEN_RETURN_STATUSES.includes(r.status));
              const doneQty = itemReturns
                .filter((r) => r.status === 'refunded' || r.status === 'exchanged')
                .reduce((sum, r) => sum + r.quantity, 0);
              const canReturn = result.order.canRequestReturn && !hasOpen && doneQty < item.quantity;

              return (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                  <div>
                    <p className="text-sm text-charcoal">
                      {item.name} × {item.quantity}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {[item.size, item.colorName].filter(Boolean).join(' / ')}
                    </p>
                  </div>
                  {canReturn && (
                    <ReturnRequestButton
                      orderId=""
                      orderNumber={result.order.orderNumber}
                      item={item}
                      endpoint="/api/orders/guest-return"
                      extraBody={{ orderNumber: orderNumber.trim(), email: email.trim() }}
                      onRequested={() => lookup()}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {!result.order.canRequestReturn && result.order.returnBlockedMessage && (
            <p className="mt-3 text-xs text-ink-muted">{result.order.returnBlockedMessage}</p>
          )}

          <ReturnTimeline returns={result.returns} itemNames={itemNames} />
        </div>
      )}
    </div>
  );
}
