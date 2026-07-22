/* ============================================
   EIFA COUTURE — Admin Inventory Data Access (browser writes)
   ============================================
   Single-row updates reuse `updateInventoryQuantity` from
   lib/admin/products-write.ts directly (re-exported here) rather than
   duplicating it — that function already covers exactly this case.
   Only the bulk-update helper is new, following the same
   Promise.all-of-per-row-updates pattern as
   `reorderProductImages` in lib/admin/storage.ts.
   ============================================ */

import { createClient as createBrowserClient } from '@/lib/supabase/client';

export { updateInventoryQuantity } from './products-write';

export interface BulkStockUpdate {
  variantId: string;
  quantity: number;
}

export interface BulkUpdateError {
  variantId: string;
  message: string;
}

/**
 * Applies a quantity to every variant in `updates` (e.g. "set all
 * selected rows to 0" or a restock to a common count). Runs updates
 * concurrently and reports per-row failures instead of aborting the
 * whole batch on the first error.
 */
export async function bulkUpdateInventoryQuantities(
  updates: BulkStockUpdate[]
): Promise<{ errors: BulkUpdateError[] }> {
  const supabase = createBrowserClient();

  const results = await Promise.all(
    updates.map(async (update) => {
      const { error } = await supabase
        .from('inventory')
        .update({ quantity: update.quantity })
        .eq('variant_id', update.variantId);
      return { variantId: update.variantId, error };
    })
  );

  const errors: BulkUpdateError[] = results
    .filter((r) => r.error)
    .map((r) => ({ variantId: r.variantId, message: r.error!.message }));

  return { errors };
}
