-- ============================================================
-- EIFA COUTURE — Email log / de-duplication (Phase F)
-- ============================================================
-- One row per email we attempt. The unique key means a repeated
-- delivery of the same notification (webhook retry, replay) can never
-- send the same email twice. Rows are written ONLY by the server with
-- the service-role key: RLS is on and there are no policies, and all
-- table privileges are revoked from anon / authenticated.
--
-- Re-runnable. Safe to apply before or after Phase E.

create table if not exists email_events (
  id            uuid primary key default gen_random_uuid(),
  event_key     text not null,                 -- idempotency key (see lib/email/events.ts)
  notification_id uuid,                        -- the notification that triggered it (not an FK: notifications can be deleted)
  recipient     text not null,
  template      text not null,
  status        text not null default 'sending'
                check (status in ('sending', 'sent', 'failed', 'skipped')),
  provider_id   text,                          -- Resend email id
  error         text,
  attempts      int  not null default 1,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists uq_email_events_event_key on email_events (event_key);
create index if not exists idx_email_events_status_created on email_events (status, created_at desc);

alter table email_events enable row level security;
revoke all on table email_events from anon, authenticated;
grant all on table email_events to service_role;
