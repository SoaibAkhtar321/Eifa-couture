-- ============================================================
-- EIFA COUTURE — Order lifecycle foundation (Phase B)
-- ============================================================
-- Schema groundwork for: estimated delivery, customer self-cancel,
-- returns/exchanges, and in-app notifications. Additive and
-- re-runnable. No behaviour changes for existing flows.
--
-- Writes to the new cancel/return/notification data happen from
-- server routes (service role) or SECURITY DEFINER RPCs added in
-- later phases — customers get no direct write path.

-- ------------------------------------------------------------
-- 1. Orders: estimated delivery + cancellation record
-- ------------------------------------------------------------
alter table orders add column if not exists estimated_delivery_date date;
alter table orders add column if not exists cancelled_at timestamptz;
alter table orders add column if not exists cancelled_by text;
alter table orders add column if not exists cancel_reason text;

do $$ begin
  alter table orders add constraint orders_cancelled_by_check
    check (cancelled_by is null or cancelled_by in ('customer', 'admin', 'system'));
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- 2. Store settings: delivery estimate + return window (admin-tunable)
-- ------------------------------------------------------------
-- store_settings is publicly readable, so only non-sensitive policy
-- numbers live here. Alert contacts (email/WhatsApp) go in env vars.
alter table store_settings add column if not exists delivery_days_min int not null default 4;
alter table store_settings add column if not exists delivery_days_max int not null default 7;
alter table store_settings add column if not exists return_window_days int not null default 7;

do $$ begin
  alter table store_settings add constraint store_settings_delivery_days_check
    check (delivery_days_min >= 0 and delivery_days_max >= delivery_days_min);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table store_settings add constraint store_settings_return_window_check
    check (return_window_days between 0 and 60);
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- 3. Returns / exchanges: richer rows
-- ------------------------------------------------------------
alter table order_returns add column if not exists order_id uuid references orders(id) on delete cascade;
alter table order_returns add column if not exists quantity int not null default 1 check (quantity > 0);
alter table order_returns add column if not exists details text;
alter table order_returns add column if not exists image_urls text[] not null default '{}';
alter table order_returns add column if not exists admin_notes text;
alter table order_returns add column if not exists exchange_size text;

-- Backfill order_id from the item, then lock it down.
update order_returns r
   set order_id = oi.order_id
  from order_items oi
 where oi.id = r.order_item_id
   and r.order_id is null;

alter table order_returns alter column order_id set not null;

create index if not exists idx_returns_order on order_returns(order_id);

-- One open return/exchange per order item at a time.
create unique index if not exists uq_returns_one_open_per_item
  on order_returns(order_item_id)
  where status in ('requested', 'approved', 'picked_up', 'received');

-- Customers can no longer insert returns directly: eligibility
-- (delivered, inside the window, quantity) is enforced by a server
-- route in Phase D. Reads stay as-is.
drop policy if exists "returns_insert_own" on order_returns;

-- ------------------------------------------------------------
-- 4. Notifications: order link, dedupe, tighter customer access
-- ------------------------------------------------------------
alter table notifications add column if not exists order_id uuid references orders(id) on delete cascade;
alter table notifications add column if not exists dedupe_key text;

-- Webhook replays / retries must not create duplicate notifications.
create unique index if not exists uq_notifications_dedupe
  on notifications(user_id, dedupe_key)
  where dedupe_key is not null;

create index if not exists idx_notifications_order on notifications(order_id)
  where order_id is not null;

-- Customers may only flip is_read on their own rows (not edit titles
-- or messages), and may delete their own.
revoke update on notifications from authenticated;
grant update (is_read) on notifications to authenticated;

drop policy if exists "notifications_delete_own" on notifications;
create policy "notifications_delete_own" on notifications for delete
  using (auth.uid() = user_id);
