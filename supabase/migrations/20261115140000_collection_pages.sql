-- ============================================================
-- EIFA COUTURE — Collection pages
-- ============================================================
-- Admin-created collections (e.g. "Bestsellers", "Eid Edit") now get their
-- own storefront page at /collections/{slug}. `show_in_menu` lets the admin
-- add that page to the header, mobile menu and footer. Safe to run twice.
alter table collections
  add column if not exists show_in_menu boolean not null default false;
