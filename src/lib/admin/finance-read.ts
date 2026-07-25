/* ============================================
   EIFA COUTURE — Admin Finance Data Access (server reads)
   ============================================
   Read-only. Mirrors the shape of `lib/admin/analytics-read.ts`, but
   the actual aggregation happens in Postgres via the
   `get_finance_overview` RPC (migration 0020) instead of being
   reduced client/server-side in JS — see that migration for why.

   Uses the SERVER (session-scoped) Supabase client, same as the rest
   of `lib/admin/*-read.ts`. The RPC is SECURITY INVOKER, so existing
   RLS policies on `orders`/`refunds` apply exactly as they do for any
   other query — this module never needs the service-role key.
   ============================================ */

import { createClient as createServerClient } from '@/lib/supabase/server';
import { resolveFinanceRange, type FinancePreset } from '@/lib/admin/finance-range';

export type { FinancePreset } from '@/lib/admin/finance-range';
export { FINANCE_PRESET_OPTIONS } from '@/lib/admin/finance-range';

export interface FinanceTotals {
  grossRevenue: number;
  netRevenue: number;
  totalRevenue: number;
  totalOrders: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  totalRefunds: number;
  refundedAmount: number;
  pendingRefundAmount: number;
  averageOrderValue: number;
  paymentSuccessRate: number;
}

export interface FinanceRefundAnalytics {
  totalRefundRequests: number;
  successfulRefunds: number;
  pendingRefunds: number;
  failedRefunds: number;
  totalRefundedAmount: number;
  refundPercentage: number;
}

export type PaymentMethodKey =
  | 'upi'
  | 'credit_card'
  | 'debit_card'
  | 'netbanking'
  | 'wallet'
  | 'emi'
  | 'other';

export interface PaymentMethodRow {
  method: PaymentMethodKey;
  count: number;
  percentage: number;
  revenue: number;
}

export interface DailyFinancePoint {
  date: string;
  revenue: number;
  orders: number;
  refundedAmount: number;
}

export interface WeeklyFinancePoint {
  weekStart: string;
  revenue: number;
  orders: number;
}

export interface MonthlyFinancePoint {
  monthStart: string;
  revenue: number;
  orders: number;
}

export interface CumulativeRevenuePoint {
  date: string;
  cumulativeRevenue: number;
}

export interface FinanceOverview {
  range: { start: string; end: string };
  totals: FinanceTotals;
  refundAnalytics: FinanceRefundAnalytics;
  paymentMethods: PaymentMethodRow[];
  dailySeries: DailyFinancePoint[];
  weeklySeries: WeeklyFinancePoint[];
  monthlySeries: MonthlyFinancePoint[];
  cumulativeRevenue: CumulativeRevenuePoint[];
}

export async function getFinanceOverview(
  preset: FinancePreset,
  customStart?: string | null,
  customEnd?: string | null
): Promise<{ data: FinanceOverview | null; range: { start: string; end: string }; error: string | null }> {
  const supabase = await createServerClient();
  const range = resolveFinanceRange(preset, customStart, customEnd);

  const { data, error } = await supabase.rpc('get_finance_overview', {
    p_start: range.start,
    p_end: range.end,
  });

  if (error) {
    return { data: null, range, error: error.message };
  }

  return { data: data as unknown as FinanceOverview, range, error: null };
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodKey, string> = {
  upi: 'UPI',
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  netbanking: 'Net Banking',
  wallet: 'Wallet',
  emi: 'EMI',
  other: 'Other',
};
