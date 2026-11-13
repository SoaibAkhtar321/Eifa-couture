-- ============================================================
-- Phase 2: explicit audience (women / men / accessories)
-- ------------------------------------------------------------
-- Before this migration "who is it for" was GUESSED from category
-- names (regex on "women", "men" ...). Now it is real data:
--   categories.audience  -> which storefront section a category lives in
--   products.audience    -> exactly one audience per product
-- Idempotent: safe to run more than once. Never overwrites an
-- audience that has already been set (e.g. by the admin).
-- ============================================================

alter table categories add column if not exists audience text;
alter table products   add column if not exists audience text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'categories_audience_check') then
    alter table categories
      add constraint categories_audience_check
      check (audience is null or audience in ('women', 'men', 'accessories'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'products_audience_check') then
    alter table products
      add constraint products_audience_check
      check (audience is null or audience in ('women', 'men', 'accessories'));
  end if;
end $$;

create index if not exists idx_categories_audience on categories(audience);
create index if not exists idx_products_audience
  on products(audience) where is_active and deleted_at is null;

-- ------------------------------------------------------------
-- Backfill categories (only rows still NULL).
-- Top-level categories are classified from their name/slug using the
-- same words the old storefront regex used. "women" is tested before
-- "men" because "women" contains "men".
-- ------------------------------------------------------------
update categories c
set audience = case
  when (c.slug || ' ' || c.name) ~* '\y(women|womens|woman|ladies|lady|her|female|girls?)\y' then 'women'
  when (c.slug || ' ' || c.name) ~* '\y(men|mens|man|gents|him|male|boys?)\y'               then 'men'
  when (c.slug || ' ' || c.name) ~* '\y(accessor(y|ies)|bags?|potlis?|clutch(es)?|dupattas?|stoles?|scarf|scarves|jewel(l)?ery|belts?)\y' then 'accessories'
  else null
end
where c.audience is null
  and c.parent_id is null;

-- Sub-categories inherit their parent's audience (repeat for depth).
do $$
declare i int;
begin
  for i in 1..5 loop
    update categories child
    set audience = parent.audience
    from categories parent
    where child.parent_id = parent.id
      and child.audience is null
      and parent.audience is not null;
  end loop;
end $$;

-- ------------------------------------------------------------
-- Backfill products from their category (only rows still NULL).
-- Products whose category has no audience stay NULL on purpose:
-- run supabase/scripts/phase2_audit_audience.sql to review them.
-- ------------------------------------------------------------
update products p
set audience = c.audience
from categories c
where p.category_id = c.id
  and p.audience is null
  and c.audience is not null;

-- ------------------------------------------------------------
-- Guard: a product's category must belong to the product's audience.
-- Checked only when audience or category CHANGES, so editing price,
-- stock, flags etc. on legacy rows is never blocked.
-- ------------------------------------------------------------
create or replace function enforce_product_audience_category()
returns trigger
language plpgsql
as $$
begin
  if new.audience is not null and new.category_id is not null then
    if tg_op = 'INSERT'
       or new.audience is distinct from old.audience
       or new.category_id is distinct from old.category_id then
      if exists (
        select 1 from categories c
        where c.id = new.category_id
          and c.audience is not null
          and c.audience <> new.audience
      ) then
        raise exception 'This category does not belong to the "%" audience.', new.audience
          using errcode = 'check_violation';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_products_audience_category on products;
create trigger trg_products_audience_category
  before insert or update of audience, category_id on products
  for each row execute function enforce_product_audience_category();
