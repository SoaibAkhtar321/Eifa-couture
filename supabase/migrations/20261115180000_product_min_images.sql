-- ============================================================
-- EIFA COUTURE — Minimum 3 product photos (Phase 2)
-- ============================================================
-- Server-side enforcement of the photo minimum, so it cannot be
-- bypassed from the browser:
--   1. A product cannot be inserted or switched ON (is_active false
--      -> true) unless it has at least 3 product-level photos
--      (product_images.variant_id is null).
--   2. A photo cannot be deleted if that would leave a live product
--      with fewer than 3 product-level photos.
-- Existing live products with fewer photos are NOT touched or
-- deactivated; they simply cannot lose more photos, and cannot be
-- switched off and on again until they have 3.
-- Hard-deleting a whole product (cascade) is still allowed.
-- Re-runnable. SECURITY DEFINER functions have a fixed search_path.

create or replace function enforce_min_images_on_activate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if new.is_active is true
     and new.deleted_at is null
     and (tg_op = 'INSERT' or old.is_active is distinct from true) then
    select count(*) into v_count
      from product_images
     where product_id = new.id and variant_id is null;
    if v_count < 3 then
      raise exception 'A product needs at least 3 photos before it can go live (it has %).', v_count
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_products_min_images on products;
create trigger trg_products_min_images
  before insert or update of is_active on products
  for each row execute function enforce_min_images_on_activate();

create or replace function enforce_min_images_on_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_active  boolean;
  v_deleted timestamptz;
  v_found   boolean;
  v_left    int;
begin
  if old.variant_id is not null then
    return old;
  end if;

  select true, p.is_active, p.deleted_at
    into v_found, v_active, v_deleted
    from products p where p.id = old.product_id;

  -- Parent already gone (cascade from a product delete): allow.
  if v_found is not true then
    return old;
  end if;

  if v_active and v_deleted is null then
    select count(*) into v_left
      from product_images
     where product_id = old.product_id and variant_id is null and id <> old.id;
    if v_left < 3 then
      raise exception 'This product is live and needs at least 3 photos. Add another photo first, then delete this one.'
        using errcode = 'check_violation';
    end if;
  end if;

  return old;
end;
$$;

drop trigger if exists trg_product_images_min_on_delete on product_images;
create trigger trg_product_images_min_on_delete
  before delete on product_images
  for each row execute function enforce_min_images_on_delete();

-- Rollback (if ever needed):
--   drop trigger if exists trg_products_min_images on products;
--   drop trigger if exists trg_product_images_min_on_delete on product_images;
--   drop function if exists enforce_min_images_on_activate();
--   drop function if exists enforce_min_images_on_delete();
