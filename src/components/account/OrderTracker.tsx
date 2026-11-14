'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

import CancelOrderButton, { type CancelOutcome } from '@/components/account/CancelOrderButton';
import ReturnRequestButton from '@/components/account/ReturnRequestButton';
import ReturnTimeline, { type CustomerReturn } from '@/components/account/ReturnTimeline';
import { useAuth } from '@/hooks/useAuth';
import {
  DEFAULT_RETURN_WINDOW_DAYS,
  formatDeliveryPromise,
  getCancelEligibility,
  getReturnEligibility,
  OPEN_RETURN_STATUSES,
} from '@/lib/order-policy';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils';
import type { OrderStatus, PaymentStatus } from '@/types/database';

type OrderRow = {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total: number;
  placed_at: string;
  estimated_delivery_date: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  shipping_provider: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  order_items: { id: string; product_id: string | null; name: string; quantity: number; size: string | null; color_name: string | null }[];
};

type HistoryRow = { id: string; new_status: OrderStatus | null; notes: string | null; created_at: string };

const STEPS: { status: OrderStatus; label: string; hint: string }[] = [
  { status: 'pending', label: 'Order placed', hint: 'We have received your order.' },
  { status: 'confirmed', label: 'Confirmed', hint: 'Your order is confirmed.' },
  { status: 'processing', label: 'Packed with care', hint: 'Checked, folded and hand-packed in Lucknow.' },
  { status: 'shipped', label: 'Shipped', hint: 'Handed to our courier partner.' },
  { status: 'out_for_delivery', label: 'Out for delivery', hint: 'Arriving today.' },
  { status: 'delivered', label: 'Delivered', hint: 'Enjoy your piece!' },
];

const STOPPED: Partial<Record<OrderStatus, string>> = {
  cancelled: 'This order was cancelled.',
  returned: 'This order was returned.',
  refunded: 'This order was refunded.',
};

function refundLine(order: Pick<OrderRow, 'status' | 'payment_status'>): string | null {
  if (order.payment_status === 'refunded') {
    return 'Your refund has been issued to the original payment method. It usually reflects in 5–7 business days.';
  }
  if (order.payment_status === 'partially_refunded') {
    return 'A partial refund has been issued to the original payment method.';
  }
  if (order.status === 'cancelled' && order.payment_status === 'paid') {
    return 'Your refund is being processed. If you do not see it within 5–7 business days, contact us.';
  }
  return null;
}

const SELECT =
  'id, order_number, status, payment_status, total, placed_at, estimated_delivery_date, cancelled_at, cancel_reason, shipped_at, delivered_at, shipping_provider, tracking_number, tracking_url, order_items ( id, product_id, name, quantity, size, color_name )';

function fmt(date: string) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(
    new Date(date)
  );
}

export default function OrderTracker() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const requested = params.get('order')?.trim().toUpperCase() ?? '';

  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [query, setQuery] = useState(requested);
  const [returns, setReturns] = useState<CustomerReturn[]>([]);
  const [returnWindowDays, setReturnWindowDays] = useState(DEFAULT_RETURN_WINDOW_DAYS);

  useEffect(() => {
    if (!user) return;
    createClient()
      .from('orders')
      .select(SELECT)
      .eq('user_id', user.id)
      .order('placed_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setOrders((data ?? []) as unknown as OrderRow[]));
  }, [user]);

  const selected = orders?.find((o) => o.order_number.toUpperCase() === requested) ?? (requested ? null : orders?.[0] ?? null);

  useEffect(() => {
    if (!selected) return;
    let active = true;
    createClient()
      .from('order_status_history')
      .select('id, new_status, notes, created_at')
      .eq('order_id', selected.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (active) setHistory((data ?? []) as HistoryRow[]);
      });
    return () => {
      active = false;
    };
  }, [selected]);

  useEffect(() => {
    createClient()
      .from('store_settings')
      .select('return_window_days')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        const days = (data as { return_window_days: number } | null)?.return_window_days;
        if (typeof days === 'number') setReturnWindowDays(days);
      });
  }, []);

  const selectedId = selected?.id ?? null;

  function loadReturns(orderId: string) {
    return createClient()
      .from('order_returns')
      .select(
        'id, order_item_id, status, reason, is_exchange, exchange_size, quantity, admin_notes, refund_amount, requested_at, resolved_at'
      )
      .eq('order_id', orderId)
      .order('requested_at', { ascending: false })
      .then(({ data }) => (data ?? []) as unknown as CustomerReturn[]);
  }

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    loadReturns(selectedId).then((rows) => {
      if (active) setReturns(rows);
    });
    return () => {
      active = false;
    };
  }, [selectedId]);

  function handleCancelled(orderId: string, outcome: CancelOutcome) {
    setOrders((prev) =>
      (prev ?? []).map((o): OrderRow =>
        o.id === orderId
          ? {
              ...o,
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
              payment_status:
                o.payment_status === 'paid' && outcome.refund === 'initiated'
                  ? 'refunded'
                  : o.payment_status === 'pending'
                    ? 'failed'
                    : o.payment_status,
            }
          : o
      )
    );
    // Pull the history row the server just wrote.
    setHistory([]);
    router.refresh();
  }

  function search(event: FormEvent) {
    event.preventDefault();
    router.replace(`/track-order?order=${encodeURIComponent(query.trim())}`);
  }

  if (isLoading) return <p className="text-sm text-ink-soft">Loading…</p>;

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-beige bg-white p-8 text-center">
        <h2 className="font-heading text-2xl text-charcoal">Sign in to track your order</h2>
        <p className="mt-2 text-sm text-ink-soft">Your orders and their live status appear here after you sign in.</p>
        <Link href="/login?next=/track-order" className="btn-luxury btn-luxury-primary mt-6 inline-flex">
          Sign In
        </Link>
      </div>
    );
  }

  if (orders === null) return <p className="text-sm text-ink-soft">Loading your orders…</p>;

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-beige bg-white p-8 text-center">
        <h2 className="font-heading text-2xl text-charcoal">No orders yet</h2>
        <Link href="/shop" className="btn-luxury btn-luxury-primary mt-6 inline-flex">
          Start Shopping
        </Link>
      </div>
    );
  }

  const stopped = selected ? STOPPED[selected.status] : undefined;
  const currentStep = selected ? STEPS.findIndex((s) => s.status === selected.status) : -1;
  const noteFor = (status: OrderStatus) => history.filter((h) => h.new_status === status).at(-1);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:gap-10">
      <aside className="space-y-4">
        <form onSubmit={search} className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Order number, e.g. EC-2026-000123"
            className="min-w-0 flex-1 rounded-md border border-beige bg-white px-3 py-2.5 text-base outline-none focus:border-gold sm:text-sm"
          />
          <button type="submit" className="rounded-md bg-maroon px-4 text-xs font-medium uppercase tracking-wider text-white">
            Find
          </button>
        </form>

        <ul className="divide-y divide-beige overflow-hidden rounded-xl border border-beige bg-white">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/track-order?order=${order.order_number}`}
                className={`block px-4 py-3 text-sm ${selected?.id === order.id ? 'bg-cream' : 'hover:bg-cream/60'}`}
              >
                <span className="font-medium text-charcoal">{order.order_number}</span>
                <span className="mt-0.5 block text-xs capitalize text-ink-muted">
                  {order.status.replace(/_/g, ' ')} · {formatPrice(order.total)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      {!selected ? (
        <div className="rounded-xl border border-beige bg-white p-8 text-sm text-ink-soft">
          No order found with number “{requested}” on your account.
        </div>
      ) : (
        <article className="rounded-xl border border-beige bg-white p-5 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gold-dark">Order</p>
              <h2 className="mt-1 font-heading text-2xl text-charcoal sm:text-3xl">{selected.order_number}</h2>
              <p className="mt-1 text-sm text-ink-muted">Placed {fmt(selected.placed_at)}</p>
            </div>
            <p className="font-subheading text-2xl font-semibold text-charcoal">{formatPrice(selected.total)}</p>
          </div>

          {formatDeliveryPromise(selected.status, selected.estimated_delivery_date) && (
            <p className="mt-5 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm font-medium text-charcoal">
              {formatDeliveryPromise(selected.status, selected.estimated_delivery_date)}
            </p>
          )}

          {getCancelEligibility({
            status: selected.status,
            payment_status: selected.payment_status,
            shipped_at: selected.shipped_at,
          }).ok && (
            <div className="mt-4">
              <CancelOrderButton
                orderId={selected.id}
                orderNumber={selected.order_number}
                isPaid={selected.payment_status === 'paid'}
                onCancelled={(outcome) => handleCancelled(selected.id, outcome)}
              />
            </div>
          )}

          {(selected.shipping_provider || selected.tracking_number) && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-cream px-4 py-3 text-sm">
              <div>
                <p className="text-charcoal">
                  {selected.shipping_provider ?? 'Courier'}
                  {selected.tracking_number && <span className="text-ink-soft"> · AWB {selected.tracking_number}</span>}
                </p>
              </div>
              {selected.tracking_url && (
                <a
                  href={selected.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-maroon px-4 py-2 text-xs font-medium uppercase tracking-wider text-white"
                >
                  Live courier tracking
                </a>
              )}
            </div>
          )}

          {stopped ? (
            <div className="mt-8 space-y-1 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-medium">{stopped}</p>
              {selected.status === 'cancelled' && selected.cancelled_at && (
                <p className="text-xs">Cancelled on {fmt(selected.cancelled_at)}.</p>
              )}
              {selected.cancel_reason && <p className="text-xs">Reason: {selected.cancel_reason}</p>}
              {refundLine(selected) && <p className="pt-1 text-xs">{refundLine(selected)}</p>}
            </div>
          ) : (
            <ol className="mt-8 space-y-0">
              {STEPS.map((step, i) => {
                const done = i <= currentStep;
                const note = noteFor(step.status);
                return (
                  <li key={step.status} className="relative flex gap-4 pb-7 last:pb-0">
                    {i < STEPS.length - 1 && (
                      <span
                        className={`absolute left-[11px] top-6 h-full w-0.5 ${i < currentStep ? 'bg-maroon' : 'bg-beige'}`}
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] ${
                        done ? 'border-maroon bg-maroon text-white' : 'border-beige bg-white text-ink-muted'
                      }`}
                    >
                      {done ? '✓' : i + 1}
                    </span>
                    <div>
                      <p className={`text-sm font-medium ${done ? 'text-charcoal' : 'text-ink-muted'}`}>{step.label}</p>
                      <p className="text-xs text-ink-muted">
                        {note ? fmt(note.created_at) : i === 0 ? fmt(selected.placed_at) : done ? '' : step.hint}
                      </p>
                      {note?.notes && <p className="mt-1 text-xs italic text-ink-soft">“{note.notes}”</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          <ReturnTimeline
            returns={returns}
            itemNames={Object.fromEntries(selected.order_items.map((item) => [item.id, item.name]))}
          />

          <div className="mt-8 border-t border-beige pt-5">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Items</p>
            <ul className="mt-3 space-y-2 text-sm text-charcoal">
              {selected.order_items.map((item) => {
                const itemReturns = returns.filter((r) => r.order_item_id === item.id);
                const hasOpen = itemReturns.some((r) => OPEN_RETURN_STATUSES.includes(r.status));
                const doneQty = itemReturns
                  .filter((r) => r.status === 'refunded' || r.status === 'exchanged')
                  .reduce((sum, r) => sum + r.quantity, 0);
                const canReturn =
                  !hasOpen &&
                  doneQty < item.quantity &&
                  getReturnEligibility(
                    {
                      status: selected.status,
                      payment_status: selected.payment_status,
                      delivered_at: selected.delivered_at,
                    },
                    returnWindowDays
                  ).ok;

                return (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-3">
                    <span>
                      {item.name}
                      {(item.size || item.color_name) && (
                        <span className="text-ink-muted"> · {[item.size, item.color_name].filter(Boolean).join(' / ')}</span>
                      )}
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-ink-soft">× {item.quantity}</span>
                      {canReturn && (
                        <ReturnRequestButton
                          orderId={selected.id}
                          orderNumber={selected.order_number}
                          item={{
                            id: item.id,
                            productId: item.product_id,
                            name: item.name,
                            size: item.size,
                            colorName: item.color_name,
                            quantity: item.quantity - doneQty,
                          }}
                          onRequested={() => {
                            loadReturns(selected.id).then(setReturns);
                          }}
                        />
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </article>
      )}
    </div>
  );
}
