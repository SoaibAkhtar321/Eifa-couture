-- ============================================================
-- EIFA COUTURE — Category images, safe delete and reorder
-- ============================================================
-- 1. `category-images` Storage bucket (public read, admin-only write)
-- 2. admin_category_product_counts()  -> product count per category
-- 3. admin_reorder_categories(ids[])  -> saves sort_order in one go
-- 4. admin_delete_category(...)       -> soft delete that moves
--                                        products + sub-categories
--                                        first, in ONE transaction
-- Safe to run more than once.
-- ============================================================

-- ---------- 1. STORAGE BUCKET + POLICIES ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'category-images',
  'category-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "category_images_public_read" on storage.objects;
create policy "category_images_public_read"
  on storage.objects for select
  using (bucket_id = 'category-images');

drop policy if exists "category_images_admin_insert" on storage.objects;
create policy "category_images_admin_insert"
  on storage.objects for insert
  with check (bucket_id = 'category-images' and public.is_admin());

drop policy if exists "category_images_admin_update" on storage.objects;
create policy "category_images_admin_update"
  on storage.objects for update
  using (bucket_id = 'category-images' and public.is_admin())
  with check (bucket_id = 'category-images' and public.is_admin());

drop policy if exists "category_images_admin_delete" on storage.objects;
create policy "category_images_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'category-images' and public.is_admin());

-- ---------- 2. PRODUCT COUNTS ----------
-- SECURITY INVOKER: runs with the caller's RLS, so an admin sees every
-- product (including inactive ones) and everyone else only sees public ones.
create or replace function public.admin_category_product_counts()
returns table (category_id uuid, product_count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select p.category_id, count(*)::bigint
  from products p
  where p.deleted_at is null
    and p.category_id is not null
  group by p.category_id;
$$;

grant execute on function public.admin_category_product_counts() to authenticated;

-- ---------- 3. REORDER ----------
-- Receives the ids of ONE group of siblings in the new order and writes
-- sort_order 10, 20, 30 ... (gaps leave room for manual edits).
create or replace function public.admin_reorder_categories(p_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can reorder categories' using errcode = '42501';
  end if;

  update categories c
     set sort_order = t.ord::int * 10
    from unnest(p_ids) with ordinality as t(id, ord)
   where c.id = t.id;
end;
$$;

grant execute on function public.admin_reorder_categories(uuid[]) to authenticated;

-- ---------- 4. SAFE DELETE ----------
-- Soft-deletes a category AFTER moving what depends on it:
--   * products   -> p_move_products_to (required if any live product uses it)
--   * children   -> p_children_to      (NULL = they become top-level)
-- Also frees the web address (slug) so the admin can re-create a
-- category with the same name later, and clears image_url (the caller
-- removes the file from Storage using the returned old URL).
create or replace function public.admin_delete_category(
  p_id uuid,
  p_move_products_to uuid default null,
  p_children_to uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_cat       categories%rowtype;
  v_products  int;
  v_children  int;
begin
  if not public.is_admin() then
    raise exception 'Only admins can delete categories' using errcode = '42501';
  end if;

  select * into v_cat from categories where id = p_id and deleted_at is null for update;
  if not found then
    raise exception 'This category no longer exists.';
  end if;

  -- products
  select count(*) into v_products from products where category_id = p_id and deleted_at is null;

  if v_products > 0 and p_move_products_to is null then
    raise exception 'Choose a category to move the % product(s) to first.', v_products;
  end if;

  if p_move_products_to is not null then
    if p_move_products_to = p_id then
      raise exception 'Products cannot be moved into the category being deleted.';
    end if;
    if not exists (select 1 from categories where id = p_move_products_to and deleted_at is null) then
      raise exception 'The category chosen for the products does not exist.';
    end if;
    update products set category_id = p_move_products_to where category_id = p_id;
  else
    -- only already-removed products can still point here
    update products set category_id = null where category_id = p_id;
  end if;

  -- sub-categories
  select count(*) into v_children from categories where parent_id = p_id and deleted_at is null;

  if p_children_to is not null then
    if p_children_to = p_id then
      raise exception 'Sub-categories cannot be moved into the category being deleted.';
    end if;
    if not exists (
      select 1 from categories
       where id = p_children_to and deleted_at is null and parent_id is null
    ) then
      raise exception 'The new parent must be an existing top-level category.';
    end if;
  end if;

  update categories set parent_id = p_children_to where parent_id = p_id;

  -- soft delete (keeps the row for history), free the slug + image
  update categories
     set deleted_at = now(),
         is_active  = false,
         image_url  = null,
         slug       = v_cat.slug || '-deleted-' || substr(replace(v_cat.id::text, '-', ''), 1, 8)
   where id = p_id;

  return jsonb_build_object(
    'name', v_cat.name,
    'old_image_url', v_cat.image_url,
    'products_moved', v_products,
    'children_moved', v_children
  );
end;
$$;

grant execute on function public.admin_delete_category(uuid, uuid, uuid) to authenticated;
