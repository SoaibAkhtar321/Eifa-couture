'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils';
import type { OrderStatus } from '@/types/database';

type OrderRow = {
  id: string;
  order_number: string;
  status: OrderStatus;
  total: number;
  placed_at: string;
  shipped_at: string | null;
  delivered_at: string | null;
  shipping_provider: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  order_items: { name: string; quantity: number; size: string | null; color_name: string | null }[];
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

const SELECT =
  'id, order_number, status, total, placed_at, shipped_at, delivered_at, shipping_provider, tracking_number, tracking_url, order_items ( name, quantity, size, color_name )';

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

  function search(event: FormEvent) {
    event.preventDefault();
    router.replace(`/track-order?order=${encodeURIComponent(query.trim())}`);
  }

  if (isLoading) return <p className="text-sm text-charcoal/70">Loading…</p>;

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-beige bg-white p-8 text-center">
        <h2 className="font-heading text-2xl text-charcoal">Sign in to track your order</h2>
        <p className="mt-2 text-sm text-charcoal/70">Your orders and their live status appear here after you sign in.</p>
        <Link href="/login?next=/track-order" className="btn-luxury btn-luxury-primary mt-6 inline-flex">
          Sign In
        </Link>
      </div>
    );
  }

  if (orders === null) return <p className="text-sm text-charcoal/70">Loading your orders…</p>;

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
                <span className="mt-0.5 block text-xs capitalize text-charcoal/65">
                  {order.status.replace(/_/g, ' ')} · {formatPrice(order.total)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      {!selected ? (
        <div className="rounded-xl border border-beige bg-white p-8 text-sm text-charcoal/70">
          No order found with number “{requested}” on your account.
        </div>
      ) : (
        <article className="rounded-xl border border-beige bg-white p-5 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gold-dark">Order</p>
              <h2 className="mt-1 font-heading text-2xl text-charcoal sm:text-3xl">{selected.order_number}</h2>
              <p className="mt-1 text-sm text-charcoal/65">Placed {fmt(selected.placed_at)}</p>
            </div>
            <p className="font-subheading text-2xl font-semibold text-charcoal">{formatPrice(selected.total)}</p>
          </div>

          {(selected.shipping_provider || selected.tracking_number) && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-cream px-4 py-3 text-sm">
              <div>
                <p className="text-charcoal">
                  {selected.shipping_provider ?? 'Courier'}
                  {selected.tracking_number && <span className="text-charcoal/70"> · AWB {selected.tracking_number}</span>}
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
            <p className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{stopped}</p>
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
                        done ? 'border-maroon bg-maroon text-white' : 'border-beige bg-white text-charcoal/40'
                      }`}
                    >
                      {done ? '✓' : i + 1}
                    </span>
                    <div>
                      <p className={`text-sm font-medium ${done ? 'text-charcoal' : 'text-charcoal/50'}`}>{step.label}</p>
                      <p className="text-xs text-charcoal/65">
                        {note ? fmt(note.created_at) : i === 0 ? fmt(selected.placed_at) : done ? '' : step.hint}
                      </p>
                      {note?.notes && <p className="mt-1 text-xs italic text-charcoal/75">“{note.notes}”</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="mt-8 border-t border-beige pt-5">
            <p className="text-xs uppercase tracking-[0.2em] text-charcoal/60">Items</p>
            <ul className="mt-3 space-y-2 text-sm text-charcoal">
              {selected.order_items.map((item, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span>
                    {item.name}
                    {(item.size || item.color_name) && (
                      <span className="text-charcoal/60"> · {[item.size, item.color_name].filter(Boolean).join(' / ')}</span>
                    )}
                  </span>
                  <span className="text-charcoal/70">× {item.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
        </article>
      )}
    </div>
  );
}
