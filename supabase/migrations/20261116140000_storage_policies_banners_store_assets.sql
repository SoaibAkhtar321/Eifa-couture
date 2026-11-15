-- ============================================================
-- EIFA COUTURE — Storage policies for `banners` and `store-assets`
-- (and records the existing `product-images` policies in the repo)
-- Public read, admin-only write. Safe to run more than once.
-- ============================================================

-- ---------- banners ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('banners', 'banners', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "banners_public_read" on storage.objects;
create policy "banners_public_read" on storage.objects for select
  using (bucket_id = 'banners');

drop policy if exists "banners_admin_insert" on storage.objects;
create policy "banners_admin_insert" on storage.objects for insert
  with check (bucket_id = 'banners' and public.is_admin());

drop policy if exists "banners_admin_update" on storage.objects;
create policy "banners_admin_update" on storage.objects for update
  using (bucket_id = 'banners' and public.is_admin())
  with check (bucket_id = 'banners' and public.is_admin());

drop policy if exists "banners_admin_delete" on storage.objects;
create policy "banners_admin_delete" on storage.objects for delete
  using (bucket_id = 'banners' and public.is_admin());

-- ---------- store-assets ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store-assets', 'store-assets', true, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml',
              'image/x-icon', 'image/vnd.microsoft.icon'])
on conflict (id) do update
  set public = true,
      file_size_limit = 10485760,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml',
                                 'image/x-icon', 'image/vnd.microsoft.icon'];

drop policy if exists "store_assets_public_read" on storage.objects;
create policy "store_assets_public_read" on storage.objects for select
  using (bucket_id = 'store-assets');

drop policy if exists "store_assets_admin_insert" on storage.objects;
create policy "store_assets_admin_insert" on storage.objects for insert
  with check (bucket_id = 'store-assets' and public.is_admin());

drop policy if exists "store_assets_admin_update" on storage.objects;
create policy "store_assets_admin_update" on storage.objects for update
  using (bucket_id = 'store-assets' and public.is_admin())
  with check (bucket_id = 'store-assets' and public.is_admin());

drop policy if exists "store_assets_admin_delete" on storage.objects;
create policy "store_assets_admin_delete" on storage.objects for delete
  using (bucket_id = 'store-assets' and public.is_admin());

-- ---------- product-images (already live; recorded here for the repo) ----------
drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert" on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update" on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete" on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());
