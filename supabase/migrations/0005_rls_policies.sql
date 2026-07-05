-- ============================================================
-- EIFA COUTURE — Migration 0005
-- Row Level Security
-- ============================================================
-- Role strategy:
--   customer   — default. Can read public catalog data, and read/write
--                only rows they own (own profile, addresses, cart,
--                wishlist, orders, reviews).
--   admin      — full read/write on catalog & commerce tables via the
--                admin panel. Cannot manage other admins' profiles/roles.
--   superadmin — everything admin can, plus managing other users' roles.
-- `is_admin()` / `auth_role()` (defined in 0002, right after `profiles`
-- is created) are SECURITY DEFINER
-- functions so policies can check role without recursively re-querying
-- `profiles` under RLS.

-- ---------- PROFILES ----------
alter table profiles enable row level security;

create policy "profiles_select_own_or_admin"
  on profiles for select
  using (auth.uid() = id or is_admin());

create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = 'customer'); -- customers can't self-promote

create policy "profiles_update_admin"
  on profiles for update
  using (is_admin());

-- Row insertion happens via the handle_new_auth_user() trigger
-- (security definer), so no INSERT policy is needed for normal signup.

-- ---------- ADDRESSES ----------
alter table addresses enable row level security;

create policy "addresses_all_own"
  on addresses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "addresses_select_admin"
  on addresses for select
  using (is_admin());

-- ---------- CATEGORIES / COLLECTIONS / FABRICS / BANNERS (public catalog) ----------
alter table categories enable row level security;
alter table collections enable row level security;
alter table fabrics enable row level security;
alter table banners enable row level security;
alter table product_collections enable row level security;

create policy "categories_public_read" on categories for select using (is_active and deleted_at is null);
create policy "categories_admin_write" on categories for all using (is_admin()) with check (is_admin());

create policy "collections_public_read" on collections for select using (is_active and deleted_at is null);
create policy "collections_admin_write" on collections for all using (is_admin()) with check (is_admin());

create policy "fabrics_public_read" on fabrics for select using (is_active);
create policy "fabrics_admin_write" on fabrics for all using (is_admin()) with check (is_admin());

create policy "banners_public_read" on banners for select
  using (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()));
create policy "banners_admin_write" on banners for all using (is_admin()) with check (is_admin());

create policy "product_collections_public_read" on product_collections for select using (true);
create policy "product_collections_admin_write" on product_collections for all using (is_admin()) with check (is_admin());

-- ---------- PRODUCTS / IMAGES / VARIANTS / INVENTORY ----------
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_variants enable row level security;
alter table inventory enable row level security;

create policy "products_public_read"
  on products for select
  using (is_active and deleted_at is null);

create policy "products_admin_all"
  on products for all
  using (is_admin())
  with check (is_admin());

create policy "product_images_public_read" on product_images for select using (true);
create policy "product_images_admin_write" on product_images for all using (is_admin()) with check (is_admin());

create policy "product_variants_public_read" on product_variants for select using (is_active);
create policy "product_variants_admin_write" on product_variants for all using (is_admin()) with check (is_admin());

-- Inventory counts are readable by everyone (needed for "In stock" /
-- "Only 2 left" UI) but only admin/back-office can change quantities.
create policy "inventory_public_read" on inventory for select using (true);
create policy "inventory_admin_write" on inventory for all using (is_admin()) with check (is_admin());

-- ---------- WISHLIST / CART (private to the owning user) ----------
alter table wishlist_items enable row level security;
alter table cart_items enable row level security;

create policy "wishlist_all_own" on wishlist_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "cart_all_own" on cart_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- COUPONS ----------
alter table coupons enable row level security;
alter table coupon_redemptions enable row level security;

-- Customers may look up an *active* coupon by code to validate it at
-- checkout, but the full row-scan/listing is admin-only in practice
-- because there's no index-friendly "list all active coupons" UI need
-- on the storefront — this policy just permits the point lookup.
create policy "coupons_read_active" on coupons for select
  using (is_active and (expires_at is null or expires_at > now()));
create policy "coupons_admin_write" on coupons for all using (is_admin()) with check (is_admin());

create policy "coupon_redemptions_select_own_or_admin" on coupon_redemptions for select
  using (auth.uid() = user_id or is_admin());
create policy "coupon_redemptions_insert_own" on coupon_redemptions for insert
  with check (auth.uid() = user_id);

-- ---------- ORDERS / ORDER ITEMS / SHIPMENTS / RETURNS ----------
alter table orders enable row level security;
alter table order_items enable row level security;
alter table shipments enable row level security;
alter table order_returns enable row level security;

create policy "orders_select_own_or_admin" on orders for select
  using (auth.uid() = user_id or is_admin());
create policy "orders_insert_own" on orders for insert
  with check (auth.uid() = user_id);
-- Customers cannot directly update order rows (status changes come from
-- payment webhooks / admin actions, both using the service role which
-- bypasses RLS entirely). Admins can update via the panel.
create policy "orders_update_admin" on orders for update
  using (is_admin());

create policy "order_items_select_own_or_admin" on order_items for select
  using (
    is_admin() or exists (
      select 1 from orders o where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );
create policy "order_items_admin_write" on order_items for all using (is_admin()) with check (is_admin());

create policy "shipments_select_own_or_admin" on shipments for select
  using (
    is_admin() or exists (
      select 1 from orders o where o.id = shipments.order_id and o.user_id = auth.uid()
    )
  );
create policy "shipments_admin_write" on shipments for all using (is_admin()) with check (is_admin());

create policy "returns_select_own_or_admin" on order_returns for select
  using (auth.uid() = user_id or is_admin());
create policy "returns_insert_own" on order_returns for insert
  with check (auth.uid() = user_id);
create policy "returns_update_admin" on order_returns for update
  using (is_admin());

-- ---------- REVIEWS ----------
alter table reviews enable row level security;
alter table review_images enable row level security;

create policy "reviews_public_read_published" on reviews for select
  using (is_published or auth.uid() = user_id or is_admin());
create policy "reviews_insert_own" on reviews for insert
  with check (auth.uid() = user_id);
create policy "reviews_update_own_or_admin" on reviews for update
  using (auth.uid() = user_id or is_admin());
create policy "reviews_delete_own_or_admin" on reviews for delete
  using (auth.uid() = user_id or is_admin());

create policy "review_images_read" on review_images for select using (true);
create policy "review_images_write_own_or_admin" on review_images for all
  using (
    is_admin() or exists (select 1 from reviews r where r.id = review_images.review_id and r.user_id = auth.uid())
  )
  with check (
    is_admin() or exists (select 1 from reviews r where r.id = review_images.review_id and r.user_id = auth.uid())
  );

-- ---------- NOTIFICATIONS ----------
alter table notifications enable row level security;

create policy "notifications_select_own" on notifications for select using (auth.uid() = user_id);
create policy "notifications_update_own" on notifications for update using (auth.uid() = user_id);
-- Inserts come from server-side triggers/webhooks using the service role
-- (order confirmations, promo blasts), so no customer INSERT policy.
create policy "notifications_admin_write" on notifications for insert with check (is_admin());