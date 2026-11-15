-- ============================================================
-- EIFA COUTURE — No shipping charge on any order
-- ============================================================
-- create_order() charges shipping from store_settings. Delivery is free
-- on every order, so make both settings say so. Re-runnable.

update public.store_settings
   set shipping_flat_rate = 0,
       shipping_free_threshold = null
 where singleton;

-- Check (read-only):
--   select shipping_flat_rate, shipping_free_threshold from public.store_settings;
