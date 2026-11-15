'use client';

/* ============================================
   EIFA COUTURE — Admin Returns Panel
   ============================================
   Lives on the order detail page. Every button posts to
   /api/admin/returns/[id]; the server enforces the allowed steps, so
   this panel only decides which buttons to show.
   The note is shown to the customer on their return timeline.

   Pickup details (courier, tracking number, date) are optional and
   recorded when approving or marking picked up. The refund button
   states the exact amount and asks for confirmation; the server stays
   idempotent and only refunds after the item is marked received.
   ============================================ */

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import ConfirmDialog from '@/components/admin/ui/ConfirmDialog';
import { formatDate, formatPrice } from '@/lib/utils';
import { RETURN_STATUS_LABEL } from '@/lib/order-policy';
import type { AdminReturnRecord } from '@/lib/admin/returns-types';
import type { ReturnStatus } from '@/types/database';

type Action = 'approve' | 'reject' | 'picked_up' | 'received' | 'refunded' | 'exchanged';

interface PickupForm {
  courier: string;
  trackingNumber: string;
  date: string;
}

const STATUS_CLASSES: Record<ReturnStatus, string> = {
  requested: 'bg-gold/15 text-gold',
  approved: 'bg-maroon/10 text-maroon',
  picked_up: 'bg-maroon/10 text-maroon',
  received: 'bg-maroon/10 text-maroon',
  rejected: 'bg-red-100 text-red-800',
  refunded: 'bg-green-100 text-green-800',
  exchanged: 'bg-green-100 text-green-800',
};

const REFUND_BADGE: Record<string, { label: string; className: string }> = {
  processing: { label: 'Refund processing', className: 'bg-amber-100 text-amber-800' },
  processed: { label: 'Refund processed', className: 'bg-green-100 text-green-800' },
  failed: { label: 'Refund failed', className: 'bg-red-100 text-red-800' },
};

function refundButtonLabel(r: AdminReturnRecord): string {
  const amount = r.refundPreview !== null ? ` ${formatPrice(r.refundPreview)}` : '';
  if (r.refund?.status === 'failed') return `Retry refund${amount} to customer`;
  if (r.refund?.status === 'processed') return `Finish refund${amount}`;
  return `Refund${amount} to customer`;
}

function actionsFor(r: AdminReturnRecord): { action: Action; label: string; danger?: boolean; disabled?: boolean }[] {
  const refundInProgress = r.refund?.status === 'processing';
  switch (r.status) {
    case 'requested':
      return [
        { action: 'approve', label: 'Approve' },
        { action: 'reject', label: 'Reject', danger: true },
      ];
    case 'approved':
      return [
        { action: 'picked_up', label: 'Mark picked up' },
        { action: 'reject', label: 'Reject', danger: true },
      ];
    case 'picked_up':
      return [{ action: 'received', label: 'Mark received' }];
    case 'received':
      return r.isExchange
        ? [
            { action: 'exchanged', label: 'Mark exchange shipped' },
            { action: 'refunded', label: refundButtonLabel(r), disabled: refundInProgress },
          ]
        : [{ action: 'refunded', label: refundButtonLabel(r), disabled: refundInProgress }];
    default:
      return [];
  }
}

function pickupFormFor(r: AdminReturnRecord, edited: PickupForm | undefined): PickupForm {
  return (
    edited ?? {
      courier: r.pickupCourier ?? '',
      trackingNumber: r.pickupTrackingNumber ?? '',
      date: r.pickupDate ?? '',
    }
  );
}

const inputClass =
  'w-full rounded-md border border-charcoal/15 bg-white px-3 py-2 text-sm outline-none focus:border-gold';

export default function ReturnsPanel({ returns }: { returns: AdminReturnRecord[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [restock, setRestock] = useState<Record<string, boolean>>({});
  const [pickups, setPickups] = useState<Record<string, PickupForm>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmRefund, setConfirmRefund] = useState<AdminReturnRecord | null>(null);

  async function run(r: AdminReturnRecord, action: Action) {
    const note = (notes[r.id] ?? '').trim();

    if (action === 'reject' && !note) {
      setErrors((e) => ({ ...e, [r.id]: 'Add a note explaining the rejection.' }));
      return;
    }

    setBusyId(r.id);
    setErrors((e) => ({ ...e, [r.id]: '' }));

    const sendsPickup = action === 'approve' || action === 'picked_up';
    const pickup = pickupFormFor(r, pickups[r.id]);

    try {
      const res = await fetch(`/api/admin/returns/${r.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          notes: note || undefined,
          restock: action === 'received' ? (restock[r.id] ?? true) : undefined,
          pickup: sendsPickup
            ? {
                courier: pickup.courier.trim() || null,
                trackingNumber: pickup.trackingNumber.trim() || null,
                date: pickup.date || null,
              }
            : undefined,
        }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setErrors((e) => ({ ...e, [r.id]: json?.error?.message ?? 'Could not update the return.' }));
      } else {
        setNotes((n) => ({ ...n, [r.id]: '' }));
        setPickups((p) => {
          const next = { ...p };
          delete next[r.id];
          return next;
        });
        router.refresh();
      }
    } catch {
      setErrors((e) => ({ ...e, [r.id]: 'Could not reach the server. Please try again.' }));
    } finally {
      setBusyId(null);
    }
  }

  async function confirmAndRefund() {
    const target = confirmRefund;
    if (!target) return;
    await run(target, 'refunded');
    setConfirmRefund(null);
  }

  return (
    <section className="rounded-lg border border-charcoal/10 bg-ivory p-5">
      <h2 className="font-heading text-lg text-maroon">Returns &amp; exchanges</h2>

      {returns.length === 0 ? (
        <p className="mt-2 text-xs text-ink-muted">No return or exchange requests for this order.</p>
      ) : (
        <div className="mt-4 space-y-5">
          {returns.map((r) => {
            const actions = actionsFor(r);
            const busy = busyId === r.id;
            const showPickupFields = r.status === 'requested' || r.status === 'approved';
            const pickup = pickupFormFor(r, pickups[r.id]);
            const hasSavedPickup = Boolean(r.pickupCourier || r.pickupTrackingNumber || r.pickupDate);
            const refundBadge = r.refund ? REFUND_BADGE[r.refund.status] : undefined;

            return (
              <div key={r.id} className="space-y-2 border-t border-charcoal/10 pt-4 first:border-t-0 first:pt-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-charcoal">
                      {r.isExchange ? 'Exchange' : 'Return'}: {r.itemName}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {[r.itemSize, r.itemColor].filter(Boolean).join(' / ')} · Qty {r.quantity}
                      {r.isExchange && r.exchangeSize ? ` · wants size ${r.exchangeSize}` : ''}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.1em] ${STATUS_CLASSES[r.status]}`}
                  >
                    {RETURN_STATUS_LABEL[r.status]}
                  </span>
                </div>

                <p className="text-sm text-ink-soft">
                  {r.reason}
                  {r.details && <span className="text-ink-muted"> — {r.details}</span>}
                </p>
                <p className="text-xs text-ink-muted">
                  Requested {formatDate(r.requestedAt, 'long')}
                  {r.resolvedAt ? ` · Closed ${formatDate(r.resolvedAt, 'long')}` : ''}
                  {r.refundAmount !== null ? ` · Refunded ${formatPrice(r.refundAmount)}` : ''}
                </p>
                {r.adminNotes && <p className="text-xs italic text-ink-soft">Note: {r.adminNotes}</p>}

                {hasSavedPickup && !showPickupFields && (
                  <p className="text-xs text-ink-soft">
                    Pickup:{' '}
                    {[
                      r.pickupCourier,
                      r.pickupTrackingNumber ? `Tracking ${r.pickupTrackingNumber}` : null,
                      r.pickupDate ? formatDate(`${r.pickupDate}T00:00:00`, 'long') : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}

                {r.refund && refundBadge && (
                  <div className="space-y-1">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ${refundBadge.className}`}
                    >
                      {refundBadge.label} · {formatPrice(r.refund.amount)}
                    </span>
                    {r.refund.status === 'failed' && r.refund.errorMessage && (
                      <p className="text-xs text-red-600">Razorpay: {r.refund.errorMessage}</p>
                    )}
                    {r.refund.status === 'processing' && (
                      <p className="text-xs text-ink-muted">
                        A refund is already in progress for this return. Refresh in a minute.
                      </p>
                    )}
                  </div>
                )}

                {actions.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {showPickupFields && (
                      <div className="space-y-2 rounded-md border border-charcoal/10 bg-white/60 p-3">
                        <p className="text-xs font-medium text-charcoal">
                          Pickup details <span className="font-normal text-ink-muted">(optional, shown to the customer)</span>
                        </p>
                        <div className="grid gap-2 sm:grid-cols-3">
                          <input
                            value={pickup.courier}
                            onChange={(e) =>
                              setPickups((p) => ({ ...p, [r.id]: { ...pickup, courier: e.target.value } }))
                            }
                            disabled={busy}
                            maxLength={80}
                            placeholder="Courier name"
                            aria-label="Pickup courier name"
                            className={inputClass}
                          />
                          <input
                            value={pickup.trackingNumber}
                            onChange={(e) =>
                              setPickups((p) => ({ ...p, [r.id]: { ...pickup, trackingNumber: e.target.value } }))
                            }
                            disabled={busy}
                            maxLength={80}
                            placeholder="Tracking number"
                            aria-label="Pickup tracking number"
                            className={inputClass}
                          />
                          <input
                            type="date"
                            value={pickup.date}
                            onChange={(e) =>
                              setPickups((p) => ({ ...p, [r.id]: { ...pickup, date: e.target.value } }))
                            }
                            disabled={busy}
                            aria-label="Pickup date"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    )}

                    <textarea
                      value={notes[r.id] ?? ''}
                      onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                      disabled={busy}
                      rows={2}
                      placeholder="Note (visible to the customer; required to reject)"
                      className="w-full rounded-md border border-charcoal/15 bg-white px-3 py-2 text-sm outline-none focus:border-gold"
                    />

                    {r.status === 'picked_up' && (
                      <label className="flex items-center gap-2 text-xs text-ink-soft">
                        <input
                          type="checkbox"
                          checked={restock[r.id] ?? true}
                          onChange={(e) => setRestock((s) => ({ ...s, [r.id]: e.target.checked }))}
                          disabled={busy}
                        />
                        Item is sellable — add it back to stock
                      </label>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {actions.map((a) => (
                        <button
                          key={a.action}
                          type="button"
                          disabled={busy || a.disabled}
                          onClick={() => (a.action === 'refunded' ? setConfirmRefund(r) : run(r, a.action))}
                          className={
                            a.danger
                              ? 'rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50'
                              : 'rounded-md bg-maroon px-3 py-1.5 text-xs font-medium text-ivory hover:bg-maroon/90 disabled:opacity-50'
                          }
                        >
                          {busy ? 'Working…' : a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {errors[r.id] && <p className="text-xs text-red-600">{errors[r.id]}</p>}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirmRefund !== null}
        title={
          confirmRefund?.refundPreview != null
            ? `Refund ${formatPrice(confirmRefund.refundPreview)}?`
            : 'Issue this refund?'
        }
        message={
          confirmRefund?.refund?.status === 'processed'
            ? 'The money for this return was already refunded through Razorpay. This only finishes recording it; the customer will not be refunded twice.'
            : `${
                confirmRefund?.refundPreview != null ? formatPrice(confirmRefund.refundPreview) : 'The refund amount'
              } will be sent back to the customer's original payment method through Razorpay. This cannot be undone.`
        }
        confirmLabel={
          confirmRefund?.refundPreview != null ? `Refund ${formatPrice(confirmRefund.refundPreview)}` : 'Issue refund'
        }
        destructive
        busy={busyId !== null}
        onConfirm={confirmAndRefund}
        onCancel={() => setConfirmRefund(null)}
      />
    </section>
  );
}
