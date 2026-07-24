-- ============================================================
-- EIFA COUTURE — Migration 0013
-- Phase 3: Simple Product Inventory & SKU Architecture
-- ============================================================
-- Adds a `product_type` split ('simple' | 'variant') so a product with
-- no size/color options can own its own SKU + stock directly, while
-- variant products keep managing inventory exclusively through
-- `product_variants` + `inventory` (Phase 1/2, untouched).
--
-- Design: rather than teaching every consumer (cart, wishlist, orders,
-- create_order RPC, storefront PDP) a second "no variant_id" code
-- path, a simple product is backed by one hidden, auto-managed
-- "default variant" (size = 'One Size', color_name = 'Default',
-- is_default_variant = true) whose SKU/stock always mirrors the
-- product-level fields via trigger. Every existing table/RPC that
-- already keys off `variant_id` keeps working unchanged.
-- ============================================================

create type product_type as enum ('simple', 'variant');

alter table products
  add column if not exists product_type      product_type not null default 'simple',
  add column if not exists sku               text,
  add column if not exists stock_quantity    int not null default 0 check (stock_quantity >= 0),
  add column if not exists track_inventory   boolean not null default true,
  add column if not exists allow_backorders  boolean not null default false;

create unique index if not exists uq_products_sku on products(sku) where sku is not null;

-- Marks the single auto-managed variant that backs a 'simple' product's
-- inventory. Never created/edited directly from the admin variant UI.
alter table product_variants
  add column if not exists is_default_variant boolean not null default false;

create unique index if not exists uq_variants_one_default_per_product
  on product_variants(product_id) where is_default_variant;

-- ------------------------------------------------------------
-- Backfill: any product that already has real (non-default) variants
-- is a 'variant' product; everything else stays 'simple' and gets a
-- starter SKU derived from its slug so the unique index above holds.
-- ------------------------------------------------------------
update products p
set product_type = 'variant'
where exists (
  select 1 from product_variants v where v.product_id = p.id
);

update products
set sku = upper(left(regexp_replace(slug, '[^a-z0-9]+', '-', 'g'), 40)) || '-' || left(id::text, 8)
where product_type = 'simple' and sku is null;

-- ------------------------------------------------------------
-- Keep each 'simple' product's hidden default variant + inventory row
-- in sync with products.sku / stock_quantity / is_active. Switching a
-- product to 'variant' removes the default variant (and its inventory
-- row, via cascade) so the real variants immediately take over; a
-- product with real variants can never be switched to 'simple' (see
-- guard below) so the two inventory sources never overlap.
-- ------------------------------------------------------------
create or replace function sync_simple_product_variant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_variant_id uuid;
  v_real_variant_count int;
begin
  if new.product_type = 'variant' then
    delete from product_variants
      where product_id = new.id and is_default_variant;
    return new;
  end if;

  -- new.product_type = 'simple'
  select count(*) into v_real_variant_count
    from product_variants
    where product_id = new.id and not is_default_variant;

  if v_real_variant_count > 0 then
    raise exception 'cannot_set_simple_with_existing_variants'
      using errcode = '22023';
  end if;

  select id into v_variant_id
    from product_variants
    where product_id = new.id and is_default_variant;

  if v_variant_id is null then
    insert into product_variants (
      product_id, sku, size, color_name, color_hex,
      price_override, is_active, is_default_variant
    ) values (
      new.id, coalesce(new.sku, new.id::text), 'One Size', 'Default', null,
      null, new.is_active, true
    )
    returning id into v_variant_id;

    insert into inventory (variant_id, quantity, reserved, low_stock_at)
    values (v_variant_id, new.stock_quantity, 0, 3);
  else
    update product_variants
      set sku = coalesce(new.sku, sku),
          is_active = new.is_active
      where id = v_variant_id;

    update inventory
      set quantity = new.stock_quantity
      where variant_id = v_variant_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_simple_product_variant on products;
create trigger trg_sync_simple_product_variant
  after insert or update of product_type, sku, stock_quantity, is_active on products
  for each row execute function sync_simple_product_variant();

-- Run once so already-'simple' products (backfilled above) get their
-- default variant + inventory row immediately, without waiting for
-- the next unrelated update.
update products set updated_at = updated_at where product_type = 'simple';

-- ------------------------------------------------------------
-- Backorders: create_order's stock check (migration 0006) rejects any
-- item where available < quantity. allow_backorders lets a product
-- skip that check entirely — enforced here, at the inventory layer,
-- rather than duplicating the rule in every RPC caller.
-- ------------------------------------------------------------
create or replace function variant_allows_backorder(p_variant_id uuid)
returns boolean
language sql
stable
as $$
  select coalesce(p.allow_backorders, false)
  from product_variants v
  join products p on p.id = v.product_id
  where v.id = p_variant_id;
$$;

-- ------------------------------------------------------------
-- Re-point create_order's Pass 1 stock check through
-- variant_allows_backorder — only the guard clause changes, the rest
-- of the function body (0006) is unchanged.
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
      p.allow_backorders as allow_backorders,
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
$$;

grant execute on function create_order(jsonb, uuid, numeric, jsonb) to authenticated;
