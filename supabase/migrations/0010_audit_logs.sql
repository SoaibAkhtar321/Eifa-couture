-- ============================================================
-- EIFA COUTURE — Migration 0010
-- Admin Audit Log: append-only record of admin write actions
-- ============================================================
-- Backs the Admin Audit Log module: a read-only feed of who did
-- what (e.g. "Admin A edited Product X"). Append-only by design — no
-- update/delete policy is defined, so once a row lands it stays,
-- same spirit as an audit trail needing to be tamper-resistant even
-- against the admins it's logging.
--
-- `actor_id` is nullable + `on delete set null` rather than cascading,
-- so a deleted admin profile doesn't erase history it authored.
-- `actor_name`/`actor_email` are captured at write time (not joined
-- live from `profiles`) so the log stays accurate even if the actor's
-- display name changes later or their profile is removed.

create table if not exists audit_logs (
  id           uuid primary key default gen_random_uuid(),

  actor_id     uuid references profiles(id) on delete set null,
  actor_name   text not null,
  actor_email  text,

  action       text not null,        -- e.g. 'create', 'update', 'delete', 'status_change'
  entity_type  text not null,        -- e.g. 'product', 'coupon', 'order', 'homepage_cms'
  entity_id    text,
  entity_label text not null,        -- human-readable, e.g. 'Product X', 'Coupon Y'

  detail       text,                 -- e.g. 'Pending → Shipped'
  metadata     jsonb,

  created_at   timestamptz not null default now()
);

create index if not exists idx_audit_logs_created_at on audit_logs (created_at desc);
create index if not exists idx_audit_logs_entity on audit_logs (entity_type, entity_id);

alter table audit_logs enable row level security;

-- Admin-only in both directions: this is an internal record of admin
-- activity, so unlike `store_settings` there's no public-read case.
-- No update/delete policy is intentionally omitted — inserts and
-- reads only, so entries can't be edited or removed via the API,
-- including by admins themselves.
create policy "audit_logs_admin_read" on audit_logs for select using (is_admin());
create policy "audit_logs_admin_insert" on audit_logs for insert with check (is_admin());
