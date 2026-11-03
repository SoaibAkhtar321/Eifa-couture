'use client';

import { useEffect, useState } from 'react';

import { SHIPPING_INFO } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';

export type ShippingConfig = {
  flatRate: number;
  freeThreshold: number | null;
};

const FALLBACK: ShippingConfig = {
  flatRate: SHIPPING_INFO.standardShippingCost,
  freeThreshold: SHIPPING_INFO.freeShippingThreshold,
};

let cached: Promise<ShippingConfig> | null = null;

function loadShippingConfig(): Promise<ShippingConfig> {
  cached ??= (async () => {
    const { data, error } = await createClient()
      .from('store_settings')
      .select('shipping_flat_rate, shipping_free_threshold')
      .eq('singleton', true)
      .maybeSingle();
    if (error || !data) return FALLBACK;
    return {
      flatRate: Number(data.shipping_flat_rate) || 0,
      freeThreshold: data.shipping_free_threshold === null ? null : Number(data.shipping_free_threshold),
    };
  })();
  return cached;
}

/** Shipping rules from admin Store Settings — the same values create_order() charges. */
export function useShippingConfig(): ShippingConfig {
  const [config, setConfig] = useState<ShippingConfig>(FALLBACK);

  useEffect(() => {
    let active = true;
    loadShippingConfig().then((value) => {
      if (active) setConfig(value);
    });
    return () => {
      active = false;
    };
  }, []);

  return config;
}

export function getShippingCharge(config: ShippingConfig, subtotal: number): number {
  if (subtotal <= 0) return 0;
  if (config.freeThreshold !== null && subtotal >= config.freeThreshold) return 0;
  return config.flatRate;
}
