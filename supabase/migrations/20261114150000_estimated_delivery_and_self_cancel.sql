-- ============================================================
-- EIFA COUTURE — Estimated delivery + customer self-cancel (Phase C)
-- ============================================================
-- Requires 20261114140000_order_lifecycle_foundation.sql.
-- Re-runnable.
--
-- 1. Estimated delivery date is stamped automatically the moment an
--    order becomes paid (trigger, so mark_order_paid() is untouched).
-- 2. Cancellation details are stamped automatically whenever an
--    order's status becomes 'cancelled' (admin, system or customer).
-- 3. cancel_order_by_customer(): atomic customer cancel — checks
--    ownership and eligibility under a row lock, restores stock,
--    records history. Service-role only; refund is initiated by the
--    API route afterwards (Razorpay is an external HTTP call).

-- ------------------------------------------------------------
-- 1. Business-day helper + ETA trigger
-- ------------------------------------------------------------
create or replace function add_business_days(p_start date, p_days int)
returns date
language plpgsql
immutable
as $$
declare
  d date := p_start;
  n int := greatest(coalesce(p_days, 0), 0);
begin
  while n > 0 loop
    d := d + 1;
    if extract(dow from d) <> 0 then   -- skip Sundays
      n := n - 1;
    end if;
  end loop;
  if extract(dow from d) = 0 then
    d := d + 1;
  end if;
  return d;
end;
$$;

create or replace function stamp_order_estimated_delivery()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max int;
begin
  if new.payment_status = 'paid'
     and old.payment_status is distinct from 'paid'
     and new.estimated_delivery_date is null then
    select delivery_days_max into v_max from store_settings limit 1;
    new.estimated_delivery_date :=
      add_business_days((now() at time zone 'Asia/Kolkata')::date, coalesce(v_max, 7));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_estimated_delivery on orders;
create trigger trg_orders_estimated_delivery
  before update on orders
  for each row execute function stamp_order_estimated_delivery();

-- Backfill: live paid orders that have no estimate yet.
update orders o
   set estimated_delivery_date = add_business_days(
         (o.placed_at at time zone 'Asia/Kolkata')::date,
         coalesce((select delivery_days_max from store_settings limit 1), 7)
       )
 where o.payment_status = 'paid'
   and o.status in ('confirmed', 'processing', 'shipped', 'out_for_delivery')
   and o.estimated_delivery_date is null;

-- ------------------------------------------------------------
-- 2. Cancellation stamp
-- ------------------------------------------------------------
create or replace function stamp_order_cancellation()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    new.cancelled_at := coalesce(new.cancelled_at, now());
    -- Browser admin updates carry a session; RPC / cron paths do not.
    new.cancelled_by := coalesce(
      new.cancelled_by,
      case when auth.uid() is null then 'system' else 'admin' end
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_cancellation_stamp on orders;
create trigger trg_orders_cancellation_stamp
  before update on orders
  for each row execute function stamp_order_cancellation();

-- ------------------------------------------------------------
-- 3. cancel_order_by_customer()
-- ------------------------------------------------------------
create or replace function cancel_order_by_customer(
  p_order_id uuid,
  p_user_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_item record;
  v_reason text := nullif(left(trim(coalesce(p_reason, '')), 300), '');
  v_was_paid boolean;
  v_reserved boolean;
  v_restocked boolean := false;
  v_stock_review boolean := false;
begin
  select id, order_number, user_id, status, payment_status, payment_provider,
         stock_settled_at, shipped_at, needs_stock_review, total
  into v_order
  from orders
  where id = p_order_id
  for update;

  -- Same error for "missing" and "someone else's" so ids can't be probed.
  if v_order.id is null or v_order.user_id is distinct from p_user_id then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;

  if v_order.status in ('cancelled', 'refunded', 'returned') then
    raise exception 'order_already_closed' using errcode = '22023';
  end if;

  if v_order.shipped_at is not null
     or v_order.status not in ('pending', 'confirmed', 'processing') then
    raise exception 'order_not_cancellable' using errcode = '22023';
  end if;

  if v_order.payment_status in ('refunded', 'partially_refunded') then
    raise exception 'refund_in_progress' using errcode = '22023';
  end if;

  v_was_paid := v_order.payment_status = 'paid';
  v_reserved := (not v_was_paid) and v_order.stock_settled_at is null;

  if v_was_paid then
    -- Stock was deducted at settlement. Put it back, unless a late
    -- settlement only partly deducted it: then a human must reconcile.
    if coalesce(v_order.needs_stock_review, false) then
      v_stock_review := true;
    else
      for v_item in
        select variant_id, quantity from order_items
        where order_id = p_order_id and variant_id is not null
      loop
        update inventory
           set quantity = quantity + v_item.quantity
         where variant_id = v_item.variant_id;
      end loop;
      v_restocked := true;
    end if;
  elsif v_reserved then
    -- Unpaid: stock is only reserved. Release the reservation.
    for v_item in
      select variant_id, quantity from order_items
      where order_id = p_order_id and variant_id is not null
    loop
      update inventory
         set reserved = greatest(reserved - v_item.quantity, 0)
       where variant_id = v_item.variant_id;
    end loop;
  end if;

  update orders
     set status = 'cancelled',
         cancelled_at = now(),
         cancelled_by = 'customer',
         cancel_reason = v_reason,
         payment_status = case when v_reserved then 'failed'::payment_status else payment_status end,
         stock_settled_at = case when v_reserved then now() else stock_settled_at end
   where id = p_order_id;

  insert into order_status_history (
    order_id, event_type, previous_status, new_status, actor_type, actor_id, notes
  ) values (
    p_order_id, 'status_change', v_order.status, 'cancelled', 'customer', p_user_id,
    'Cancelled by customer' || coalesce(': ' || v_reason, '.')
      || case when v_stock_review then ' Stock needs manual review.' else '' end
  );

  return jsonb_build_object(
    'id', v_order.id,
    'order_number', v_order.order_number,
    'total', v_order.total,
    'needs_refund', v_was_paid,
    'payment_provider', v_order.payment_provider,
    'restocked', v_restocked,
    'needs_stock_review', v_stock_review
  );
end;
$$;

revoke all on function cancel_order_by_customer(uuid, uuid, text) from public;
revoke all on function cancel_order_by_customer(uuid, uuid, text) from anon, authenticated;
grant execute on function cancel_order_by_customer(uuid, uuid, text) to service_role;
