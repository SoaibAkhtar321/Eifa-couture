-- ============================================================
-- EIFA COUTURE — Migration 0015
-- Razorpay payment support: reserve-then-settle inventory model
-- ============================================================
-- Behavioral change from 0014's create_order(): stock is now
-- RESERVED (inventory.reserved += qty) at order creation instead of
-- being deducted immediately. Two new SECURITY DEFINER RPCs settle
-- that reservation:
--   - mark_order_paid()            -> reserved becomes a real deduction
--   - release_order_reservation()  -> reserved is freed, no deduction
-- Both are idempotent and are granted to `service_role` ONLY — no
-- authenticated/anon/public client can call them directly, since
-- doing so would let a customer mark their own order "paid" without
-- ever paying. All webhook/verification calls to these RPCs happen
-- from server code using the Supabase service-role key.
--
-- A third helper, release_stale_reservations(), frees reservations
-- held by orders that were never paid within 30 minutes. It runs
-- lazily at the start of every create_order() call rather than via a
-- cron job — no extra infra required, and it self-heals as new
-- checkouts come in.
-- ============================================================

-- ------------------------------------------------------------
-- Schema additions
-- ------------------------------------------------------------
alter table orders
  add column if not exists razorpay_payment_id text,
  add column if not exists razorpay_signature  text,
  add column if not exists payment_verified_at timestamptz,
  -- Set once a reservation is resolved either way (paid -> deducted,
  -- or failed/expired/cancelled -> released). NULL means stock is
  -- still held against this order. This is what makes
  -- release_order_reservation() and release_stale_reservations()
  -- idempotent/mutually safe.
  add column if not exists stock_settled_at    timestamptz;

-- payment_provider_ref holds the Razorpay order id (set right after
-- create_order() returns, by the create-order API route, via a plain
-- service-role UPDATE — no RPC needed for that step since the
-- service role bypasses RLS). Unique so two DB orders can never point
-- at the same Razorpay order.
create unique index if not exists uq_orders_payment_provider_ref
  on orders(payment_provider_ref) where payment_provider_ref is not null;

-- Prevents a single Razorpay payment id from ever settling two
-- different orders — the last line of defense against a replayed or
-- duplicated webhook delivery.
create unique index if not exists uq_orders_razorpay_payment_id
  on orders(razorpay_payment_id) where razorpay_payment_id is not null;

-- Used by both release_stale_reservations()'s scan and general
-- "orders awaiting payment" admin/ops queries.
create index if not exists idx_orders_pending_razorpay
  on orders(placed_at)
  where payment_status = 'pending' and payment_provider = 'razorpay' and stock_settled_at is null;

-- ------------------------------------------------------------
-- release_stale_reservations()
-- Frees reserved stock for Razorpay orders that have sat unpaid past
-- the timeout. Called internally by create_order() before it checks
-- availability, so a customer's checkout is never blocked by stock
-- someone else abandoned. Not granted to authenticated/anon — only
-- callable by other SECURITY DEFINER functions owned by the same
-- role (Postgres checks privileges against the definer while a
-- SECURITY DEFINER function is executing).
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
    select id
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
  end loop;
end;
$$;

revoke all on function release_stale_reservations() from public;

-- ------------------------------------------------------------
-- create_order() — rewritten Pass 1/2 semantics from 0014:
--   - sweeps stale reservations first
--   - order is created with payment_provider = 'razorpay' (was 'cod')
--   - Pass 2 now increments inventory.reserved instead of
--     decrementing inventory.quantity
-- Stock validation (Pass 1: available = quantity - reserved, locking,
-- backorder check, deterministic lock ordering to avoid deadlocks)
-- is otherwise unchanged from 0014.
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

  -- Free up any stock held by abandoned Razorpay checkouts before we
  -- check availability for THIS order.
  perform release_stale_reservations();

  v_shipping_fee := greatest(v_shipping_fee, 0);

  v_order_number := 'EC-' || to_char(now(), 'YYYY') || '-' ||
    lpad(nextval('order_number_seq')::text, 6, '0');

  -- Pass 1: validate + lock inventory rows. Deterministic order
  -- (sorted by variant_id) prevents deadlocks between concurrent
  -- orders sharing variants.
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

  -- Pass 2: create order_items and RESERVE stock (not deduct).
  -- Inventory rows for these variants are still locked from Pass 1
  -- within this same transaction, so this is race-free.
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
-- mark_order_paid()
-- Converts a reservation into a real deduction and marks the order
-- paid + confirmed. Called ONLY from server code holding the
-- service-role key (verify endpoint + webhook handler) — never from
-- the browser. Idempotent: replays of the same payment event (e.g.
-- Razorpay redelivering a webhook) are safe no-ops.
-- ------------------------------------------------------------
create or replace function mark_order_paid(
  p_order_id uuid,
  p_razorpay_payment_id text,
  p_razorpay_signature text
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
    -- Already processed by an earlier call (client verify + webhook
    -- racing each other, or a redelivered webhook). No-op.
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

  return jsonb_build_object(
    'id', v_order.id, 'order_number', v_order.order_number,
    'status', 'confirmed', 'payment_status', 'paid', 'already_processed', false
  );
end;
$$;

revoke all on function mark_order_paid(uuid, text, text) from public;
grant execute on function mark_order_paid(uuid, text, text) to service_role;

-- ------------------------------------------------------------
-- release_order_reservation()
-- Frees reserved stock without deducting it, for a failed/cancelled/
-- expired payment. Same trust boundary as mark_order_paid(): server
-- code with the service-role key only. p_reason = 'cancelled' also
-- flips order status to 'cancelled'; any other reason (e.g.
-- 'payment_failed') leaves status alone so the order stays visible
-- as retryable.
-- ------------------------------------------------------------
create or replace function release_order_reservation(
  p_order_id uuid,
  p_reason text default 'payment_failed'
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
    -- Already released (e.g. release_stale_reservations() beat us to
    -- it). Idempotent no-op.
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

  return jsonb_build_object(
    'id', v_order.id, 'order_number', v_order.order_number,
    'payment_status', 'failed', 'already_processed', false
  );
end;
$$;

revoke all on function release_order_reservation(uuid, text) from public;
grant execute on function release_order_reservation(uuid, text) to service_role;