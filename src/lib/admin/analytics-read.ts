/* ============================================
   EIFA COUTURE — Admin Analytics Data Access (server reads)
   ============================================
   Read-only module: no write path, mirrors the shape of
   `lib/admin/customers-read.ts` and `lib/admin/orders.ts`. Reads use
   the SERVER Supabase client because `src/app/admin/analytics/page.tsx`
   is a Server Component reading `searchParams` directly, same
   reasoning as the rest of `lib/admin/*-read.ts`.

   All figures are derived from `orders` + nested `order_items` for a
   given trailing window (`rangeDays`). Revenue figures only ever count
   `payment_status = 'paid'` orders — same convention as the dashboard's
   `getDashboardStats()` in `src/app/admin/page.tsx`.
   ============================================ */

import { createClient as createServerClient } from '@/lib/supabase/server';
import type { OrderStatus } from '@/types/database';

export type { AnalyticsRange } from '@/lib/admin/analytics-range';
export { ANALYTICS_RANGE_OPTIONS } from '@/lib/admin/analytics-range';

import type { AnalyticsRange } from '@/lib/admin/analytics-range';

export interface RevenuePoint {
  date: string; // YYYY-MM-DD
  revenue: number;
  orders: number;
}

export interface StatusBreakdownPoint {
  status: OrderStatus;
  count: number;
}

export interface TopProductRow {
  productId: string | null;
  name: string;
  unitsSold: number;
  revenue: number;
}

export interface TopCategoryRow {
  categoryId: string | null;
  name: string;
  revenue: number;
  unitsSold: number;
}

export interface AnalyticsOverview {
  rangeDays: AnalyticsRange;
  totals: {
    revenue: number;
    orders: number;
    paidOrders: number;
    averageOrderValue: number;
    newCustomers: number;
  };
  revenueSeries: RevenuePoint[];
  statusBreakdown: StatusBreakdownPoint[];
  topProducts: TopProductRow[];
  topCategories: TopCategoryRow[];
}

type OrderItemRow = {
  quantity: number;
  unit_price: number;
  product_id: string | null;
  name: string;
};

type OrderRow = {
  id: string;
  status: OrderStatus;
  payment_status: string;
  total: number;
  placed_at: string;
  order_items: OrderItemRow[];
};

function startOfRange(rangeDays: AnalyticsRange): Date {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (rangeDays - 1));
  return since;
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export async function getAnalyticsOverview(
  rangeDays: AnalyticsRange = 30
): Promise<{ data: AnalyticsOverview | null; error: string | null }> {
  const supabase = await createServerClient();
  const since = startOfRange(rangeDays);
  const sinceIso = since.toISOString();

  const [ordersResult, newCustomersResult] = await Promise.all([
    supabase
      .from('orders')
      .select('id, status, payment_status, total, placed_at, order_items ( quantity, unit_price, product_id, name )')
      .gte('placed_at', sinceIso)
      .order('placed_at', { ascending: true }),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'customer')
      .gte('created_at', sinceIso),
  ]);

  if (ordersResult.error) {
    return { data: null, error: ordersResult.error.message };
  }
  if (newCustomersResult.error) {
    return { data: null, error: newCustomersResult.error.message };
  }

  const orders = (ordersResult.data ?? []) as unknown as OrderRow[];
  const paidOrders = orders.filter((o) => o.payment_status === 'paid');

  /* ---------- Revenue series (daily buckets, paid orders only) ---------- */

  const seriesMap = new Map<string, { revenue: number; orders: number }>();
  for (let i = 0; i < rangeDays; i += 1) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    seriesMap.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
  }
  for (const order of paidOrders) {
    const key = dayKey(order.placed_at);
    const bucket = seriesMap.get(key);
    if (bucket) {
      bucket.revenue += Number(order.total);
      bucket.orders += 1;
    }
  }
  const revenueSeries: RevenuePoint[] = Array.from(seriesMap.entries()).map(([date, v]) => ({
    date,
    revenue: v.revenue,
    orders: v.orders,
  }));

  /* ---------- Order status breakdown (all orders in range) ---------- */

  const statusMap = new Map<OrderStatus, number>();
  for (const order of orders) {
    statusMap.set(order.status, (statusMap.get(order.status) ?? 0) + 1);
  }
  const statusBreakdown: StatusBreakdownPoint[] = Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  /* ---------- Top products (by revenue, paid orders only) ---------- */

  const productMap = new Map<string, TopProductRow>();
  for (const order of paidOrders) {
    for (const item of order.order_items ?? []) {
      const key = item.product_id ?? `unmatched:${item.name}`;
      const existing = productMap.get(key) ?? {
        productId: item.product_id,
        name: item.name,
        unitsSold: 0,
        revenue: 0,
      };
      existing.unitsSold += item.quantity;
      existing.revenue += item.quantity * Number(item.unit_price);
      productMap.set(key, existing);
    }
  }
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  /* ---------- Top categories (by revenue, paid orders only) ---------- */

  const productIds = Array.from(
    new Set(
      Array.from(productMap.values())
        .map((p) => p.productId)
        .filter((id): id is string => Boolean(id))
    )
  );

  const categoryByProduct = new Map<string, { id: string | null; name: string }>();
  if (productIds.length > 0) {
    const { data: productRows, error: productError } = await supabase
      .from('products')
      .select('id, categories ( id, name )')
      .in('id', productIds);

    if (productError) {
      return { data: null, error: productError.message };
    }

    type ProductCategoryRow = { id: string; categories: { id: string; name: string } | null };
    for (const row of (productRows ?? []) as unknown as ProductCategoryRow[]) {
      categoryByProduct.set(row.id, {
        id: row.categories?.id ?? null,
        name: row.categories?.name ?? 'Uncategorized',
      });
    }
  }

  const categoryMap = new Map<string, TopCategoryRow>();
  for (const product of productMap.values()) {
    const category = product.productId ? categoryByProduct.get(product.productId) : undefined;
    const key = category?.id ?? 'uncategorized';
    const existing = categoryMap.get(key) ?? {
      categoryId: category?.id ?? null,
      name: category?.name ?? 'Uncategorized',
      revenue: 0,
      unitsSold: 0,
    };
    existing.revenue += product.revenue;
    existing.unitsSold += product.unitsSold;
    categoryMap.set(key, existing);
  }
  const topCategories = Array.from(categoryMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  /* ---------- Totals ---------- */

  const revenue = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const averageOrderValue = paidOrders.length > 0 ? revenue / paidOrders.length : 0;

  return {
    data: {
      rangeDays,
      totals: {
        revenue,
        orders: orders.length,
        paidOrders: paidOrders.length,
        averageOrderValue,
        newCustomers: newCustomersResult.count ?? 0,
      },
      revenueSeries,
      statusBreakdown,
      topProducts,
      topCategories,
    },
    error: null,
  };
}
