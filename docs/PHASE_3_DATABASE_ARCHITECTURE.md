# Phase 3 — Database Architecture (Design Only, Not Deployed)

Status: **architecture ready to apply, no Supabase project connected.**
Nothing in this phase touches the frontend or auth code — it's purely
new files under `supabase/` plus one new, additive types file.

## Files added

```
supabase/migrations/0001_extensions_and_enums.sql
supabase/migrations/0002_core_tables.sql
supabase/migrations/0003_commerce_tables.sql
supabase/migrations/0004_content_and_reviews.sql
supabase/migrations/0005_rls_policies.sql
supabase/storage/STORAGE_PLAN.md
src/types/database.ts
docs/PHASE_3_DATABASE_ARCHITECTURE.md
```

No existing file was modified. `src/types/index.ts` (your current
mock-data types) is untouched — `src/types/database.ts` is a separate,
additive file for the DB shape, to avoid disturbing anything the
frontend currently imports.

## Why this shape

The mock data model in `types/index.ts` already tells us the real
domain (products with sizes/colors/stock, addresses, orders, coupons,
reviews...). The schema below is that same model normalized into
relational tables, plus the handful of tables needed for things the
mock data doesn't have to model yet (inventory, variants, returns,
shipments) but that the "Future Support" list requires room for.

### Identity

- **`profiles`** — Supabase's `auth.users` already stores email/password
  and handles Google OAuth; we never duplicate that. `profiles` is a
  1:1 row for everything app-specific: `display_name`, `phone`, `role`,
  `avatar_url`. A trigger (`handle_new_auth_user`) creates it
  automatically on signup, so the app never has to remember to.
- **`addresses`** — many per user. A partial unique index guarantees at
  most one `is_default = true` row per user without a check constraint
  (defaults are a cross-row rule, so a trigger/partial-index is correct
  here, a plain `check` isn't).

### Catalog

- **`categories`** — self-referencing (`parent_id`) tree, so subcategories
  (e.g. Kurta Sets → Anarkali Sets) are just another row, not a schema
  change.
- **`collections`** — editorial groupings ("Eid Edit") that cut across
  categories. Many-to-many with products via `product_collections`.
  `is_featured` directly powers the "Featured Collections" homepage
  section; a `starts_at`/`ends_at` window is included since these are
  usually campaign-bound.
- **`fabrics`** — pulled out of the mock model's free-text
  `product.fabric` string into its own table, so the admin panel can
  manage a fabric library (care instructions, swatch) once instead of
  retyping it per product.
- **`products`** — the core row. Deliberately does **not** hold
  sizes/colors/stock (that was a flat `stock["M-White"]` map in mock
  data) — those move into `product_variants` + `inventory` below, since
  "per size-color inventory" is a real relational concern (SKUs,
  overselling, per-variant pricing) that a JSON map can't safely hold
  once real money is involved.
- **`product_images`** — ordered gallery, one row per image, with a
  partial unique index enforcing a single `is_primary` image.
- **`product_variants`** — one row per (size, color) combination, each
  with its own SKU and optional `price_override` (for e.g. a size that
  costs more fabric). `unique(product_id, size, color_name)` prevents
  duplicate variants.
- **`inventory`** — kept as its own table rather than a column on
  `product_variants` on purpose: adding multi-warehouse support later
  is "add a `warehouse_id` column and widen the unique constraint," not
  a redesign. `reserved` tracks stock held by unpaid/pending orders so
  available-to-sell (`quantity - reserved`) is always correct.

### Cart & Wishlist

- **`wishlist_items`** — one row per (user, product). Variant-agnostic:
  wishlisting is "I like this product," size/color is chosen later.
- **`cart_items`** — server-persisted per (user, variant), so a signed-in
  user's cart survives across devices/tabs instead of living only in
  the Zustand cart-store's local state.

### Orders

- **`orders`** — `payment_provider` is an enum column (`razorpay`,
  `stripe`, `cod`, `other`) rather than being hardcoded to Razorpay, so
  adding Stripe for international cards later is a new enum value, not
  a new column/table. `shipping_address` is stored as a `jsonb`
  snapshot in addition to the `shipping_address_id` FK — so editing or
  deleting a saved address never rewrites a past invoice.
- **`order_items`** — fully denormalized (name, image, price at the time
  of purchase). If a product's price changes or the product is deleted,
  historical orders are unaffected.
- **`shipments`** — separated from `orders.tracking_number` because one
  order can split into multiple shipments, and because "multiple
  shipping providers" was an explicit future-support requirement.
- **`order_returns`** — returns/exchanges, modeled now (even though
  there's no UI for it yet) specifically because it was called out
  under "Future Support" and retrofitting it onto a live orders table
  is much riskier than including it in the initial schema.
- **`coupons`** / **`coupon_redemptions`** — the coupon definition is
  separate from the redemption log, because "has this user already
  used this code" and "total uses across all users" need per-user and
  global counters respectively; a single `used_count` column can't
  answer "did *this* user already use it."

### Reviews

- **`reviews`** — rating lives on the review row itself; there's no
  separate ratings table because a star rating without review text is
  still just a review with an empty comment, not a different entity.
  `is_verified` is set by a trigger that checks for a *delivered* order
  containing that product for that user — never trusted from client
  input. `unique(user_id, product_id)` caps it at one review per user
  per product.
- **`products.rating_avg` / `rating_count`** — denormalized onto
  `products` and kept in sync by a trigger on `reviews`. This is a
  deliberate normalization break: without it, every product-listing
  query used for "sort by rating" (search, shop grid, homepage
  best-sellers) would need a live `AVG()`/`COUNT()` join.

### Content

- **`banners`** — hero banners with a `starts_at`/`ends_at` window and
  separate desktop/mobile image URLs.
- **`notifications`** — order/promotion/system/review notifications per
  user; inserts are expected from server-side code (order confirmation,
  promo blast) using the service role, not directly from customers.

## Keys, cascades, and soft deletes

- **Primary keys**: `uuid` everywhere via `gen_random_uuid()` — matches
  Supabase Auth's `auth.users.id` type and avoids exposing sequential
  IDs (competitor scraping, guessable order numbers) in the storefront
  URLs.
- **Cascade rules**, chosen per relationship, not blanket `cascade`:
  - `on delete cascade` where the child is meaningless without the
    parent and has no historical value: `addresses`, `cart_items`,
    `wishlist_items`, `product_images`, `product_variants`,
    `inventory`, `order_items` (cascades from `orders`, not the other
    way), `reviews`, `review_images`.
  - `on delete set null` where the reference is informational and the
    row should survive the parent's deletion: `products.category_id`,
    `products.fabric_id`, `order_items.product_id` (an order shouldn't
    vanish if a product is later deleted).
  - `on delete restrict` on `orders.user_id` — a user row is never hard
    deleted while they have orders (see soft delete below), so this is
    a safety net, not the primary mechanism.
- **Soft delete strategy**: `deleted_at timestamptz` on tables where
  "deleted" needs to be recoverable and historically referenced —
  `profiles`, `categories`, `collections`, `products`. Order-related
  tables (`orders`, `order_items`) are never deleted at all, soft or
  hard — they're permanent financial/legal records. Everywhere else
  (variants, inventory, coupons, banners) uses `is_active` as a
  publish/unpublish toggle instead, since "inactive" is the actual
  business concept, not "removed."
- **Timestamp strategy**: every table has `created_at timestamptz
  default now()`; every table whose rows are ever mutated after
  creation also has `updated_at`, auto-maintained by the shared
  `set_updated_at()` trigger (defined once in migration 0001, attached
  per-table) — so no per-table trigger logic needs to be reinvented or
  can drift out of sync.

## Indexes

- Foreign key columns are indexed wherever they're queried in the
  reverse direction (`addresses.user_id`, `orders.user_id`,
  `reviews.product_id`, etc.) — the FK itself doesn't auto-index in
  Postgres.
- `pg_trgm` GIN index on `products.name` — this is what makes the
  existing fuzzy/ILIKE matching in `src/lib/search.ts` fast at scale
  instead of a full sequential scan once the catalog is in the
  hundreds/thousands of products.
- GIN index on `products.tags` (array column) for tag-based filtering.
- Partial indexes (`where is_active`, `where is_featured`, `where
  is_read = false`) so the index only covers the rows that are actually
  queried in the hot path (active catalog, unread notifications).

## Row Level Security (migration 0005)

Role strategy — three roles on `profiles.role`:

- **`customer`** (default): read public catalog data; read/write only
  rows they own (own profile, addresses, cart, wishlist, orders,
  reviews).
- **`admin`**: full read/write on catalog & commerce tables — this is
  what the admin panel runs as.
- **`superadmin`**: same as admin; reserved for the one operation admins
  shouldn't be able to do to each other — changing roles — enforced by
  the `profiles_update_own` policy's `with check (role = 'customer')`,
  which stops a customer from self-promoting, combined with role
  changes only ever happening through an admin-gated path.

Two `security definer` helper functions (`auth_role()`, `is_admin()`,
both in migration 0001) back nearly every policy — they read the
caller's own `profiles.role` without triggering recursive RLS
evaluation, which is the standard Supabase pattern for role-based
policies.

Order **status/payment updates never go through a customer-writable
policy** — those are expected to happen via payment webhooks and admin
actions using the Supabase **service role key** (server-side only,
bypasses RLS entirely), which is why there's no `orders_update_own`
policy for customers.

## Storage

See `supabase/storage/STORAGE_PLAN.md` — six buckets planned
(`product-images`, `fabric-swatches`, `banners`, `review-images`,
`avatars` public; `invoices` private via signed URLs), with a path
convention (`{bucket}/{owning_row_id}/...`) chosen so storage RLS
policies can mirror the equivalent table policy almost line-for-line.

## What's intentionally deferred to Phase 4+

- Actually connecting to a Supabase project / running these migrations.
- Running `supabase gen types typescript` to replace the hand-written
  `src/types/database.ts` with the generated source of truth.
- Wiring `src/lib/search.ts` and the product/shop/search pages to query
  these tables instead of `mock-data.ts`.
- Payment webhook handlers, invoice generation, email marketing,
  loyalty points — schema has room (enums, nullable FKs) for all of
  these, but no logic is implemented yet, per this phase's scope.

## Verification performed on this phase

- `npx tsc --noEmit` — passes (`src/types/database.ts` is the only new
  TS file; it's a pure type-definitions file with no runtime code).
- `npx eslint src/types/database.ts` — passes, no warnings.
- The SQL migrations were not executed against a live database (none
  exists yet) — they'll need to be applied and smoke-tested once the
  client's Supabase project is available, per the instruction not to
  connect Supabase in this phase.
