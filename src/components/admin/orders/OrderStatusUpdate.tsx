'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { SelectField, TextareaField } from '@/components/admin/FormField';
import { ORDER_STATUS_OPTIONS } from '@/lib/admin/orders-types';
import { updateOrderStatus } from '@/lib/admin/orders-actions';
import type { OrderStatus } from '@/types/database';

const RESTOCK_STATUSES: OrderStatus[] = ['cancelled', 'refunded'];

export default function OrderStatusUpdate({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function commitChange(next: OrderStatus, noteText: string) {
    setIsSaving(true);
    setError(null);

    const { error: updateError } = await updateOrderStatus(orderId, next, status, noteText);

    if (updateError) {
      setError(updateError);
      setIsSaving(false);
      return;
    }

    setStatus(next);
    setPendingStatus(null);
    setNotes('');
    setIsSaving(false);
    router.refresh();
  }

  async function handleChange(next: OrderStatus) {
    if (next === status) return;

    if (
      RESTOCK_STATUSES.includes(next) &&
      !confirm(`Set status to "${next.replace(/_/g, ' ')}"? This will restock inventory for this order's items.`)
    ) {
      return;
    }

    // Hold the change here so the admin can optionally attach a note
    // before it's written — the note lands in the same history row as
    // the status transition.
    setPendingStatus(next);
  }

  return (
    <div className="w-64 space-y-2">
      <SelectField
        label="Status"
        value={pendingStatus ?? status}
        disabled={isSaving}
        onChange={(e) => handleChange(e.target.value as OrderStatus)}
        options={ORDER_STATUS_OPTIONS}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}

      {pendingStatus && (
        <div className="rounded-md border border-charcoal/10 bg-beige/30 p-3 space-y-2">
          <TextareaField
            label="Note (optional)"
            placeholder='e.g. "Package handed to courier."'
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSaving}
            rows={2}
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => commitChange(pendingStatus, notes)}
              className="rounded-md bg-maroon px-3 py-1.5 text-xs font-medium text-ivory hover:bg-maroon/90 disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : 'Confirm'}
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                setPendingStatus(null);
                setNotes('');
              }}
              className="rounded-md border border-charcoal/15 px-3 py-1.5 text-xs font-medium text-charcoal hover:bg-charcoal/5 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}