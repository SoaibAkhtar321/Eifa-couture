-- Phase 7: admin-editable lead images for the homepage / audience
-- Women, Men and Accessories panels. NULL = use the built-in default
-- image (see src/lib/audience-content.ts), so nothing breaks if the
-- owner never uploads one. Idempotent.
alter table store_settings
  add column if not exists panel_image_women       text,
  add column if not exists panel_image_men         text,
  add column if not exists panel_image_accessories text;
