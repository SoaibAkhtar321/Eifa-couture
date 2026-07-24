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
import type { DbOrder, DbOrderItem, DbOrderStatusHistory } from '@/types/database';
import type { OrderListFilters, OrderListResult, OrderListRow, OrderDetail, OrderHistoryEntry } from './orders-types';

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
      'id, order_number, status, payment_status, payment_provider, total, placed_at, shipping_address, order_items ( quantity )',
      { count: 'exact' }
    );

  if (filters.search) {
    const term = filters.search.trim();
    query = query.or(
      `order_number.ilike.%${term}%,shipping_address->>full_name.ilike.%${term}%,shipping_address->>email.ilike.%${term}%,shipping_address->>phone.ilike.%${term}%`
    );
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.paymentStatus) {
    query = query.eq('payment_status', filters.paymentStatus);
  }
  if (filters.dateFrom) {
    query = query.gte('placed_at', filters.dateFrom);
  }
  if (filters.dateTo) {
    // dateTo is a plain date (YYYY-MM-DD); include the whole day.
    query = query.lt('placed_at', `${filters.dateTo}T23:59:59.999`);
  }

  query = query.order(sort.column, { ascending: sort.ascending }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  type RawRow = Pick<
    DbOrder,
    'id' | 'order_number' | 'status' | 'payment_status' | 'payment_provider' | 'total' | 'placed_at' | 'shipping_address'
  > & {
    order_items: { quantity: number }[];
  };

  const rows: OrderListRow[] = ((data ?? []) as unknown as RawRow[]).map((row) => {
    const address = row.shipping_address as { full_name?: string; phone?: string; email?: string } | null;

    return {
      id: row.id,
      orderNumber: row.order_number,
      status: row.status,
      paymentStatus: row.payment_status,
      paymentMethod: row.payment_provider,
      total: Number(row.total),
      placedAt: row.placed_at,
      customerName: address?.full_name ?? '—',
      customerEmail: address?.email ?? '—',
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

/**
 * Loads the full event history for one order, oldest first, in a
 * single query — the `profiles` embed resolves each event's actor
 * display name without an N+1 per row. Backward compatible with
 * orders that predate Phase 9: an order with no rows here simply
 * returns an empty array, and `OrderTimeline` falls back to its
 * synthesized view when it receives one.
 */
export async function getOrderStatusHistory(orderId: string): Promise<{
  data: OrderHistoryEntry[];
  error: string | null;
}> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('order_status_history')
    .select('id, event_type, previous_status, new_status, actor_type, actor_id, notes, created_at, profiles ( display_name )')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error || !data) {
    return { data: [], error: error?.message ?? null };
  }

  type Row = Pick<
    DbOrderStatusHistory,
    'id' | 'event_type' | 'previous_status' | 'new_status' | 'actor_type' | 'actor_id' | 'notes' | 'created_at'
  > & {
    profiles: { display_name: string } | { display_name: string }[] | null;
  };

  const entries: OrderHistoryEntry[] = (data as unknown as Row[]).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

    return {
      id: row.id,
      eventType: row.event_type,
      previousStatus: row.previous_status,
      newStatus: row.new_status,
      actorType: row.actor_type,
      actorName: profile?.display_name ?? null,
      notes: row.notes,
      createdAt: row.created_at,
    };
  });

  return { data: entries, error: null };
}