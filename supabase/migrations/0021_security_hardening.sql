-- 0021_security_hardening.sql
--
-- 1. create_order(): shipping fee is computed server-side from
--    store_settings instead of trusting the client value.
-- 2. orders: drop the direct customer INSERT policy. Orders are only
--    created through the SECURITY DEFINER create_order() RPC; the
--    policy let a signed-in user insert an order row with any totals.
-- 3. profiles: only a superadmin may change anyone's role (an admin
--    could previously promote themselves or others to superadmin).
-- 4. reviews: customers can no longer flip is_published / is_verified
--    on their own review.

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
  v_settings record;
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

  -- Shipping is computed here from admin Store Settings; the
  -- client-supplied p_shipping_fee is only used if no settings row
  -- exists, so a tampered request can no longer zero out shipping.
  select shipping_flat_rate, shipping_free_threshold
    into v_settings
    from store_settings
    where singleton
    limit 1;

  if found then
    v_shipping_fee := case
      when v_settings.shipping_free_threshold is not null
        and v_subtotal >= v_settings.shipping_free_threshold then 0
      else v_settings.shipping_flat_rate
    end;
    update orders set shipping_fee = v_shipping_fee where id = v_order_id;
  end if;

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

drop policy if exists "orders_insert_own" on orders;

create or replace function prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and coalesce(auth_role()::text, '') <> 'superadmin' then
    raise exception 'only_superadmin_can_change_roles' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_role_guard on profiles;
create trigger trg_profiles_role_guard
  before update on profiles
  for each row execute function prevent_role_escalation();

create or replace function guard_review_moderation()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is not null and not is_admin() then
    if tg_op = 'INSERT' then
      new.is_verified := false;
      new.is_published := true;
    else
      new.is_verified := old.is_verified;
      new.is_published := old.is_published;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reviews_moderation_guard on reviews;
create trigger trg_reviews_moderation_guard
  before insert or update on reviews
  for each row execute function guard_review_moderation();
