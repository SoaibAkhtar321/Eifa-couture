/* ============================================
   EIFA COUTURE — Live policy numbers
   ============================================
   The legal pages, footer, product page and llms.txt must quote the same
   numbers the app actually enforces. Those live in Admin → Settings
   (store_settings): the database checks return_window_days when a return
   is requested, and checkout charges shipping_flat_rate /
   shipping_free_threshold. Constants in constants.ts are only the
   fallback when settings cannot be read.
   ============================================ */

import { RETURN_POLICY, SHIPPING_INFO } from '@/lib/constants';
import { getCachedStoreSettings } from '@/lib/data/storefront-cache';

export interface PolicyValues {
  returnWindowDays: number;
  /** Working days for money to reach the customer once we start a refund. */
  refundDays: { min: number; max: number };
  shippingFlatRate: number;
  /** null = no free-shipping threshold is set. */
  freeShippingThreshold: number | null;
  deliveryDays: { min: number; max: number };
}

export async function getPolicyValues(): Promise<PolicyValues> {
  const settings = await getCachedStoreSettings();
  return {
    returnWindowDays: settings?.return_window_days ?? RETURN_POLICY.returnWindow,
    refundDays: RETURN_POLICY.refundProcessingDays,
    shippingFlatRate: settings ? Number(settings.shipping_flat_rate) : SHIPPING_INFO.standardShippingCost,
    freeShippingThreshold: settings ? settings.shipping_free_threshold : SHIPPING_INFO.freeShippingThreshold,
    deliveryDays: settings
      ? { min: settings.delivery_days_min, max: settings.delivery_days_max }
      : SHIPPING_INFO.standardDeliveryDays,
  };
}
