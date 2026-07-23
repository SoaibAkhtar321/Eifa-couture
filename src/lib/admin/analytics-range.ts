/* ============================================
   EIFA COUTURE — Admin Analytics Range (client-safe)
   ============================================
   Split out of `analytics-read.ts` on purpose: this file has no
   dependency on the server Supabase client (`next/headers`), so
   Client Components — like `AnalyticsRangeSwitch` — can import it
   directly without pulling a server-only module into the client
   bundle. `analytics-read.ts` re-exports these for existing callers.
   ============================================ */

export type AnalyticsRange = 7 | 30 | 90;

export const ANALYTICS_RANGE_OPTIONS: { value: AnalyticsRange; label: string }[] = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
];
