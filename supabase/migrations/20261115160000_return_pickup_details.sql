-- ============================================================
-- EIFA COUTURE — Return pickup details (Phase 1, step 1.3)
-- ============================================================
-- Optional courier details the admin records when approving a return
-- or marking it picked up. Shown to the customer in the order tracker
-- and in the approval / picked-up emails.
--
-- Additive only: three nullable columns. No policy, function or
-- trigger changes (status changes still go through
-- admin_update_return; these columns are written by the admin return
-- route with the service role, like refund_id). Re-runnable.
-- Run this BEFORE deploying the code that reads these columns.

alter table order_returns add column if not exists pickup_courier text;
alter table order_returns add column if not exists pickup_tracking_number text;
alter table order_returns add column if not exists pickup_date date;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'order_returns_pickup_courier_len') then
    alter table order_returns
      add constraint order_returns_pickup_courier_len check (pickup_courier is null or char_length(pickup_courier) <= 80);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'order_returns_pickup_tracking_len') then
    alter table order_returns
      add constraint order_returns_pickup_tracking_len check (pickup_tracking_number is null or char_length(pickup_tracking_number) <= 80);
  end if;
end $$;
