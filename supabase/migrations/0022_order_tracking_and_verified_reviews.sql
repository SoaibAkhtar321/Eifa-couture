-- 0022_order_tracking_and_verified_reviews.sql
--
-- 1. Order tracking: courier link + shipped/delivered timestamps on
--    orders (tracking_number / shipping_provider already exist). The
--    timestamps are stamped automatically when the admin moves the
--    order to shipped / delivered.
-- 2. Reviews: a customer may only review a product they bought in an
--    order that has been delivered. Such reviews are marked verified.

alter table orders add column if not exists tracking_url text;
alter table orders add column if not exists shipped_at timestamptz;
alter table orders add column if not exists delivered_at timestamptz;

create or replace function stamp_order_fulfilment()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    if new.status in ('shipped', 'out_for_delivery') and new.shipped_at is null then
      new.shipped_at := now();
    end if;
    if new.status = 'delivered' and new.delivered_at is null then
      new.delivered_at := now();
      if new.shipped_at is null then
        new.shipped_at := now();
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_fulfilment_stamp on orders;
create trigger trg_orders_fulfilment_stamp
  before update on orders
  for each row execute function stamp_order_fulfilment();

-- Has the current user received this product in a delivered order?
create or replace function has_received_product(p_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from order_items oi
    join orders o on o.id = oi.order_id
    where o.user_id = auth.uid()
      and o.status = 'delivered'
      and oi.product_id = p_product_id
  );
$$;

grant execute on function has_received_product(uuid) to authenticated;

drop policy if exists "reviews_insert_own" on reviews;
create policy "reviews_insert_own_delivered" on reviews for insert
  with check (auth.uid() = user_id and has_received_product(product_id));

drop policy if exists "reviews_update_own_or_admin" on reviews;
create policy "reviews_update_own_delivered_or_admin" on reviews for update
  using (is_admin() or (auth.uid() = user_id and has_received_product(product_id)));

-- Customer reviews that pass the policy above are, by definition, from
-- a verified purchase. Admin edits keep whatever the admin sets.
create or replace function guard_review_moderation()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is not null and not is_admin() then
    new.is_verified := true;
    if tg_op = 'INSERT' then
      new.is_published := true;
    else
      new.is_published := old.is_published;
    end if;
  end if;
  return new;
end;
$$;
