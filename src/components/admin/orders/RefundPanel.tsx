'use client';

/* ============================================
   EIFA COUTURE — Admin Refund Panel
   ============================================
   Lives in the order detail page's Payment section. Posts to
   /api/admin/orders/[id]/refund rather than writing to Supabase
   directly (unlike OrderStatusUpdate/updateOrderStatus) because
   issuing a refund requires calling Razorpay with the server-side
   secret key — that can only happen from a trusted API route, not
   the browser client.
   ============================================ */

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { TextField, TextareaField } from '@/components/admin/FormField';
import { formatPrice, formatDate } from '@/lib/utils';
import type { PaymentProvider, PaymentStatus } from '@/types/database';
import type { RefundRecord } from '@/lib/admin/orders-types';

const REFUND_STATUS_LABELS: Record<RefundRecord['status'], string> = {
  processing: 'Processing',
  processed: 'Processed',
  failed: 'Failed',
};

const REFUND_STATUS_CLASSES: Record<RefundRecord['status'], string> = {
  processing: 'bg-gold/15 text-gold',
  processed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

interface RefundPanelProps {
  orderId: string;
  orderTotal: number;
  paymentStatus: PaymentStatus;
  paymentProvider: PaymentProvider;
  razorpayPaymentId: string | null;
  refundableAmount: number;
  refunds: RefundRecord[];
}

export default function RefundPanel({
  orderId,
  orderTotal,
  paymentStatus,
  paymentProvider,
  razorpayPaymentId,
  refundableAmount,
  refunds,
}: RefundPanelProps) {
  const router = useRouter();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [amountInput, setAmountInput] = useState(refundableAmount.toFixed(2));
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canRefund =
    paymentProvider === 'razorpay' &&
    Boolean(razorpayPaymentId) &&
    (paymentStatus === 'paid' || paymentStatus === 'partially_refunded') &&
    refundableAmount > 0;

  function openForm() {
    setRefundType('full');
    setAmountInput(refundableAmount.toFixed(2));
    setReason('');
    setFormError(null);
    setIsFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const amount = refundType === 'full' ? refundableAmount : Number(amountInput);

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('Enter a valid refund amount.');
      return;
    }
    if (amount > refundableAmount) {
      setFormError(`Amount cannot exceed the refundable balance of ${formatPrice(refundableAmount)}.`);
      return;
    }

    const confirmed = confirm(
      `Refund ${formatPrice(amount)} for this order via Razorpay? This cannot be undone.`
    );
    if (!confirmed) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: refundType === 'full' ? undefined : amount,
          reason: reason.trim() || undefined,
        }),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        setFormError(json?.error?.message ?? 'Could not process the refund. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setIsFormOpen(false);
      setIsSubmitting(false);
      router.refresh();
    } catch {
      setFormError('Could not reach the server. Please check your connection and try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-charcoal/10 bg-ivory p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg text-maroon">Refunds</h2>

        {!isFormOpen && (
          <button
            type="button"
            onClick={openForm}
            disabled={!canRefund}
            className="rounded-md border border-maroon px-3 py-1.5 text-xs font-medium text-maroon transition-colors hover:bg-maroon hover:text-ivory disabled:cursor-not-allowed disabled:border-charcoal/20 disabled:text-charcoal/40 disabled:hover:bg-transparent"
          >
            Issue Refund
          </button>
        )}
      </div>

      {!canRefund && !isFormOpen && (
        <p className="mt-2 text-xs text-charcoal/50">
          {paymentProvider !== 'razorpay'
            ? 'This order was not paid via Razorpay.'
            : paymentStatus !== 'paid' && paymentStatus !== 'partially_refunded'
              ? 'Only paid orders can be refunded.'
              : 'This order has already been fully refunded.'}
        </p>
      )}

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 border-t border-charcoal/10 pt-4">
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="refund-type"
                checked={refundType === 'full'}
                onChange={() => setRefundType('full')}
              />
              Full refund ({formatPrice(refundableAmount)})
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="refund-type"
                checked={refundType === 'partial'}
                onChange={() => setRefundType('partial')}
              />
              Partial refund
            </label>
          </div>

          {refundType === 'partial' && (
            <TextField
              label="Amount"
              type="number"
              min="0.01"
              max={refundableAmount}
              step="0.01"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              hint={`Up to ${formatPrice(refundableAmount)} available to refund (order total ${formatPrice(orderTotal)}).`}
            />
          )}

          <TextareaField
            label="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Customer requested cancellation, damaged item…"
          />

          {formError && <p className="text-xs text-red-600">{formError}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-maroon px-4 py-2 text-xs font-medium text-ivory transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Processing…' : 'Confirm Refund'}
            </button>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              disabled={isSubmitting}
              className="rounded-md border border-charcoal/15 px-4 py-2 text-xs font-medium text-charcoal/70 transition-colors hover:bg-charcoal/5"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {refunds.length > 0 && (
        <div className="mt-4 space-y-3 border-t border-charcoal/10 pt-4">
          {refunds.map((refund) => (
            <div key={refund.id} className="flex items-start justify-between gap-3 text-sm">
              <div>
                <p className="text-charcoal">
                  {formatPrice(refund.amount)}
                  {refund.reason && <span className="text-charcoal/50"> — {refund.reason}</span>}
                </p>
                <p className="mt-0.5 text-xs text-charcoal/50">
                  {formatDate(refund.processedAt ?? refund.createdAt, 'long')}
                  {refund.razorpayRefundId && <> · {refund.razorpayRefundId}</>}
                </p>
                {refund.status === 'failed' && refund.errorMessage && (
                  <p className="mt-0.5 text-xs text-red-600">{refund.errorMessage}</p>
                )}
              </div>

              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.1em] ${REFUND_STATUS_CLASSES[refund.status]}`}
              >
                {REFUND_STATUS_LABELS[refund.status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
