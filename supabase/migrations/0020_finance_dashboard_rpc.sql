-- ============================================================
-- EIFA COUTURE — Migration 0020
-- Phase 10: Financial Dashboard aggregation RPC
-- ============================================================
-- Additive only. Introduces a single read-only RPC,
-- `get_finance_overview(p_start, p_end)`, that computes every figure
-- the /admin/finance dashboard needs — totals, payment-method
-- breakdown, refund analytics, and daily/weekly/monthly series — as
-- SQL aggregation in one round trip, rather than fetching raw order
-- rows to the app server and reducing them in JS (the pattern used
-- by the existing /admin/analytics page). This keeps the dashboard
-- query cost roughly constant regardless of how many orders are in
-- range.
--
-- SECURITY INVOKER (the default — deliberately NOT SECURITY DEFINER):
-- this function must run with the CALLING user's privileges so the
-- existing RLS policies on `orders` and `refunds`
-- (`orders_select_own_or_admin`, `refunds_select_own_or_admin`, both
-- from 0005/0018) keep applying exactly as they do for any other
-- query. A non-admin caller gets aggregates over only their own
-- orders/refunds — never another customer's — and the `/admin/finance`
-- page itself is additionally gated by requireAdmin() in
-- src/app/admin/layout.tsx before this RPC is ever called. No
-- service-role key is needed or used for this read path.
-- ============================================================

create or replace function get_finance_overview(
  p_start timestamptz,
  p_end timestamptz
)
returns jsonb
language sql
stable
set search_path = public
as $$
with
  orders_in_range as (
    select id, status, payment_status, payment_method, total, placed_at
    from orders
    where placed_at >= p_start and placed_at < p_end
  ),
  refunds_in_range as (
    select id, order_id, amount, status, created_at
    from refunds
    where created_at >= p_start and created_at < p_end
  ),
  captured_orders as (
    select * from orders_in_range
    where payment_status in ('paid', 'partially_refunded', 'refunded')
  ),
  totals as (
    select
      count(*) as total_orders,
      count(*) filter (where payment_status in ('paid', 'partially_refunded', 'refunded')) as successful_payments,
      count(*) filter (where payment_status = 'failed') as failed_payments,
      count(*) filter (where payment_status = 'pending') as pending_payments,
      coalesce(sum(total) filter (where payment_status in ('paid', 'partially_refunded', 'refunded')), 0) as gross_revenue
    from orders_in_range
  ),
  refund_totals as (
    select
      count(*) as total_refund_requests,
      count(*) filter (where status = 'processed') as successful_refunds,
      count(*) filter (where status = 'processing') as pending_refunds,
      count(*) filter (where status = 'failed') as failed_refunds,
      coalesce(sum(amount) filter (where status = 'processed'), 0) as refunded_amount,
      coalesce(sum(amount) filter (where status = 'processing'), 0) as pending_refund_amount
    from refunds_in_range
  ),
  -- Bucket into the fixed category set the Payment Analytics UI
  -- expects. `payment_method` is only ever set on settled orders
  -- (migration 0019); anything unrecognized/legacy-null within the
  -- captured set folds into 'other' rather than being dropped, so
  -- percentages here always sum to 100% of captured_orders.
  payment_method_buckets as (
    select
      case
        when payment_method = 'upi' then 'upi'
        when payment_method = 'credit_card' then 'credit_card'
        when payment_method = 'debit_card' then 'debit_card'
        when payment_method = 'netbanking' then 'netbanking'
        when payment_method = 'wallet' then 'wallet'
        when payment_method = 'emi' then 'emi'
        else 'other'
      end as method,
      total
    from captured_orders
  ),
  payment_methods as (
    select
      method,
      count(*) as cnt,
      coalesce(sum(total), 0) as revenue
    from payment_method_buckets
    group by method
  ),
  -- Zero-filled daily buckets across the whole range so charts never
  -- show gaps for days with no orders.
  day_scaffold as (
    select generate_series(date_trunc('day', p_start), date_trunc('day', p_end - interval '1 microsecond'), interval '1 day')::date as day
  ),
  daily as (
    select
      s.day,
      coalesce(sum(o.total) filter (where o.id is not null and o.payment_status in ('paid', 'partially_refunded', 'refunded')), 0) as revenue,
      count(o.id) as orders
    from day_scaffold s
    left join orders_in_range o on date_trunc('day', o.placed_at)::date = s.day
    group by s.day
    order by s.day
  ),
  daily_refunds as (
    select
      s.day,
      coalesce(sum(r.amount) filter (where r.status = 'processed'), 0) as refunded_amount
    from day_scaffold s
    left join refunds_in_range r on date_trunc('day', r.created_at)::date = s.day
    group by s.day
    order by s.day
  ),
  daily_with_cumulative as (
    select
      day, revenue, orders,
      sum(revenue) over (order by day) as cumulative_revenue
    from daily
  ),
  week_scaffold as (
    select generate_series(date_trunc('week', p_start), date_trunc('week', p_end - interval '1 microsecond'), interval '1 week')::date as week_start
  ),
  weekly as (
    select
      s.week_start,
      coalesce(sum(o.total) filter (where o.id is not null and o.payment_status in ('paid', 'partially_refunded', 'refunded')), 0) as revenue,
      count(o.id) as orders
    from week_scaffold s
    left join orders_in_range o on date_trunc('week', o.placed_at)::date = s.week_start
    group by s.week_start
    order by s.week_start
  ),
  month_scaffold as (
    select generate_series(date_trunc('month', p_start), date_trunc('month', p_end - interval '1 microsecond'), interval '1 month')::date as month_start
  ),
  monthly as (
    select
      s.month_start,
      coalesce(sum(o.total) filter (where o.id is not null and o.payment_status in ('paid', 'partially_refunded', 'refunded')), 0) as revenue,
      count(o.id) as orders
    from month_scaffold s
    left join orders_in_range o on date_trunc('month', o.placed_at)::date = s.month_start
    group by s.month_start
    order by s.month_start
  )
select jsonb_build_object(
  'range', jsonb_build_object('start', p_start, 'end', p_end),
  'totals', jsonb_build_object(
    'grossRevenue', t.gross_revenue,
    -- netRevenue / totalRevenue: money actually kept after processed
    -- refunds in range. See migration comment / dashboard code for
    -- why these two labels intentionally share one figure.
    'netRevenue', t.gross_revenue - rt.refunded_amount,
    'totalRevenue', t.gross_revenue - rt.refunded_amount,
    'totalOrders', t.total_orders,
    'successfulPayments', t.successful_payments,
    'failedPayments', t.failed_payments,
    'pendingPayments', t.pending_payments,
    'totalRefunds', rt.total_refund_requests,
    'refundedAmount', rt.refunded_amount,
    'pendingRefundAmount', rt.pending_refund_amount,
    'averageOrderValue', case when t.successful_payments > 0 then round(t.gross_revenue / t.successful_payments, 2) else 0 end,
    'paymentSuccessRate', case when t.total_orders > 0 then round((t.successful_payments::numeric / t.total_orders) * 100, 2) else 0 end
  ),
  'refundAnalytics', jsonb_build_object(
    'totalRefundRequests', rt.total_refund_requests,
    'successfulRefunds', rt.successful_refunds,
    'pendingRefunds', rt.pending_refunds,
    'failedRefunds', rt.failed_refunds,
    'totalRefundedAmount', rt.refunded_amount,
    'refundPercentage', case when t.gross_revenue > 0 then round((rt.refunded_amount / t.gross_revenue) * 100, 2) else 0 end
  ),
  'paymentMethods', coalesce((
    select jsonb_agg(jsonb_build_object(
      'method', pm.method,
      'count', pm.cnt,
      'percentage', case when t.successful_payments > 0 then round((pm.cnt::numeric / t.successful_payments) * 100, 2) else 0 end,
      'revenue', pm.revenue
    ) order by pm.revenue desc)
    from payment_methods pm
  ), '[]'::jsonb),
  'dailySeries', coalesce((
    select jsonb_agg(jsonb_build_object(
      'date', to_char(d.day, 'YYYY-MM-DD'),
      'revenue', d.revenue,
      'orders', d.orders,
      'refundedAmount', dr.refunded_amount
    ) order by d.day)
    from daily_with_cumulative d
    join daily_refunds dr on dr.day = d.day
  ), '[]'::jsonb),
  'weeklySeries', coalesce((
    select jsonb_agg(jsonb_build_object(
      'weekStart', to_char(w.week_start, 'YYYY-MM-DD'),
      'revenue', w.revenue,
      'orders', w.orders
    ) order by w.week_start)
    from weekly w
  ), '[]'::jsonb),
  'monthlySeries', coalesce((
    select jsonb_agg(jsonb_build_object(
      'monthStart', to_char(m.month_start, 'YYYY-MM-DD'),
      'revenue', m.revenue,
      'orders', m.orders
    ) order by m.month_start)
    from monthly m
  ), '[]'::jsonb),
  'cumulativeRevenue', coalesce((
    select jsonb_agg(jsonb_build_object(
      'date', to_char(d.day, 'YYYY-MM-DD'),
      'cumulativeRevenue', d.cumulative_revenue
    ) order by d.day)
    from daily_with_cumulative d
  ), '[]'::jsonb)
)
from totals t, refund_totals rt;
$$;

grant execute on function get_finance_overview(timestamptz, timestamptz) to authenticated;
