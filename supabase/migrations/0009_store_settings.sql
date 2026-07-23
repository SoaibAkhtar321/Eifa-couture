-- ============================================================
-- EIFA COUTURE — Migration 0009
-- Store Settings: singleton admin-configurable store config
-- ============================================================
-- Backs the Admin Settings module: store contact info, business/
-- registration details, logo/favicon, social links, SEO defaults,
-- currency, shipping, and tax config. Singleton table (exactly one
-- row) — same "fixed rows, update-only" spirit as
-- `homepage_sections` (0008), taken further since there's only ever
-- one store. The `singleton` boolean primary key with a `check`
-- constraint is the standard Postgres one-row-table pattern: a second
-- `insert` would collide on the primary key.

create table if not exists store_settings (
  singleton                boolean primary key default true check (singleton),

  -- Store information
  store_name               text not null default 'Eifa Couture',
  store_email              text,
  store_phone              text,
  address_line1            text,
  address_line2            text,
  address_city             text,
  address_state            text,
  address_pincode          text,
  address_country          text not null default 'India',

  -- Business information
  business_legal_name      text,
  business_registration_no text,
  gstin                    text,

  -- Branding
  logo_url                 text,
  favicon_url              text,

  -- Social media links
  social_instagram_url     text,
  social_facebook_url      text,
  social_pinterest_url     text,
  social_youtube_url       text,
  social_twitter_url       text,

  -- SEO defaults
  seo_default_title        text,
  seo_default_description  text,

  -- Currency
  currency_code            text not null default 'INR',
  currency_symbol          text not null default '₹',

  -- Shipping
  shipping_flat_rate       numeric(10,2) not null default 0 check (shipping_flat_rate >= 0),
  shipping_free_threshold  numeric(10,2) check (shipping_free_threshold is null or shipping_free_threshold >= 0),
  shipping_processing_days int not null default 2 check (shipping_processing_days >= 0),

  -- Tax
  tax_gst_percent          numeric(5,2) not null default 0 check (tax_gst_percent >= 0 and tax_gst_percent <= 100),
  tax_prices_inclusive     boolean not null default true,

  updated_at               timestamptz not null default now()
);

create trigger trg_store_settings_updated_at
  before update on store_settings
  for each row execute function set_updated_at();

-- Seed the single row. `store_name` matches the brand identity already
-- used across the storefront (see `docs/PHASE_3_DATABASE_ARCHITECTURE.md`
-- and existing product/collection copy).
insert into store_settings (singleton, store_name, address_country, currency_code, currency_symbol)
values (true, 'Eifa Couture', 'India', 'INR', '₹')
on conflict (singleton) do nothing;

alter table store_settings enable row level security;

-- Public read: storefront components (footer contact info, SEO
-- defaults, social links) may read this in future without needing
-- their own policy change; write stays admin-only same as
-- `homepage_sections_admin_write`.
create policy "store_settings_public_read" on store_settings for select using (true);
create policy "store_settings_admin_write" on store_settings for all using (is_admin()) with check (is_admin());
