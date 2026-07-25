/* ============================================
   EIFA COUTURE — Admin Finance CSV Export
   ============================================
   GET /api/admin/finance/export/[type]  (type: revenue | orders | refunds)
   Query params: range=<preset> or range=custom&start=YYYY-MM-DD&end=YYYY-MM-DD

   Auth pattern mirrors the existing admin refund route
   (src/app/api/admin/orders/[id]/refund/route.ts): session-scoped
   client confirms who's calling, role is checked against `profiles`
   directly (requireAdmin() isn't usable here — it redirects, which
   only works from Server Components). No service-role key is used;
   reads go through the session client so RLS's existing
   `orders_select_own_or_admin` / `refunds_select_own_or_admin`
   policies are the actual data gate, same as every other admin read
   in this codebase.

   Revenue report is sourced from the same SQL-aggregated
   `get_finance_overview` RPC the dashboard uses (one query, no raw
   row fetch). Orders/refunds reports page through the underlying
   tables in bounded chunks (PAGE_SIZE rows at a time, capped at
   MAX_PAGES) rather than a single unbounded select, so a very large
   date range can't trigger one huge query.
   ============================================ */

import { NextResponse, type NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { resolveFinanceRange, type FinancePreset } from '@/lib/admin/finance-range';
import { PAYMENT_METHOD_LABELS, type PaymentMethodKey } from '@/lib/admin/finance-read';
import type { UserRole } from '@/types/database';

const VALID_TYPES = ['revenue', 'orders', 'refunds'] as const;
type ExportType = (typeof VALID_TYPES)[number];

const VALID_PRESETS: FinancePreset[] = [
  'today',
  'yesterday',
  'last7',
  'last30',
  'thisMonth',
  'lastMonth',
  'custom',
];

const PAGE_SIZE = 1000;
const MAX_PAGES = 20; // hard ceiling: 20,000 rows per export

function csvEscape(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) {
    lines.push(row.map(csvEscape).join(','));
  }
  return lines.join('\n');
}

export async function GET(request: NextRequest, context: { params: Promise<{ type: string }> }) {
  const { type: rawType } = await context.params;

  if (!VALID_TYPES.includes(rawType as ExportType)) {
    return NextResponse.json({ error: { message: 'Unknown export type.' } }, { status: 400 });
  }
  const type = rawType as ExportType;

  // ---- Auth: session-scoped client confirms who's calling ----
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: { message: 'Not authenticated.' } }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = (profile as { role: UserRole } | null)?.role;

  if (profileError || !profile || (role !== 'admin' && role !== 'superadmin')) {
    return NextResponse.json({ error: { message: 'Admin access required.' } }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const presetParam = searchParams.get('range') ?? 'last30';
  const preset = (VALID_PRESETS.includes(presetParam as FinancePreset) ? presetParam : 'last30') as FinancePreset;
  const range = resolveFinanceRange(preset, searchParams.get('start'), searchParams.get('end'));

  try {
    if (type === 'revenue') {
      const { data: overview, error } = await supabase.rpc('get_finance_overview', {
        p_start: range.start,
        p_end: range.end,
      });

      if (error) {
        console.error('[admin/finance/export/revenue] RPC failed', { error: error.message });
        return NextResponse.json({ error: { message: 'Could not generate revenue report.' } }, { status: 500 });
      }

      const dailySeries = (overview as { dailySeries: { date: string; revenue: number; orders: number; refundedAmount: number }[] })
        .dailySeries;

      const csv = toCsv(
        ['Date', 'Revenue', 'Orders', 'Refunded Amount', 'Net Revenue'],
        dailySeries.map((d) => [d.date, d.revenue, d.orders, d.refundedAmount, d.revenue - d.refundedAmount])
      );

      return csvResponse(csv, `revenue-report-${range.start.slice(0, 10)}_to_${range.end.slice(0, 10)}.csv`);
    }

    if (type === 'orders') {
      const rows: (string | number | null)[][] = [];
      for (let page = 0; page < MAX_PAGES; page += 1) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, error } = await supabase
          .from('orders')
          .select('order_number, placed_at, status, payment_status, payment_method, total')
          .gte('placed_at', range.start)
          .lt('placed_at', range.end)
          .order('placed_at', { ascending: true })
          .range(from, to);

        if (error) {
          console.error('[admin/finance/export/orders] query failed', { error: error.message, page });
          return NextResponse.json({ error: { message: 'Could not generate orders report.' } }, { status: 500 });
        }

        const batch = (data ?? []) as {
          order_number: string;
          placed_at: string;
          status: string;
          payment_status: string;
          payment_method: string | null;
          total: number;
        }[];

        for (const o of batch) {
          rows.push([
            o.order_number,
            o.placed_at,
            o.status,
            o.payment_status,
            o.payment_method ? PAYMENT_METHOD_LABELS[o.payment_method as PaymentMethodKey] ?? o.payment_method : '',
            o.total,
          ]);
        }

        if (batch.length < PAGE_SIZE) break;
      }

      const csv = toCsv(
        ['Order Number', 'Placed At', 'Status', 'Payment Status', 'Payment Method', 'Total'],
        rows
      );

      return csvResponse(csv, `orders-report-${range.start.slice(0, 10)}_to_${range.end.slice(0, 10)}.csv`);
    }

    // refunds
    const rows: (string | number | null)[][] = [];
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('refunds')
        .select('id, order_id, orders(order_number), amount, status, reason, created_at, processed_at')
        .gte('created_at', range.start)
        .lt('created_at', range.end)
        .order('created_at', { ascending: true })
        .range(from, to);

      if (error) {
        console.error('[admin/finance/export/refunds] query failed', { error: error.message, page });
        return NextResponse.json({ error: { message: 'Could not generate refund report.' } }, { status: 500 });
      }

      const batch = (data ?? []) as unknown as {
        id: string;
        order_id: string;
        orders: { order_number: string } | null;
        amount: number;
        status: string;
        reason: string | null;
        created_at: string;
        processed_at: string | null;
      }[];

      for (const r of batch) {
        rows.push([
          r.orders?.order_number ?? r.order_id,
          r.amount,
          r.status,
          r.reason ?? '',
          r.created_at,
          r.processed_at ?? '',
        ]);
      }

      if (batch.length < PAGE_SIZE) break;
    }

    const csv = toCsv(['Order Number', 'Amount', 'Status', 'Reason', 'Created At', 'Processed At'], rows);

    return csvResponse(csv, `refund-report-${range.start.slice(0, 10)}_to_${range.end.slice(0, 10)}.csv`);
  } catch (err) {
    console.error('[admin/finance/export] unexpected error', {
      type,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: { message: 'Could not generate export.' } }, { status: 500 });
  }
}

function csvResponse(csv: string, filename: string): NextResponse {
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
