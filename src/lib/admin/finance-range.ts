/* ============================================
   EIFA COUTURE — Admin Finance Date Range (client-safe)
   ============================================
   Split out from `finance-read.ts` for the same reason
   `analytics-range.ts` is split from `analytics-read.ts`: this file
   has no dependency on the server Supabase client, so
   `FinanceRangeSwitch` (a Client Component) can import it directly.
   ============================================ */

export type FinancePreset =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'thisMonth'
  | 'lastMonth'
  | 'custom';

export const FINANCE_PRESET_OPTIONS: { value: FinancePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'custom', label: 'Custom Range' },
];

export interface ResolvedFinanceRange {
  preset: FinancePreset;
  /** Inclusive start, ISO 8601. */
  start: string;
  /** Exclusive end, ISO 8601. */
  end: string;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/**
 * Resolves a preset (or explicit custom bounds) into concrete
 * [start, end) timestamps. `customStart`/`customEnd` are expected as
 * YYYY-MM-DD strings from a date input; end is treated as inclusive
 * of that whole day.
 */
export function resolveFinanceRange(
  preset: FinancePreset,
  customStart?: string | null,
  customEnd?: string | null
): ResolvedFinanceRange {
  const now = new Date();
  const today = startOfDay(now);

  switch (preset) {
    case 'today':
      return { preset, start: today.toISOString(), end: addDays(today, 1).toISOString() };
    case 'yesterday':
      return {
        preset,
        start: addDays(today, -1).toISOString(),
        end: today.toISOString(),
      };
    case 'last7':
      return { preset, start: addDays(today, -6).toISOString(), end: addDays(today, 1).toISOString() };
    case 'last30':
      return { preset, start: addDays(today, -29).toISOString(), end: addDays(today, 1).toISOString() };
    case 'thisMonth': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { preset, start: start.toISOString(), end: addDays(today, 1).toISOString() };
    }
    case 'lastMonth': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 1);
      return { preset, start: start.toISOString(), end: end.toISOString() };
    }
    case 'custom': {
      const start = customStart ? startOfDay(new Date(`${customStart}T00:00:00`)) : addDays(today, -29);
      const endBase = customEnd ? startOfDay(new Date(`${customEnd}T00:00:00`)) : today;
      return { preset, start: start.toISOString(), end: addDays(endBase, 1).toISOString() };
    }
    default:
      return { preset: 'last30', start: addDays(today, -29).toISOString(), end: addDays(today, 1).toISOString() };
  }
}
