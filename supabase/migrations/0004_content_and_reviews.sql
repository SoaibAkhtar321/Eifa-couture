-- ============================================================
-- EIFA COUTURE — Migration 0004
-- Reviews/ratings, hero banners, notifications
-- ============================================================

-- ------------------------------------------------------------
-- REVIEWS
-- Rating lives on the review row itself (there's no separate "ratings"
-- table) — a rating without a review is still just a review with an
-- empty comment. `is_verified` = the user has an order containing this
-- product, set by a trigger rather than trusted client input.
-- ------------------------------------------------------------
create table if not exists reviews (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  product_id   uuid not null references products(id) on delete cascade,
  order_item_id uuid references order_items(id) on delete set null,
  rating       int not null check (rating between 1 and 5),
  title        text default '',
  comment      text default '',
  is_verified  boolean not null default false,
  is_published boolean not null default true,   -- admin moderation switch
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, product_id)                   -- one review per product per user
);

create index if not exists idx_reviews_product on reviews(product_id) where is_published;
create index if not exists idx_reviews_user on reviews(user_id);

create trigger trg_reviews_updated_at
  before update on reviews
  for each row execute function set_updated_at();

create table if not exists review_images (
  id          uuid primary key default gen_random_uuid(),
  review_id   uuid not null references reviews(id) on delete cascade,
  url         text not null,
  sort_order  int not null default 0
);

create index if not exists idx_review_images_review on review_images(review_id);

-- Auto-verify: does this user have a delivered order item for this product?
create or replace function set_review_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.is_verified := exists (
    select 1
    from order_items oi
    join orders o on o.id = oi.order_id
    where oi.product_id = new.product_id
      and o.user_id = new.user_id
      and o.status = 'delivered'
  );
  return new;
end;
$$;

create trigger trg_reviews_set_verified
  before insert or update of product_id, user_id on reviews
  for each row execute function set_review_verified();

-- ------------------------------------------------------------
-- Denormalized rating aggregate on products, kept in sync by trigger.
-- Storing it avoids an AVG()/COUNT() join on every product-listing
-- query (search, shop grid, homepage) purely for sorting by "rating".
-- ------------------------------------------------------------
alter table products
  add column if not exists rating_avg numeric(3,2) not null default 0,
  add column if not exists rating_count int not null default 0;

create or replace function refresh_product_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_product uuid := coalesce(new.product_id, old.product_id);
begin
  update products p
  set rating_avg = coalesce(r.avg_rating, 0),
      rating_count = coalesce(r.cnt, 0)
  from (
    select round(avg(rating)::numeric, 2) as avg_rating, count(*) as cnt
    from reviews
    where product_id = target_product and is_published
  ) r
  where p.id = target_product;
  return null;
end;
$$;

create trigger trg_reviews_refresh_rating
  after insert or update or delete on reviews
  for each row execute function refresh_product_rating();

-- ------------------------------------------------------------
-- HERO BANNERS
-- ------------------------------------------------------------
create table if not exists banners (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  subtitle    text default '',
  image_url   text not null,
  mobile_image_url text,
  link_url    text,
  cta_label   text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_banners_active on banners(is_active, sort_order);

create trigger trg_banners_updated_at
  before update on banners
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- NOTIFICATIONS
-- ------------------------------------------------------------
create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  type        notification_type not null,
  title       text not null,
  message     text not null default '',
  link_url    text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notifications_user on notifications(user_id, is_read, created_at desc);
