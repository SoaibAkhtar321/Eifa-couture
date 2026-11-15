/* ============================================
   EIFA COUTURE — Order Lifecycle Policy
   ============================================
   Single source of truth for order-lifecycle rules: who may cancel
   and when, how long returns are open, what an admin may move an
   order to, and how the estimated delivery date is computed.

   Pure functions, no I/O, no 'use client' — importable from server
   routes, client components and emails alike. Server routes (Phase
   C/D) MUST re-check these rules; the UI uses them only to decide
   what to show.
   ============================================ */

import type { OrderStatus, PaymentStatus, ReturnStatus } from '@/types/database';

/* ── Tunable defaults (overridden by store_settings when present) ── */

export const DEFAULT_DELIVERY_DAYS_MIN = 7;
export const DEFAULT_DELIVERY_DAYS_MAX = 12;
export const DEFAULT_RETURN_WINDOW_DAYS = 7;

/* ── Labels ── */

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Order placed',
  confirmed: 'Confirmed',
  processing: 'Packing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
  refunded: 'Refunded',
};

export const RETURN_STATUS_LABEL: Record<ReturnStatus, string> = {
  requested: 'Return requested',
  approved: 'Return approved',
  rejected: 'Return rejected',
  picked_up: 'Picked up',
  received: 'Received at warehouse',
  refunded: 'Refund issued',
  exchanged: 'Exchange shipped',
};

/* ── Forward flow shown on the tracking timeline ── */

export const ORDER_FLOW: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
];

/* ── Admin transitions ──
   What an admin may move an order to from each status. Keeps the
   history trustworthy (no jumping delivered → pending). `refunded`
   is reached through the refund flow as well as manually. */

export const ADMIN_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: ['returned', 'refunded'],
  cancelled: ['refunded'],
  returned: ['refunded'],
  refunded: [],
};

export function canAdminTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ADMIN_ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

/* ── Customer self-cancel ──
   Allowed only before the parcel leaves us. */

export const CUSTOMER_CANCELLABLE_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing'];

export const CANCEL_REASONS = [
  'Ordered by mistake',
  'Found a better price elsewhere',
  'Want to change size, colour or address',
  'Delivery is taking too long',
  'Other',
] as const;

export interface CancelCheckInput {
  status: OrderStatus;
  payment_status: PaymentStatus;
  shipped_at?: string | null;
}

export type CancelBlockReason = 'already_shipped' | 'already_closed' | 'refund_in_progress';

export function getCancelEligibility(
  order: CancelCheckInput
): { ok: true } | { ok: false; reason: CancelBlockReason; message: string } {
  if (order.status === 'cancelled' || order.status === 'refunded' || order.status === 'returned') {
    return { ok: false, reason: 'already_closed', message: 'This order is already closed.' };
  }
  if (order.shipped_at || !CUSTOMER_CANCELLABLE_STATUSES.includes(order.status)) {
    return {
      ok: false,
      reason: 'already_shipped',
      message: 'This order has already shipped. You can request a return after it is delivered.',
    };
  }
  if (order.payment_status === 'refunded' || order.payment_status === 'partially_refunded') {
    return {
      ok: false,
      reason: 'refund_in_progress',
      message: 'A refund has already been started on this order.',
    };
  }
  return { ok: true };
}

export function canCustomerCancel(order: CancelCheckInput): boolean {
  return getCancelEligibility(order).ok;
}

/* ── Returns / exchanges ── */

export const RETURN_REASONS = [
  'Size or fit issue',
  'Colour different from photos',
  'Damaged or defective',
  'Wrong item received',
  'Quality not as expected',
  'Changed my mind',
  'Other',
] as const;

/** Statuses where a return is still in progress for an item. */
export const OPEN_RETURN_STATUSES: ReturnStatus[] = ['requested', 'approved', 'picked_up', 'received'];

export const ADMIN_RETURN_TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  requested: ['approved', 'rejected'],
  approved: ['picked_up', 'rejected'],
  picked_up: ['received'],
  received: ['refunded', 'exchanged'],
  rejected: [],
  refunded: [],
  exchanged: [],
};

export function canAdminTransitionReturn(from: ReturnStatus, to: ReturnStatus): boolean {
  return ADMIN_RETURN_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface ReturnCheckInput {
  status: OrderStatus;
  payment_status: PaymentStatus;
  delivered_at: string | null;
}

export type ReturnBlockReason = 'not_delivered' | 'not_paid' | 'window_closed';

export function getReturnEligibility(
  order: ReturnCheckInput,
  windowDays: number = DEFAULT_RETURN_WINDOW_DAYS,
  now: Date = new Date()
):
  | { ok: true; deadline: Date }
  | { ok: false; reason: ReturnBlockReason; message: string } {
  if (order.status !== 'delivered' || !order.delivered_at) {
    return {
      ok: false,
      reason: 'not_delivered',
      message: 'Returns can be requested once the order is delivered.',
    };
  }
  if (order.payment_status !== 'paid' && order.payment_status !== 'partially_refunded') {
    return { ok: false, reason: 'not_paid', message: 'This order is not eligible for a return.' };
  }

  const delivered = new Date(order.delivered_at);
  const deadline = endOfDay(addDays(delivered, windowDays));
  if (now.getTime() > deadline.getTime()) {
    return {
      ok: false,
      reason: 'window_closed',
      message: `The ${windowDays}-day return window for this order has closed.`,
    };
  }
  return { ok: true, deadline };
}

/* ── Estimated delivery ── */

export interface DeliveryEstimate {
  from: Date;
  to: Date;
}

/**
 * Estimate = placement (or payment) date + min..max business days.
 * Sundays are skipped, since couriers do not deliver or pick up.
 */
export function computeDeliveryEstimate(
  startedAt: Date | string,
  minDays: number = DEFAULT_DELIVERY_DAYS_MIN,
  maxDays: number = DEFAULT_DELIVERY_DAYS_MAX
): DeliveryEstimate {
  const start = typeof startedAt === 'string' ? new Date(startedAt) : startedAt;
  const lo = Math.max(0, Math.floor(minDays));
  const hi = Math.max(lo, Math.floor(maxDays));
  return { from: addBusinessDays(start, lo), to: addBusinessDays(start, hi) };
}

/** YYYY-MM-DD for the `orders.estimated_delivery_date` column. */
export function toDateColumn(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Customer-facing: "Arrives by Mon, 24 Nov", or null when delivered/closed. */
export function formatDeliveryPromise(
  status: OrderStatus,
  estimatedDeliveryDate: string | null
): string | null {
  if (!estimatedDeliveryDate) return null;
  if (status === 'delivered' || status === 'cancelled' || status === 'refunded' || status === 'returned') {
    return null;
  }
  const date = new Date(`${estimatedDeliveryDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const text = date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  return status === 'out_for_delivery' ? `Arriving today or tomorrow (by ${text})` : `Arrives by ${text}`;
}

/* ── date helpers ── */

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addBusinessDays(date: Date, days: number): Date {
  const next = new Date(date);
  let remaining = days;
  while (remaining > 0) {
    next.setDate(next.getDate() + 1);
    if (next.getDay() !== 0) remaining -= 1;
  }
  // Landing on a Sunday (only possible when days === 0) rolls to Monday.
  if (next.getDay() === 0) next.setDate(next.getDate() + 1);
  return next;
}

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}
