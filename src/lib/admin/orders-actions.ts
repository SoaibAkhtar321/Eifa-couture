/* ============================================
   EIFA COUTURE — Admin Order Write Actions (browser client)
   ============================================
   Client-safe: only imports the browser Supabase client. Safe to
   import from 'use client' components. Reads live in orders.ts
   (server-only); shared types/constants in orders-types.ts.
   ============================================ */

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { OrderStatus } from '@/types/database';
import { isValidOrderStatusTransition } from './orders-types';

const RESTOCK_TRIGGERS: OrderStatus[] = ['cancelled', 'refunded'];

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  previousStatus: OrderStatus
): Promise<{ error: string | null }> {
  if (!isValidOrderStatusTransition(previousStatus, status)) {
    return {
      error: `Cannot change status from "${previousStatus.replace(/_/g, ' ')}" to "${status.replace(/_/g, ' ')}".`,
    };
  }

  const supabase = createBrowserClient();

  const shouldRestock =
    RESTOCK_TRIGGERS.includes(status) &&
    !RESTOCK_TRIGGERS.includes(previousStatus) &&
    previousStatus !== 'returned';

  const { error: updateError } = await supabase.from('orders').update({ status }).eq('id', orderId);

  if (updateError) {
    return { error: updateError.message };
  }

  if (shouldRestock) {
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('variant_id, quantity')
      .eq('order_id', orderId);

    if (itemsError) {
      return { error: `Status updated, but restock lookup failed: ${itemsError.message}` };
    }

    for (const item of (items ?? []) as { variant_id: string | null; quantity: number }[]) {
      if (!item.variant_id) continue;

      const { data: inv } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('variant_id', item.variant_id)
        .maybeSingle();

      if (!inv) continue;

      await supabase
        .from('inventory')
        .update({ quantity: (inv as { quantity: number }).quantity + item.quantity })
        .eq('variant_id', item.variant_id);
    }
  }

  return { error: null };
}