'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { SelectField } from '@/components/admin/FormField';
import { ORDER_STATUS_OPTIONS, ORDER_STATUS_TRANSITIONS } from '@/lib/admin/orders-types';
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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(next: OrderStatus) {
    if (next === status) return;

    if (
      RESTOCK_STATUSES.includes(next) &&
      !confirm(`Set status to "${next.replace(/_/g, ' ')}"? This will restock inventory for this order's items.`)
    ) {
      return;
    }

    setIsSaving(true);
    setError(null);

    const { error: updateError } = await updateOrderStatus(orderId, next, status);

    if (updateError) {
      setError(updateError);
      setIsSaving(false);
      return;
    }

    setStatus(next);
    setIsSaving(false);
    router.refresh();
  }

  const allowedNext = ORDER_STATUS_TRANSITIONS[status] ?? [];
  const selectableOptions = ORDER_STATUS_OPTIONS.filter(
    (opt) => opt.value === status || allowedNext.includes(opt.value)
  );

  return (
    <div className="w-56">
      <SelectField
        label="Status"
        value={status}
        disabled={isSaving || allowedNext.length === 0}
        onChange={(e) => handleChange(e.target.value as OrderStatus)}
        options={selectableOptions}
      />
      {allowedNext.length === 0 && !error && (
        <p className="mt-1 text-xs text-charcoal/50">This is a final status and can&apos;t be changed further.</p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}