-- ============================================================
-- EIFA COUTURE — Migration 0003
-- Commerce: wishlist, cart, orders, coupons, returns
-- ============================================================

-- ------------------------------------------------------------
-- WISHLIST
-- One row per (user, product). Variant-agnostic on purpose — wishlist
-- is "I like this product", size/color is chosen at add-to-cart time.
-- ------------------------------------------------------------
create table if not exists wishlist_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  product_id  uuid not null references products(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists idx_wishlist_user on wishlist_items(user_id);

-- ------------------------------------------------------------
-- CART
-- Server-persisted cart (mirrors the current Zustand cart-store shape)
-- so a signed-in user's cart survives across devices. One row per
-- (user, variant); quantity is updated in place rather than duplicated.
-- ------------------------------------------------------------
create table if not exists cart_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  variant_id  uuid not null references product_variants(id) on delete cascade,
  quantity    int not null default 1 check (quantity > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, variant_id)
);

create index if not exists idx_cart_items_user on cart_items(user_id);

create trigger trg_cart_items_updated_at
  before update on cart_items
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- COUPONS
-- ------------------------------------------------------------
create table if not exists coupons (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  type           coupon_type not null,
  value          numeric(10,2) not null check (value > 0),
  min_order      numeric(10,2),
  max_discount   numeric(10,2),
  usage_limit    int,                        -- total uses across all users, null = unlimited
  per_user_limit int not null default 1,
  used_count     int not null default 0,
  is_active      boolean not null default true,
  starts_at      timestamptz not null default now(),
  expires_at     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_coupons_code on coupons(code);
create index if not exists idx_coupons_active on coupons(is_active, expires_at);

create trigger trg_coupons_updated_at
  before update on coupons
  for each row execute function set_updated_at();

-- Per-user redemption log — needed to enforce per_user_limit and to show
-- "you already used this code" without scanning the orders table.
create table if not exists coupon_redemptions (
  id          uuid primary key default gen_random_uuid(),
  coupon_id   uuid not null references coupons(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  order_id    uuid,  -- FK added after orders exists (see below)
  redeemed_at timestamptz not null default now()
);

create index if not exists idx_coupon_redemptions_user on coupon_redemptions(coupon_id, user_id);

-- ------------------------------------------------------------
-- ORDERS
-- Payment provider is its own enum column so a second gateway (Stripe,
-- for international cards) is a value, not a schema change.
-- ------------------------------------------------------------
create table if not exists orders (
  id                  uuid primary key default gen_random_uuid(),
  order_number        text not null unique,      -- human-friendly, e.g. EC-2026-00042
  user_id             uuid not null references profiles(id) on delete restrict,
  status              order_status not null default 'pending',
  payment_status      payment_status not null default 'pending',
  payment_provider    payment_provider not null default 'razorpay',
  payment_provider_ref text,                       -- e.g. razorpay_order_id / stripe_payment_intent_id
  subtotal            numeric(10,2) not null check (subtotal >= 0),
  discount            numeric(10,2) not null default 0 check (discount >= 0),
  shipping_fee        numeric(10,2) not null default 0 check (shipping_fee >= 0),
  total               numeric(10,2) not null check (total >= 0),
  coupon_id           uuid references coupons(id) on delete set null,
  shipping_address_id uuid references addresses(id) on delete set null,
  -- Snapshot the address at time of order so later edits/deletes to the
  -- saved address never rewrite historical invoices.
  shipping_address    jsonb not null,
  tracking_number      text,
  shipping_provider    text,                       -- future multi-carrier support
  invoice_url          text,
  placed_at            timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table coupon_redemptions
  add constraint fk_coupon_redemptions_order
  foreign key (order_id) references orders(id) on delete set null;

create index if not exists idx_orders_user on orders(user_id, placed_at desc);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_payment_status on orders(payment_status);

create trigger trg_orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- ORDER ITEMS
-- Fully denormalized snapshot (name/image/price at purchase time) so
-- price changes or product deletion never alter historical orders.
-- ------------------------------------------------------------
create table if not exists order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  product_id   uuid references products(id) on delete set null,
  variant_id   uuid references product_variants(id) on delete set null,
  name         text not null,
  image_url    text,
  size         text not null,
  color_name   text not null,
  quantity     int not null check (quantity > 0),
  unit_price   numeric(10,2) not null check (unit_price >= 0),
  created_at   timestamptz not null default now()
);

create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_order_items_product on order_items(product_id);

-- ------------------------------------------------------------
-- SHIPMENTS (future multi-shipping-provider support, admin dashboard)
-- One order can split into multiple shipments later; kept separate from
-- `orders.tracking_number` on purpose for that reason.
-- ------------------------------------------------------------
create table if not exists shipments (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references orders(id) on delete cascade,
  provider         text not null,               -- e.g. "delhivery", "bluedart"
  tracking_number  text,
  status           shipment_status not null default 'label_created',
  shipped_at       timestamptz,
  delivered_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_shipments_order on shipments(order_id);

create trigger trg_shipments_updated_at
  before update on shipments
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- RETURNS / EXCHANGES (listed under "Future Support"; modeled now so
-- the order lifecycle never needs a breaking migration to add it)
-- ------------------------------------------------------------
create table if not exists order_returns (
  id             uuid primary key default gen_random_uuid(),
  order_item_id  uuid not null references order_items(id) on delete cascade,
  user_id        uuid not null references profiles(id) on delete cascade,
  status         return_status not null default 'requested',
  reason         text not null,
  is_exchange    boolean not null default false,
  exchange_variant_id uuid references product_variants(id) on delete set null,
  refund_amount  numeric(10,2),
  requested_at   timestamptz not null default now(),
  resolved_at    timestamptz,
  updated_at     timestamptz not null default now()
);

create index if not exists idx_returns_order_item on order_returns(order_item_id);
create index if not exists idx_returns_user on order_returns(user_id);

create trigger trg_order_returns_updated_at
  before update on order_returns
  for each row execute function set_updated_at();
