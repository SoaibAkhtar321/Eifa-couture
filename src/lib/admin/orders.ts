/* ============================================
   EIFA COUTURE — Admin Order Data Access (server reads)
   ============================================
   Server-only: imports the server Supabase client (next/headers), so
   this file must only be imported from Server Components —
   admin/orders/page.tsx and admin/orders/[id]/page.tsx. Client
   Components import shared types/constants from orders-types.ts and
   the write action from orders-actions.ts instead.
   ============================================ */

import { createClient as createServerClient } from '@/lib/supabase/server';
import type { DbOrder, DbOrderItem } from '@/types/database';
import type { OrderListFilters, OrderListResult, OrderListRow, OrderDetail } from './orders-types';

export * from './orders-types';

const SORT_COLUMNS: Record<NonNullable<OrderListFilters['sort']>, { column: string; ascending: boolean }> = {
  newest: { column: 'placed_at', ascending: false },
  oldest: { column: 'placed_at', ascending: true },
  total_desc: { column: 'total', ascending: false },
  total_asc: { column: 'total', ascending: true },
};

export async function listOrders(filters: OrderListFilters = {}): Promise<{
  data: OrderListResult | null;
  error: string | null;
}> {
  const supabase = await createServerClient();

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const sort = SORT_COLUMNS[filters.sort ?? 'newest'];

  let query = supabase
    .from('orders')
    .select(
      'id, order_number, status, payment_status, total, placed_at, shipping_address, order_items ( quantity )',
      { count: 'exact' }
    );

  if (filters.search) {
    const term = filters.search.trim();
    query = query.or(`order_number.ilike.%${term}%,shipping_address->>full_name.ilike.%${term}%`);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.paymentStatus) {
    query = query.eq('payment_status', filters.paymentStatus);
  }

  query = query.order(sort.column, { ascending: sort.ascending }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  type RawRow = Pick<DbOrder, 'id' | 'order_number' | 'status' | 'payment_status' | 'total' | 'placed_at' | 'shipping_address'> & {
    order_items: { quantity: number }[];
  };

  const rows: OrderListRow[] = ((data ?? []) as unknown as RawRow[]).map((row) => {
    const address = row.shipping_address as { full_name?: string; phone?: string } | null;

    return {
      id: row.id,
      orderNumber: row.order_number,
      status: row.status,
      paymentStatus: row.payment_status,
      total: Number(row.total),
      placedAt: row.placed_at,
      customerName: address?.full_name ?? '—',
      customerPhone: address?.phone ?? '—',
      itemCount: row.order_items.reduce((sum, item) => sum + item.quantity, 0),
    };
  });

  return {
    data: { rows, totalCount: count ?? 0, page, pageSize },
    error: null,
  };
}

export async function getOrderById(orderId: string): Promise<{
  data: OrderDetail | null;
  error: string | null;
}> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      id, order_number, status, payment_status, payment_provider, payment_provider_ref,
      subtotal, discount, shipping_fee, total, tracking_number, shipping_provider, invoice_url,
      shipping_address, placed_at, updated_at,
      order_items ( id, name, image_url, size, color_name, quantity, unit_price )
    `
    )
    .eq('id', orderId)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }
  if (!data) {
    return { data: null, error: null };
  }

  type Row = DbOrder & { order_items: DbOrderItem[] };
  const row = data as unknown as Row;
  const address = row.shipping_address as Record<string, unknown>;

  return {
    data: {
      id: row.id,
      orderNumber: row.order_number,
      status: row.status,
      paymentStatus: row.payment_status,
      paymentProvider: row.payment_provider,
      paymentProviderRef: row.payment_provider_ref,
      subtotal: Number(row.subtotal),
      discount: Number(row.discount),
      shippingFee: Number(row.shipping_fee),
      total: Number(row.total),
      trackingNumber: row.tracking_number,
      shippingProvider: row.shipping_provider,
      invoiceUrl: row.invoice_url,
      placedAt: row.placed_at,
      updatedAt: row.updated_at,
      shippingAddress: {
        fullName: (address.full_name as string) ?? '',
        phone: (address.phone as string) ?? '',
        email: (address.email as string | undefined) ?? null,
        addressLine1: (address.address_line1 as string) ?? '',
        addressLine2: (address.address_line2 as string | null) ?? null,
        city: (address.city as string) ?? '',
        state: (address.state as string) ?? '',
        pincode: (address.pincode as string) ?? '',
      },
      items: row.order_items.map((item) => ({
        id: item.id,
        name: item.name,
        imageUrl: item.image_url,
        size: item.size,
        colorName: item.color_name,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
      })),
    },
    error: null,
  };
}