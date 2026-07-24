-- 0014_fix_create_order_locking.sql
--
-- Fixes: "FOR UPDATE cannot be applied to the nullable side of an outer join"
--
-- Root cause: the original create_order() (0006_create_order_rpc.sql) locked
-- the `inventory` row while it was on the nullable side of a LEFT JOIN
-- (`left join inventory inv on inv.variant_id = pv.id ... for update of inv`).
-- Postgres cannot take a row lock on something that may not exist as a
-- consequence of an outer join, so it rejects the query plan.
--
-- Fix: lock `inventory` alone via a plain single-table SELECT ... FOR UPDATE
-- (no join at all -> always legal), then read variant/product data in a
-- separate, unlocked query. Locking semantics, error codes, and the returned
-- jsonb shape are unchanged, so no application code needs to change.

create or replace function public.create_order(
  p_shipping_address jsonb,
  p_shipping_address_id uuid,
  p_shipping_fee numeric,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
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

  v_shipping_fee := greatest(v_shipping_fee, 0);

  v_order_number := 'EC-' || to_char(now(), 'YYYY') || '-' ||
    lpad(nextval('order_number_seq')::text, 6, '0');

  -- Pass 1: validate + lock inventory rows.
  -- Iterate in a deterministic order (sorted by variant_id) so two
  -- concurrent orders sharing variants always acquire locks in the same
  -- order, which prevents deadlocks between them.
  for v_item in
    select value from jsonb_array_elements(p_items) as value
    order by (value->>'variant_id')
  loop
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;

    if v_variant_id is null or v_quantity is null or v_quantity <= 0 then
      raise exception 'invalid_item' using errcode = '22023';
    end if;

    -- Step 1: lock ONLY the inventory row. Single table, no join,
    -- so FOR UPDATE is always legal here regardless of whether a
    -- matching row exists.
    select quantity, reserved
    into v_inv
    from inventory
    where variant_id = v_variant_id
    for update;

    -- Step 2: read variant/product data separately. No lock needed
    -- for this data, so outer joins (e.g. optional product image)
    -- are completely fine here.
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
    v_order_number, v_user_id, 'pending', 'pending', 'cod',
    0, 0, v_shipping_fee, v_shipping_fee,
    p_shipping_address_id, p_shipping_address
  )
  returning id into v_order_id;

  -- Pass 2: create order_items and deduct stock. Inventory rows for
  -- these variants are still locked from Pass 1 within this same
  -- transaction, so this deduction is race-free.
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
$function$;
