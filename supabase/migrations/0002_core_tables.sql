-- ============================================================
-- EIFA COUTURE — Migration 0002
-- Core identity & catalog tables
-- ============================================================

-- ------------------------------------------------------------
-- PROFILES
-- 1:1 extension of Supabase's built-in `auth.users`. We never store
-- passwords/email ourselves — auth.users already owns that. This table
-- only holds app-facing profile data + role, and is what RLS checks
-- against (auth.users is not queryable from the client anyway).
-- ------------------------------------------------------------
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null default '',
  phone         text,
  role          user_role not null default 'customer',
  avatar_url    text,
  is_active     boolean not null default true,      -- soft "ban" switch
  deleted_at    timestamptz,                          -- soft delete
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ── Shared helper: current app role (used heavily by RLS in 0005) ──
-- Reads role from the caller's own profile row. STABLE + SECURITY DEFINER
-- so it can be used inside policies without recursive RLS evaluation.
-- Moved here (from 0001) because it selects from `profiles`, which must
-- exist before this function body can be validated by Postgres.
create or replace function auth_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth_role() in ('admin', 'superadmin'), false);
$$;

-- Auto-create a profile row whenever a new auth user signs up
-- (covers email/password and Google OAuth, since both hit auth.users).
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ------------------------------------------------------------
-- ADDRESSES
-- Multiple saved addresses per customer (checkout + account page).
-- ------------------------------------------------------------
create table if not exists addresses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  full_name      text not null,
  phone          text not null,
  address_line1  text not null,
  address_line2  text,
  city           text not null,
  state          text not null,
  pincode        text not null,
  type           address_type not null default 'home',
  is_default     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_addresses_user on addresses(user_id);

-- Only one default address per user — enforced via partial unique index
-- rather than a check constraint, since "default" is a cross-row rule.
create unique index if not exists uq_addresses_one_default_per_user
  on addresses(user_id) where is_default;

create trigger trg_addresses_updated_at
  before update on addresses
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- CATEGORIES
-- Self-referencing tree (parent_id) so "Kurta Sets" > "Anarkali Sets"
-- style subcategories work without a schema change later.
-- ------------------------------------------------------------
create table if not exists categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  description  text default '',
  image_url    text,
  parent_id    uuid references categories(id) on delete set null,
  sort_order   int not null default 0,
  is_active    boolean not null default true,
  deleted_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_categories_parent on categories(parent_id);
create index if not exists idx_categories_slug on categories(slug);

create trigger trg_categories_updated_at
  before update on categories
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- COLLECTIONS
-- Editorial/marketing groupings (e.g. "Eid Edit", "Bridal Chikankari")
-- that sit orthogonal to categories. Many-to-many with products.
-- ------------------------------------------------------------
create table if not exists collections (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  description  text default '',
  image_url    text,
  is_featured  boolean not null default false,   -- powers "Featured Collections"
  sort_order   int not null default 0,
  is_active    boolean not null default true,
  starts_at    timestamptz,                        -- optional campaign window
  ends_at      timestamptz,
  deleted_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_collections_slug on collections(slug);
create index if not exists idx_collections_featured on collections(is_featured) where is_featured;

create trigger trg_collections_updated_at
  before update on collections
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- FABRICS
-- Normalized out of `products.fabric` (was a free-text string in mock
-- data) so the admin panel can manage a fabric catalog (care
-- instructions, swatch image) once instead of per-product.
-- ------------------------------------------------------------
create table if not exists fabrics (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,          -- e.g. "Pure Chanderi Silk"
  description  text default '',
  care         text[] not null default '{}',  -- e.g. {"Dry clean only"}
  swatch_url   text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger trg_fabrics_updated_at
  before update on fabrics
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- PRODUCTS
-- Core catalog row. Sizes/colors/stock move out into product_variants
-- (0002 below) so inventory can be tracked per size-color combo instead
-- of the mock data's flat `stock["M-White"]` map.
-- ------------------------------------------------------------
create table if not exists products (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  slug               text not null unique,
  description        text not null default '',
  short_description  text not null default '',
  price              numeric(10,2) not null check (price >= 0),
  compare_at_price   numeric(10,2) check (compare_at_price is null or compare_at_price >= price),
  category_id        uuid references categories(id) on delete set null,
  fabric_id          uuid references fabrics(id) on delete set null,
  tags               text[] not null default '{}',
  is_featured        boolean not null default false,
  is_best_seller     boolean not null default false,
  is_new_arrival     boolean not null default false,
  is_active          boolean not null default true,
  seo_title          text,
  seo_description    text,
  seo_keywords       text[] not null default '{}',
  deleted_at         timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_fabric on products(fabric_id);
create index if not exists idx_products_active on products(is_active) where is_active and deleted_at is null;
create index if not exists idx_products_flags on products(is_featured, is_best_seller, is_new_arrival);
create index if not exists idx_products_tags on products using gin(tags);
-- Trigram index powers the existing fuzzy/ILIKE search in src/lib/search.ts
create index if not exists idx_products_name_trgm on products using gin (name gin_trgm_ops);

create trigger trg_products_updated_at
  before update on products
  for each row execute function set_updated_at();

-- Many-to-many: products <-> collections
create table if not exists product_collections (
  product_id     uuid not null references products(id) on delete cascade,
  collection_id  uuid not null references collections(id) on delete cascade,
  sort_order     int not null default 0,
  primary key (product_id, collection_id)
);

create index if not exists idx_product_collections_collection on product_collections(collection_id);

-- ------------------------------------------------------------
-- PRODUCT IMAGES
-- Ordered multi-image gallery per product (mock data's `images: string[]`).
-- ------------------------------------------------------------
create table if not exists product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references products(id) on delete cascade,
  url          text not null,
  alt_text     text default '',
  sort_order   int not null default 0,
  is_primary   boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists idx_product_images_product on product_images(product_id, sort_order);

-- Only one primary image per product
create unique index if not exists uq_product_images_one_primary
  on product_images(product_id) where is_primary;

-- ------------------------------------------------------------
-- PRODUCT VARIANTS
-- Replaces the mock model's `sizes[]` + `colors[]` + `stock["M-White"]`
-- with a proper row per (size, color) combination — each with its own
-- SKU, optional price override, and a 1:1 inventory row.
-- ------------------------------------------------------------
create table if not exists product_variants (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products(id) on delete cascade,
  sku           text not null unique,
  size          text not null,
  color_name    text not null,
  color_hex     text,
  price_override numeric(10,2) check (price_override is null or price_override >= 0),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (product_id, size, color_name)
);

create index if not exists idx_variants_product on product_variants(product_id);

create trigger trg_variants_updated_at
  before update on product_variants
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- INVENTORY
-- Kept as its own table (not a column on product_variants) so future
-- multi-warehouse support just means adding a warehouse_id column and
-- widening the unique constraint — no structural rewrite.
-- ------------------------------------------------------------
create table if not exists inventory (
  id            uuid primary key default gen_random_uuid(),
  variant_id    uuid not null unique references product_variants(id) on delete cascade,
  quantity      int not null default 0 check (quantity >= 0),
  reserved      int not null default 0 check (reserved >= 0), -- held by unpaid/pending orders
  low_stock_at  int not null default 3,   -- admin dashboard threshold
  updated_at    timestamptz not null default now()
);

create trigger trg_inventory_updated_at
  before update on inventory
  for each row execute function set_updated_at();

-- Convenience view: what the storefront actually needs to show "In stock"
create or replace view product_variant_availability as
  select
    v.id as variant_id,
    v.product_id,
    v.size,
    v.color_name,
    coalesce(i.quantity - i.reserved, 0) as available
  from product_variants v
  left join inventory i on i.variant_id = v.id;