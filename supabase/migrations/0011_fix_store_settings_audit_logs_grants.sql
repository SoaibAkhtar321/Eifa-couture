-- ============================================================
-- EIFA COUTURE — Migration 0011
-- Fix: "permission denied" on store_settings / audit_logs
-- ============================================================
-- Root cause: every table created in 0001–0008 picked up its
-- table-level privileges from the one-time bootstrap grant
-- (`grant ... on all tables in schema public to anon, authenticated,
-- service_role`) that Supabase ran when this project was first
-- provisioned. `store_settings` (0009) and `audit_logs` (0010) were
-- created *after* that bootstrap grant ran, so Postgres never
-- granted `anon`/`authenticated` any privilege on them at all. Their
-- RLS policies are correct and were never the problem — RLS only
-- narrows rows on top of privileges a role already has; with zero
-- table-level grant, Postgres rejects the query before RLS is even
-- evaluated, producing exactly "permission denied for table X"
-- (as opposed to the empty-result-set you'd get from an RLS denial).
--
-- Fix: grant the same privileges these tables' policies already
-- assume, then set default privileges so any future table created by
-- this role picks up grants automatically instead of repeating this
-- bug.

-- ---------- STORE_SETTINGS ----------
-- Policy already allows public select + admin-only write; grant the
-- matching table privileges so RLS gets a chance to run.
grant select on store_settings to anon, authenticated;
grant insert, update, delete on store_settings to authenticated;

-- ---------- AUDIT_LOGS ----------
-- Admin-only in both directions (see 0010) — no anon grant needed.
grant select, insert on audit_logs to authenticated;

-- ---------- FUTURE-PROOFING ----------
-- Make sure any table created from here on automatically gets the
-- same baseline grant that 0001–0008 received at project bootstrap,
-- so this class of bug can't recur for the next new table.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
  grant select on tables to anon;
