'use client';

/* ============================================
   EIFA COUTURE — Orders Data Access
   ============================================
   Thin Supabase query layer for `orders` / `order_items`, mirroring
   the conventions in `lib/addresses.ts` and `lib/cart.ts`: no
   Supabase calls inside components/stores, only here.

   Order *creation* is intentionally NOT a plain `.insert()` — the
   `order_items` table has no client-writable RLS policy (see
   supabase/migrations/0005 + 0006), and inventory must be decremented
   in lockstep with the order row. Both are handled atomically by the
   `create_order` Postgres function (0006_create_order_rpc.sql), so
   this file only ever calls it via `supabase.rpc(...)`.
   ============================================ */

import { resolveVariantId } from '@/lib/cart';
import { createClient } from '@/lib/supabase/client';
import type { CartItem } from '@/types';
import type { DbAddress, DbOrder, DbOrderItem } from '@/types/database';

export interface CreateOrderShippingAddress {
  full_name: string;
  phone: string;
  email?: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  pincode: string;
}

export interface CreateOrderResult {
  id: string;
  order_number: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
}

export type CreateOrderError =
  | { type: 'not_authenticated' }
  | { type: 'empty_cart' }
  | { type: 'variant_not_found'; itemLabel: string }
  | { type: 'insufficient_stock'; productName: string }
  | { type: 'unknown'; message: string };

function parsePostgresError(error: { message?: string } | null): CreateOrderError {
  const message = error?.message ?? '';

  if (message.includes('not_authenticated')) return { type: 'not_authenticated' };
  if (message.includes('empty_cart')) return { type: 'empty_cart' };

  const insufficientMatch = message.match(/insufficient_stock:\s*(.+)$/);
  if (insufficientMatch) {
    return { type: 'insufficient_stock', productName: insufficientMatch[1].trim() };
  }

  const inactiveMatch = message.match(/variant_inactive:\s*(.+)$/);
  if (inactiveMatch) {
    return { type: 'insufficient_stock', productName: inactiveMatch[1].trim() };
  }

  if (message.includes('variant_not_found')) {
    return { type: 'variant_not_found', itemLabel: 'One of the items in your bag' };
  }

  return { type: 'unknown', message: message || 'Something went wrong placing your order.' };
}

/**
 * Resolve every cart line to its live `variant_id` before calling the
 * RPC. Returns `null` for the whole batch (rather than skipping lines)
 * if any single line can't be resolved — checkout should never silently
 * drop an item the customer expects to be charged for and to receive.
 */
async function resolveOrderItems(
  items: CartItem[]
): Promise<{ variant_id: string; quantity: number }[] | null> {
  const supabase = createClient();

  const resolved = await Promise.all(
    items.map((item) =>
      resolveVariantId(supabase, item.product.id, item.selectedSize, item.selectedColor)
    )
  );

  if (resolved.some((id) => !id)) return null;

  return resolved.map((variantId, index) => ({
    variant_id: variantId as string,
    quantity: items[index].quantity,
  }));
}

export function addressToShippingSnapshot(address: DbAddress): CreateOrderShippingAddress {
  return {
    full_name: address.full_name,
    phone: address.phone,
    address_line1: address.address_line1,
    address_line2: address.address_line2 ?? null,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
  };
}

/**
 * Places a real order: resolves variants, calls the atomic
 * `create_order` RPC (order + order_items + inventory decrement +
 * cart clear, all-or-nothing), and returns either the created order
 * or a typed error the UI can render a specific message for.
 */
export async function createOrder(
  items: CartItem[],
  shippingAddress: CreateOrderShippingAddress,
  shippingAddressId: string | null,
  shippingFee: number
): Promise<{ data: CreateOrderResult | null; error: CreateOrderError | null }> {
  if (items.length === 0) {
    return { data: null, error: { type: 'empty_cart' } };
  }

  const resolvedItems = await resolveOrderItems(items);
  if (!resolvedItems) {
    return {
      data: null,
      error: { type: 'variant_not_found', itemLabel: 'One of the items in your bag' },
    };
  }

  const supabase = createClient();

  const { data, error } = await supabase.rpc('create_order', {
    p_shipping_address: shippingAddress,
    p_shipping_address_id: shippingAddressId,
    p_shipping_fee: shippingFee,
    p_items: resolvedItems,
  });

  if (error) {
    return { data: null, error: parsePostgresError(error) };
  }

  return { data: data as CreateOrderResult, error: null };
}

/** Order summary shape the Account → Orders list consumes. */
export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: DbOrder['status'];
  paymentStatus: DbOrder['payment_status'];
  total: number;
  itemCount: number;
  placedAt: string;
}

export async function fetchOrders(userId: string): Promise<{ data: OrderSummary[]; error: unknown }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, status, payment_status, total, placed_at, order_items ( quantity )')
    .eq('user_id', userId)
    .order('placed_at', { ascending: false });

  if (error || !data) return { data: [], error };

  type Row = Pick<DbOrder, 'id' | 'order_number' | 'status' | 'payment_status' | 'total' | 'placed_at'> & {
    order_items: Pick<DbOrderItem, 'quantity'>[];
  };

  const summaries: OrderSummary[] = (data as unknown as Row[]).map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    paymentStatus: row.payment_status,
    total: Number(row.total),
    itemCount: row.order_items.reduce((sum, item) => sum + item.quantity, 0),
    placedAt: row.placed_at,
  }));

  return { data: summaries, error: null };
}

export interface OrderDetail extends OrderSummary {
  subtotal: number;
  shippingFee: number;
  shippingAddress: Record<string, unknown>;
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

export async function fetchOrderById(
  userId: string,
  orderId: string
): Promise<{ data: OrderDetail | null; error: unknown }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, order_number, status, payment_status, subtotal, shipping_fee, total, placed_at, shipping_address, order_items ( id, name, image_url, size, color_name, quantity, unit_price )'
    )
    .eq('user_id', userId)
    .eq('id', orderId)
    .maybeSingle();

  if (error || !data) return { data: null, error };

  type Row = DbOrder & { order_items: DbOrderItem[] };
  const row = data as unknown as Row;

  return {
    data: {
      id: row.id,
      orderNumber: row.order_number,
      status: row.status,
      paymentStatus: row.payment_status,
      subtotal: Number(row.subtotal),
      shippingFee: Number(row.shipping_fee),
      total: Number(row.total),
      itemCount: row.order_items.reduce((sum, item) => sum + item.quantity, 0),
      placedAt: row.placed_at,
      shippingAddress: row.shipping_address,
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