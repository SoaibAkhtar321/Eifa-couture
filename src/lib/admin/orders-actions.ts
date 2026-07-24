/* ============================================
   EIFA COUTURE — Admin Order Write Actions (browser client)
   ============================================
   Client-safe: only imports the browser Supabase client. Safe to
   import from 'use client' components. Reads live in orders.ts
   (server-only); shared types/constants in orders-types.ts.
   ============================================ */

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { OrderStatus } from '@/types/database';

const RESTOCK_TRIGGERS: OrderStatus[] = ['cancelled', 'refunded'];

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  previousStatus: OrderStatus,
  notes?: string
): Promise<{ error: string | null }> {
  const supabase = createBrowserClient();

  const shouldRestock =
    RESTOCK_TRIGGERS.includes(status) &&
    !RESTOCK_TRIGGERS.includes(previousStatus) &&
    previousStatus !== 'returned';

  const { error: updateError } = await supabase.from('orders').update({ status }).eq('id', orderId);

  if (updateError) {
    return { error: updateError.message };
  }

  // Best-effort: record who changed the status and why. Gated by the
  // `order_status_history_admin_insert` RLS policy (is_admin()), same
  // trust boundary as the `orders` update above — a failure here never
  // blocks the status change itself, since the write that matters
  // (the order's actual status) already succeeded.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const trimmedNotes = notes?.trim();

  const { error: historyError } = await supabase.from('order_status_history').insert({
    order_id: orderId,
    event_type: 'status_change',
    previous_status: previousStatus,
    new_status: status,
    actor_type: 'admin',
    actor_id: user?.id ?? null,
    notes: trimmedNotes ? trimmedNotes : null,
  });

  if (historyError) {
    console.error('Failed to record order status history:', historyError.message);
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