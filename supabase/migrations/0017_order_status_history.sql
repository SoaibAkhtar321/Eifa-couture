-- ============================================================
-- EIFA COUTURE — Migration 0016
-- Order Status History & Audit Trail
-- ============================================================
-- Replaces the synthesized (timestamp-derived) admin order timeline
-- with a real, append-only event log. Same spirit as `audit_logs`
-- (0010): insert-only, no update/delete policy, so a history row can
-- never be edited or removed once written — including by admins.
--
-- Rows are written from two trust boundaries:
--   1. SECURITY DEFINER RPCs (create_order, mark_order_paid,
--      release_order_reservation, release_stale_reservations) insert
--      directly as part of the same transaction as the state change
--      they're recording — no separate round trip, no risk of the
--      state changing without a matching history row.
--   2. The admin panel's client-side status update
--      (lib/admin/orders-actions.ts) inserts via the browser client,
--      gated by `order_status_history_admin_insert` below.
--
-- Customers never get an insert policy — every event of theirs is
-- recorded by RPC/service-role code on their behalf (order placed,
-- payment result), so nothing they do client-side can forge a row.
-- ============================================================

create table if not exists order_status_history (
  id             uuid primary key default gen_random_uuid(),

  order_id       uuid not null references orders(id) on delete cascade,

  event_type     text not null,        -- e.g. 'order_created', 'razorpay_order_created',
                                        -- 'payment_successful', 'payment_failed',
                                        -- 'payment_refunded', 'status_change'
  previous_status text,                -- order status before this event (nullable — pure
                                        -- payment events like 'razorpay_order_created' don't
                                        -- carry a status transition)
  new_status      text,                -- order status after this event (nullable, same reason)

  actor_type     text not null check (actor_type in ('customer', 'admin', 'system', 'webhook')),
  actor_id       uuid references profiles(id) on delete set null,

  notes          text,                 -- optional admin note (e.g. "Package handed to courier")

  created_at     timestamptz not null default now()
);

-- Timeline loading is "all events for one order, oldest first" — this
-- index serves that directly without a separate sort step.
create index if not exists idx_order_status_history_order_id
  on order_status_history (order_id, created_at);

alter table order_status_history enable row level security;

-- Same read rule as `orders` itself: the owning customer or an admin.
create policy "order_status_history_select_own_or_admin"
  on order_status_history for select
  using (
    is_admin() or exists (
      select 1 from orders o where o.id = order_status_history.order_id and o.user_id = auth.uid()
    )
  );

-- Only admins may insert directly (the admin-panel status update).
-- Every other write path (order placement, payment settlement) goes
-- through a SECURITY DEFINER RPC or the service-role client, both of
-- which bypass RLS entirely, so they don't need — or get — a policy
-- here. No update/delete policy is intentionally omitted, same as
-- `audit_logs`: once written, a history row is immutable.
create policy "order_status_history_admin_insert"
  on order_status_history for insert
  with check (is_admin());

-- ------------------------------------------------------------
-- create_order() — unchanged logic, adds one history row recording
-- the order's birth. Actor is the customer placing it.
-- ------------------------------------------------------------
create or replace function create_order(
  p_shipping_address jsonb,
  p_shipping_address_id uuid,
  p_shipping_fee numeric,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(10,2) := 0;
  v_shipping_fee numeric(10,2) := coalesce(p_shipping_fee, 0);
  v_total numeric(10,2);
  v_item jsonb;
  v_variant_id uuid;
  v_quantity int;
  v_variant record;
  v_inv record;
  v_available int;
  v_unit_price numeric(10,2);
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if p_shipping_address is null then
    raise exception 'missing_shipping_address' using errcode = '22023';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_cart' using errcode = '22023';
  end if;

  perform release_stale_reservations();

  v_shipping_fee := greatest(v_shipping_fee, 0);

  v_order_number := 'EC-' || to_char(now(), 'YYYY') || '-' ||
    lpad(nextval('order_number_seq')::text, 6, '0');

  for v_item in
    select value from jsonb_array_elements(p_items) as value
    order by (value->>'variant_id')
  loop
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;

    if v_variant_id is null or v_quantity is null or v_quantity <= 0 then
      raise exception 'invalid_item' using errcode = '22023';
    end if;

    select quantity, reserved
    into v_inv
    from inventory
    where variant_id = v_variant_id
    for update;

    select
      pv.id, pv.product_id, pv.size, pv.color_name, pv.is_active,
      coalesce(pv.price_override, p.price) as unit_price,
      p.name as product_name, p.is_active as product_is_active,
      p.allow_backorders as allow_backorders,
      pi.url as image_url
    into v_variant
    from product_variants pv
    join products p on p.id = pv.product_id
    left join lateral (
      select url from product_images
      where product_id = pv.product_id
      order by is_primary desc, sort_order asc
      limit 1
    ) pi on true
    where pv.id = v_variant_id;

    if v_variant.id is null then
      raise exception 'variant_not_found' using errcode = 'P0002';
    end if;

    if not v_variant.is_active or not v_variant.product_is_active then
      raise exception 'variant_inactive: %', v_variant.product_name using errcode = '22023';
    end if;

    v_available := coalesce(v_inv.quantity, 0) - coalesce(v_inv.reserved, 0);

    if v_available < v_quantity and not coalesce(v_variant.allow_backorders, false) then
      raise exception 'insufficient_stock: %', v_variant.product_name using errcode = '22023';
    end if;
  end loop;

  insert into orders (
    order_number, user_id, status, payment_status, payment_provider,
    subtotal, discount, shipping_fee, total,
    shipping_address_id, shipping_address
  ) values (
    v_order_number, v_user_id, 'pending', 'pending', 'razorpay',
    0, 0, v_shipping_fee, v_shipping_fee,
    p_shipping_address_id, p_shipping_address
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;

    select
      pv.id, pv.product_id, pv.size, pv.color_name,
      coalesce(pv.price_override, p.price) as unit_price,
      p.name as product_name,
      pi.url as image_url
    into v_variant
    from product_variants pv
    join products p on p.id = pv.product_id
    left join lateral (
      select url from product_images
      where product_id = pv.product_id
      order by is_primary desc, sort_order asc
      limit 1
    ) pi on true
    where pv.id = v_variant_id;

    v_unit_price := v_variant.unit_price;
    v_subtotal := v_subtotal + (v_unit_price * v_quantity);

    insert into order_items (
      order_id, product_id, variant_id, name, image_url,
      size, color_name, quantity, unit_price
    ) values (
      v_order_id, v_variant.product_id, v_variant_id, v_variant.product_name, v_variant.image_url,
      v_variant.size, v_variant.color_name, v_quantity, v_unit_price
    );

    update inventory
      set reserved = reserved + v_quantity
      where variant_id = v_variant_id;
  end loop;

  v_total := v_subtotal + v_shipping_fee;

  update orders
    set subtotal = v_subtotal, total = v_total
    where id = v_order_id;

  insert into order_status_history (
    order_id, event_type, previous_status, new_status, actor_type, actor_id
  ) values (
    v_order_id, 'order_created', null, 'pending', 'customer', v_user_id
  );

  begin
    delete from cart_items where user_id = v_user_id;
  exception when others then
    null;
  end;

  return jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'shipping_fee', v_shipping_fee,
    'total', v_total
  );
end;
$$;

grant execute on function create_order(jsonb, uuid, numeric, jsonb) to authenticated;

-- ------------------------------------------------------------
-- release_stale_reservations() — unchanged logic, adds one history
-- row per order it auto-cancels. Actor is 'system' since nobody
-- triggered this directly; it runs lazily inside create_order().
-- ------------------------------------------------------------
create or replace function release_stale_reservations()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_item record;
begin
  for v_order in
    select id, status
    from orders
    where payment_status = 'pending'
      and payment_provider = 'razorpay'
      and stock_settled_at is null
      and placed_at < now() - interval '30 minutes'
    for update skip locked
  loop
    for v_item in
      select variant_id, quantity
      from order_items
      where order_id = v_order.id and variant_id is not null
    loop
      update inventory
        set reserved = greatest(reserved - v_item.quantity, 0)
        where variant_id = v_item.variant_id;
    end loop;

    update orders
      set status = 'cancelled',
          payment_status = 'failed',
          stock_settled_at = now()
      where id = v_order.id;

    insert into order_status_history (
      order_id, event_type, previous_status, new_status, actor_type, notes
    ) values (
      v_order.id, 'status_change', v_order.status, 'cancelled', 'system',
      'Payment reservation expired after 30 minutes without settlement.'
    );
  end loop;
end;
$$;

revoke all on function release_stale_reservations() from public;

-- Old 3-arg/2-arg signatures are being replaced by versions with an
-- added `p_actor_type` parameter below. `create or replace` can't
-- change a function's parameter list, so the old signatures are
-- dropped explicitly rather than left behind as orphaned overloads.
drop function if exists mark_order_paid(uuid, text, text);
drop function if exists release_order_reservation(uuid, text);

-- ------------------------------------------------------------
-- mark_order_paid() — unchanged settlement logic, adds a
-- 'payment_successful' event plus a 'status_change' event (previous
-- status -> 'confirmed'). p_actor_type distinguishes the customer's
-- browser calling this right after checkout from Razorpay's webhook
-- calling it independently; both are legitimate, non-forgeable actors
-- since this RPC is only ever invoked with the service-role key.
-- Idempotent replays (already_processed) intentionally write nothing
-- further, so a redelivered webhook never double-logs.
-- ------------------------------------------------------------
create or replace function mark_order_paid(
  p_order_id uuid,
  p_razorpay_payment_id text,
  p_razorpay_signature text,
  p_actor_type text default 'system'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_item record;
begin
  select id, order_number, payment_status, status
  into v_order
  from orders
  where id = p_order_id
  for update;

  if v_order.id is null then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;

  if v_order.payment_status = 'paid' then
    return jsonb_build_object(
      'id', v_order.id, 'order_number', v_order.order_number,
      'status', 'confirmed', 'payment_status', 'paid', 'already_processed', true
    );
  end if;

  if v_order.payment_status = 'refunded' then
    raise exception 'order_already_refunded' using errcode = '22023';
  end if;

  if p_razorpay_payment_id is null or length(trim(p_razorpay_payment_id)) = 0 then
    raise exception 'missing_payment_id' using errcode = '22023';
  end if;

  for v_item in
    select variant_id, quantity
    from order_items
    where order_id = p_order_id and variant_id is not null
  loop
    update inventory
      set quantity = greatest(quantity - v_item.quantity, 0),
          reserved = greatest(reserved - v_item.quantity, 0)
      where variant_id = v_item.variant_id;
  end loop;

  update orders
    set payment_status = 'paid',
        status = 'confirmed',
        razorpay_payment_id = p_razorpay_payment_id,
        razorpay_signature = p_razorpay_signature,
        payment_verified_at = now(),
        stock_settled_at = now()
    where id = p_order_id;

  insert into order_status_history (
    order_id, event_type, previous_status, new_status, actor_type
  ) values (
    p_order_id, 'payment_successful', null, null,
    case when p_actor_type in ('customer', 'admin', 'system', 'webhook') then p_actor_type else 'system' end
  );

  insert into order_status_history (
    order_id, event_type, previous_status, new_status, actor_type
  ) values (
    p_order_id, 'status_change', v_order.status, 'confirmed',
    case when p_actor_type in ('customer', 'admin', 'system', 'webhook') then p_actor_type else 'system' end
  );

  return jsonb_build_object(
    'id', v_order.id, 'order_number', v_order.order_number,
    'status', 'confirmed', 'payment_status', 'paid', 'already_processed', false
  );
end;
$$;

revoke all on function mark_order_paid(uuid, text, text, text) from public;
grant execute on function mark_order_paid(uuid, text, text, text) to service_role;

-- ------------------------------------------------------------
-- release_order_reservation() — unchanged settlement logic, adds a
-- 'payment_failed' event, plus a 'status_change' event when the
-- reason is 'cancelled' (the only path that actually flips order
-- status here). Same idempotency guard as mark_order_paid: an
-- already-settled order writes no further history.
-- ------------------------------------------------------------
create or replace function release_order_reservation(
  p_order_id uuid,
  p_reason text default 'payment_failed',
  p_actor_type text default 'system'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_item record;
  v_actor_type text := case when p_actor_type in ('customer', 'admin', 'system', 'webhook') then p_actor_type else 'system' end;
begin
  select id, order_number, payment_status, status, stock_settled_at
  into v_order
  from orders
  where id = p_order_id
  for update;

  if v_order.id is null then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;

  if v_order.payment_status = 'paid' then
    raise exception 'cannot_release_paid_order' using errcode = '22023';
  end if;

  if v_order.stock_settled_at is not null then
    return jsonb_build_object(
      'id', v_order.id, 'order_number', v_order.order_number,
      'payment_status', 'failed', 'already_processed', true
    );
  end if;

  for v_item in
    select variant_id, quantity
    from order_items
    where order_id = p_order_id and variant_id is not null
  loop
    update inventory
      set reserved = greatest(reserved - v_item.quantity, 0)
      where variant_id = v_item.variant_id;
  end loop;

  update orders
    set payment_status = 'failed',
        status = case when p_reason = 'cancelled' then 'cancelled' else status end,
        stock_settled_at = now()
    where id = p_order_id;

  insert into order_status_history (
    order_id, event_type, previous_status, new_status, actor_type, notes
  ) values (
    p_order_id, 'payment_failed', null, null, v_actor_type,
    case when p_reason is not null and p_reason <> 'payment_failed' then p_reason else null end
  );

  if p_reason = 'cancelled' then
    insert into order_status_history (
      order_id, event_type, previous_status, new_status, actor_type
    ) values (
      p_order_id, 'status_change', v_order.status, 'cancelled', v_actor_type
    );
  end if;

  return jsonb_build_object(
    'id', v_order.id, 'order_number', v_order.order_number,
    'payment_status', 'failed', 'already_processed', false
  );
end;
$$;

revoke all on function release_order_reservation(uuid, text, text) from public;
grant execute on function release_order_reservation(uuid, text, text) to service_role;
