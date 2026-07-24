/* ============================================
   EIFA COUTURE — Admin Order Shared Types
   ============================================
   Pure types/constants, zero runtime imports. orders.ts (server reads,
   pulls in next/headers) and orders-actions.ts (browser writes) are
   both imported from Client Components, so anything shared between
   them has to live here — otherwise Turbopack bundles next/headers
   into the client build and it fails.
   ============================================ */

import type { OrderStatus, PaymentStatus, PaymentProvider, OrderHistoryActorType } from '@/types/database';

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out for delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'returned', label: 'Returned' },
  { value: 'refunded', label: 'Refunded' },
];

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

export interface OrderListFilters {
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  dateFrom?: string;
  dateTo?: string;
  sort?: 'newest' | 'oldest' | 'total_desc' | 'total_asc';
  page?: number;
  pageSize?: number;
}

export interface OrderListRow {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentProvider;
  total: number;
  placedAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  itemCount: number;
}

/**
 * Allowed forward transitions for order.status. Any target not listed for
 * the current status is rejected (e.g. delivered -> processing, cancelled ->
 * shipped). Enforced both in the admin UI (orders-actions.ts) and should be
 * mirrored by DB-side checks if written outside this app.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
  delivered: ['returned'],
  cancelled: [],
  returned: ['refunded'],
  refunded: [],
};

export function isValidOrderStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  return ORDER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface OrderListResult {
  rows: OrderListRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentProvider: PaymentProvider;
  paymentProviderRef: string | null;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  trackingNumber: string | null;
  shippingProvider: string | null;
  invoiceUrl: string | null;
  placedAt: string;
  updatedAt: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    email: string | null;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  items: {
    id: string;
    name: string;
    imageUrl: string | null;
    size: string;
    colorName: string;
    quantity: number;
    unitPrice: number;
  }[];
}

/** One row from `order_status_history`, joined with the actor's display name (if any). */
export interface OrderHistoryEntry {
  id: string;
  eventType: string;
  previousStatus: string | null;
  newStatus: string | null;
  actorType: OrderHistoryActorType;
  actorName: string | null;
  notes: string | null;
  createdAt: string;
}

/** Labels for events that aren't a plain order-status transition. */
const EVENT_TYPE_LABELS: Record<string, string> = {
  order_created: 'Order placed',
  razorpay_order_created: 'Payment initiated',
  payment_successful: 'Payment successful',
  payment_failed: 'Payment failed',
  payment_refunded: 'Payment refunded',
};

const ACTOR_TYPE_FALLBACK_LABEL: Record<OrderHistoryActorType, string> = {
  customer: 'Customer',
  admin: 'Admin',
  system: 'System',
  webhook: 'Payment gateway',
};

/** Human-readable label for a history row's headline (not including actor/notes). */
export function getHistoryEventLabel(entry: Pick<OrderHistoryEntry, 'eventType' | 'newStatus'>): string {
  if (entry.eventType === 'status_change' && entry.newStatus) {
    return entry.newStatus.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
  }
  return EVENT_TYPE_LABELS[entry.eventType] ?? entry.eventType.replace(/_/g, ' ');
}

/** Human-readable "who did this" label, falling back to the actor type when no name is on file. */
export function getHistoryActorLabel(entry: Pick<OrderHistoryEntry, 'actorType' | 'actorName'>): string {
  return entry.actorName ?? ACTOR_TYPE_FALLBACK_LABEL[entry.actorType];
}

/** Whether this event represents a negative/terminal outcome, for timeline dot coloring. */
export function isHistoryEventNegative(entry: Pick<OrderHistoryEntry, 'eventType' | 'newStatus'>): boolean {
  if (entry.eventType === 'payment_failed') return true;
  if (entry.eventType === 'status_change' && entry.newStatus) {
    return ['cancelled', 'returned'].includes(entry.newStatus);
  }
  return false;
}