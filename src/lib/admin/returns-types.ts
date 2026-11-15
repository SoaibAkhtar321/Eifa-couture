/* Pure types for the admin returns panel (no runtime imports, so Client
   Components can import them without pulling in next/headers). */

import type { ReturnStatus } from '@/types/database';

export interface AdminReturnRefund {
  status: string; // processing | processed | failed
  amount: number;
  errorMessage: string | null;
  processedAt: string | null;
}

/**
 * What the admin Refund button will pay for one return: the item's share of
 * what the customer actually paid (coupon discount spread across items).
 * MUST stay identical to the amount computed in
 * src/app/api/admin/returns/[id]/route.ts, which is the amount actually
 * refunded; this copy is for display only.
 */
export function computeReturnRefundPreview(
  unitPrice: number,
  quantity: number,
  orderSubtotal: number,
  orderDiscount: number
): number {
  const paidRatio = orderSubtotal > 0 ? Math.max(0, (orderSubtotal - orderDiscount) / orderSubtotal) : 1;
  return Math.round(unitPrice * quantity * paidRatio * 100) / 100;
}

export interface AdminReturnRecord {
  id: string;
  status: ReturnStatus;
  reason: string;
  details: string | null;
  quantity: number;
  isExchange: boolean;
  exchangeSize: string | null;
  adminNotes: string | null;
  refundAmount: number | null;
  requestedAt: string;
  resolvedAt: string | null;
  itemName: string;
  itemSize: string;
  itemColor: string;
  pickupCourier: string | null;
  pickupTrackingNumber: string | null;
  /** YYYY-MM-DD */
  pickupDate: string | null;
  /** Amount the Refund button will pay; null when it cannot be computed. */
  refundPreview: number | null;
  /** The refund linked to this return, if one was ever started. */
  refund: AdminReturnRefund | null;
}

/* ---------- Admin returns inbox (/admin/returns) ---------- */

/** Statuses that still need admin attention (the default inbox view). */
export const OPEN_RETURN_STATUSES: readonly ReturnStatus[] = [
  'requested',
  'approved',
  'picked_up',
  'received',
];

export type ReturnInboxFilter = 'open' | 'all' | ReturnStatus;

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  requested: 'Requested',
  approved: 'Approved',
  rejected: 'Rejected',
  picked_up: 'Picked up',
  received: 'Received',
  refunded: 'Refunded',
  exchanged: 'Exchanged',
};

export const RETURN_INBOX_FILTER_OPTIONS: { value: ReturnInboxFilter; label: string }[] = [
  { value: 'open', label: 'Open (needs action)' },
  { value: 'all', label: 'All returns' },
  { value: 'requested', label: 'Requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'picked_up', label: 'Picked up' },
  { value: 'received', label: 'Received' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'exchanged', label: 'Exchanged' },
];

export interface ReturnInboxRow {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  itemName: string;
  itemSize: string;
  itemColor: string;
  quantity: number;
  isExchange: boolean;
  reason: string;
  status: ReturnStatus;
  requestedAt: string;
}

export interface ReturnInboxResult {
  rows: ReturnInboxRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}
