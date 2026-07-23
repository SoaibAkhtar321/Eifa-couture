-- ============================================================
-- EIFA COUTURE — Migration 0012
-- Variant images: reuse `product_images` instead of a new table.
--   variant_id IS NULL  -> product-level gallery (existing rows,
--                          also the storefront fallback when a
--                          variant has no images of its own)
--   variant_id = <uuid> -> that variant's own gallery
-- Nothing else about product_images changes — same bucket, same
-- RLS, same uploader, same columns.
-- ============================================================

alter table product_images
  add column if not exists variant_id uuid references product_variants(id) on delete cascade;

create index if not exists idx_product_images_variant on product_images(variant_id, sort_order);

-- The old constraint ("one primary image per product_id") didn't
-- account for variant_id and would incorrectly block a variant from
-- having its own primary image once one product-level primary
-- already exists. Replace it with two scoped constraints instead of
-- widening it to (product_id, variant_id) directly, because Postgres
-- treats NULL <> NULL in a unique index — a single combined index
-- would let multiple product-level (variant_id IS NULL) primaries
-- slip through.
drop index if exists uq_product_images_one_primary;

create unique index if not exists uq_product_images_one_primary_product
  on product_images(product_id)
  where is_primary and variant_id is null;

create unique index if not exists uq_product_images_one_primary_variant
  on product_images(variant_id)
  where is_primary and variant_id is not null;
