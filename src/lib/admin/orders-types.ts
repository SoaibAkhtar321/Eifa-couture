/* ============================================
   EIFA COUTURE — Admin Order Shared Types
   ============================================
   Pure types/constants, zero runtime imports. orders.ts (server reads,
   pulls in next/headers) and orders-actions.ts (browser writes) are
   both imported from Client Components, so anything shared between
   them has to live here — otherwise Turbopack bundles next/headers
   into the client build and it fails.
   ============================================ */

import type { OrderStatus, PaymentStatus, PaymentProvider } from '@/types/database';

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
  sort?: 'newest' | 'oldest' | 'total_desc' | 'total_asc';
  page?: number;
  pageSize?: number;
}

export interface OrderListRow {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  placedAt: string;
  customerName: string;
  customerPhone: string;
  itemCount: number;
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