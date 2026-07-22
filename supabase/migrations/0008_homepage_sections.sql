-- ============================================================
-- EIFA COUTURE — Migration 0008
-- Homepage CMS: homepage section management
-- ============================================================
-- Backs admin control over the four data-driven storefront homepage
-- sections (Featured Collection, New Arrivals, Best Sellers, Shop by
-- Category). Rows are fixed (one per `section_key`) rather than an
-- open-ended CRUD list — admins edit each section's visibility,
-- order, copy, item count, and (where applicable) source collection.
-- Hero banners/other homepage modules are out of scope here and stay
-- on their existing tables (see 0004_content_and_reviews.sql).

create table if not exists homepage_sections (
  id                  uuid primary key default gen_random_uuid(),
  section_key         text not null unique
                        check (section_key in ('featured_collection', 'new_arrivals', 'best_sellers', 'shop_by_category')),
  title               text,
  subtitle            text,
  is_active           boolean not null default true,
  sort_order          int not null default 0,
  item_limit          int not null default 4 check (item_limit between 1 and 24),
  -- Only meaningful for 'featured_collection'; null lets that section
  -- fall back to its existing auto-pick-the-featured-collection
  -- behavior (see lib/data/collections.ts::fetchFeaturedCollection).
  source_collection_id uuid references collections(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger trg_homepage_sections_updated_at
  before update on homepage_sections
  for each row execute function set_updated_at();

-- Seed the four fixed sections with defaults that match current
-- storefront copy/limits, so this migration is a no-op for rendered
-- output until an admin changes something.
insert into homepage_sections (section_key, title, subtitle, sort_order, item_limit) values
  ('featured_collection', null, null, 1, 4),
  ('new_arrivals', 'New Arrivals', 'Fresh silhouettes inspired by Mughal gardens and Lucknowi heritage.', 2, 6),
  ('best_sellers', 'Best Sellers', 'The most cherished handcrafted pieces from our collection.', 3, 4),
  ('shop_by_category', 'Shop by Category', 'Move directly into the collection you are looking for — from handcrafted Chikankari classics to festive accessories.', 4, 8)
on conflict (section_key) do nothing;

alter table homepage_sections enable row level security;

create policy "homepage_sections_public_read" on homepage_sections for select using (true);
create policy "homepage_sections_admin_write" on homepage_sections for all using (is_admin()) with check (is_admin());
