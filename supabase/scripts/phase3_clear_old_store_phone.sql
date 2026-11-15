-- EIFA COUTURE — Phase 3: clear the old store phone saved in Admin → Settings.
-- The storefront now reads the phone only from CONTACT_INFO in code, so this
-- stored value is no longer shown anywhere. Clearing it avoids confusion.
-- Preview first:
--   select id, store_phone from store_settings;
-- Then run (re-runnable):
update store_settings set store_phone = null where store_phone is not null;
