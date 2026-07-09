-- ============================================================
-- EIFA COUTURE — Migration 0006
-- Atomic order creation RPC
-- ============================================================
-- `order_items` has no "insert own" RLS policy (by design — see 0005:
-- customers can only SELECT their own order_items, all writes are
-- admin/service-role only). Regular checkout therefore cannot insert
-- orders + order_items + decrement inventory as separate client
-- calls. This migration adds a single SECURITY DEFINER function that
-- performs the whole checkout as one atomic operation: Postgres runs
-- a function body as part of the calling statement's transaction, so
-- either every write below lands, or (on any exception) none do —
-- no partial orders, no double-decremented stock.
--
-- Price integrity: unit_price is NEVER taken from client input. It is
-- resolved server-side from product_variants.price_override, falling
-- back to products.price, exactly at the moment of purchase.
-- ============================================================

-- Human-friendly order numbers, e.g. EC-2026-000042.
create sequence if not exists order_number_seq;

create or replace function create_order(
  p_shipping_address jsonb,
  p_shipping_address_id uuid,
  p_shipping_fee numeric,
  p_items jsonb -- [{ "variant_id": "uuid", "quantity": 2 }, ...]
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

  v_shipping_fee := greatest(v_shipping_fee, 0);

  -- Reserve a slot for the order row now so trigger-based updated_at /
  -- FK references are stable; order_number is finalized once we know
  -- the year (kept simple: current year at placement time).
  v_order_number := 'EC-' || to_char(now(), 'YYYY') || '-' ||
    lpad(nextval('order_number_seq')::text, 6, '0');

  -- ---------- Pass 1: validate stock + resolve authoritative prices ----------
  -- Locks each inventory row (FOR UPDATE) so two concurrent checkouts
  -- on the same variant can't both read the same "available" count.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;

    if v_variant_id is null or v_quantity is null or v_quantity <= 0 then
      raise exception 'invalid_item' using errcode = '22023';
    end if;

    select
      pv.id, pv.product_id, pv.size, pv.color_name, pv.is_active,
      coalesce(pv.price_override, p.price) as unit_price,
      p.name as product_name, p.is_active as product_is_active,
      pi.url as image_url,
      inv.quantity as stock_quantity, inv.reserved as stock_reserved
    into v_variant
    from product_variants pv
    join products p on p.id = pv.product_id
    left join inventory inv on inv.variant_id = pv.id
    left join lateral (
      select url from product_images
      where product_id = pv.product_id
      order by is_primary desc, sort_order asc
      limit 1
    ) pi on true
    where pv.id = v_variant_id
    for update of inv;

    if v_variant.id is null then
      raise exception 'variant_not_found' using errcode = 'P0002';
    end if;

    if not v_variant.is_active or not v_variant.product_is_active then
      raise exception 'variant_inactive: %', v_variant.product_name using errcode = '22023';
    end if;

    v_available := coalesce(v_variant.stock_quantity, 0) - coalesce(v_variant.stock_reserved, 0);

    if v_available < v_quantity then
      raise exception 'insufficient_stock: %', v_variant.product_name using errcode = '22023';
    end if;
  end loop;

  -- ---------- Pass 2: create the order shell ----------
  insert into orders (
    order_number, user_id, status, payment_status, payment_provider,
    subtotal, discount, shipping_fee, total,
    shipping_address_id, shipping_address
  ) values (
    v_order_number, v_user_id, 'pending', 'pending', 'cod',
    0, 0, v_shipping_fee, v_shipping_fee,
    p_shipping_address_id, p_shipping_address
  )
  returning id into v_order_id;

  -- ---------- Pass 3: write order_items + decrement inventory ----------
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
      set quantity = quantity - v_quantity
      where variant_id = v_variant_id;
  end loop;

  v_total := v_subtotal + v_shipping_fee;

  update orders
    set subtotal = v_subtotal, total = v_total
    where id = v_order_id;

  -- Best-effort: empty the user's server cart now that it has become
  -- an order. Failure here should never fail the order itself.
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