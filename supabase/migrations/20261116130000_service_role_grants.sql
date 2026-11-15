-- ============================================================
-- EIFA COUTURE — Migration 20261116130000
-- Fix: server (service_role) gets "permission denied" on tables
-- ============================================================
-- Symptom: the notifications webhook answered "notification not
-- found" because the service-role client could not SELECT from
-- public.notifications (has_table_privilege(...) = false). Server
-- code swallowed the permission error as an empty result.
--
-- Same root cause as migration 0011: tables created after the
-- project's one-time bootstrap grant never received privileges for
-- service_role. service_role is the server-only role that bypasses
-- RLS, so granting it full table access is the Supabase default.
-- anon / authenticated are NOT touched here.
--
-- Idempotent: safe to run more than once.

grant usage on schema public to service_role;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Future tables / sequences created by the migration role get the
-- same grant automatically.
alter default privileges in schema public
  grant all on tables to service_role;

alter default privileges in schema public
  grant all on sequences to service_role;
