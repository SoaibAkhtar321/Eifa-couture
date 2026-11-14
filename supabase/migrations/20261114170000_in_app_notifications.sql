-- ============================================================
-- EIFA COUTURE — In-app notifications (Phase E)
-- ============================================================
-- Requires 20261114140000 (notifications.order_id / dedupe_key,
-- column-level UPDATE grant) and 20261114160000 (order_returns).
-- Additive and re-runnable.
--
-- Notifications are written by DATABASE TRIGGERS, not by app code,
-- because order status changes reach the database from several
-- places: the admin status dropdown (browser -> orders), the
-- Razorpay webhook / verify route (mark_order_paid), customer cancel,
-- refund finalisation and the returns RPCs. A trigger sees all of
-- them, so a notification can never be forgotten by one path.
--
-- Failure isolation: every trigger body is wrapped in an exception
-- block. If a notification cannot be written, a WARNING is logged
-- and the order / return update still commits.
--
-- Customers can only read their own rows, flip is_read, and delete
-- their own rows (Phase B grants). They can never create or edit
-- notification text.

-- ------------------------------------------------------------
-- 1. Helpers (service-role / trigger use only)
-- ------------------------------------------------------------
create or replace function notify_user(
  p_user_id   uuid,
  p_title     text,
  p_message   text,
  p_link      text,
  p_order_id  uuid,
  p_dedupe_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    return;
  end if;

  insert into notifications (user_id, type, title, message, link_url, order_id, dedupe_key)
  values (p_user_id, 'order', p_title, coalesce(p_message, ''), p_link, p_order_id, p_dedupe_key)
  on conflict (user_id, dedupe_key) where dedupe_key is not null do nothing;
exception when others then
  raise warning '[notifications] notify_user failed: %', sqlerrm;
end;
$$;

-- Fan an alert out to every admin / superadmin.
create or replace function notify_admins(
  p_title     text,
  p_message   text,
  p_link      text,
  p_order_id  uuid,
  p_dedupe_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid;
begin
  for v_admin in
    select id from profiles where role::text in ('admin', 'superadmin')
  loop
    perform notify_user(v_admin, p_title, p_message, p_link, p_order_id, p_dedupe_key);
  end loop;
exception when others then
  raise warning '[notifications] notify_admins failed: %', sqlerrm;
end;
$$;

revoke all on function notify_user(uuid, text, text, text, uuid, text) from public, anon, authenticated;
revoke all on function notify_admins(text, text, text, uuid, text) from public, anon, authenticated;
grant execute on function notify_user(uuid, text, text, text, uuid, text) to service_role;
grant execute on function notify_admins(text, text, text, uuid, text) to service_role;

-- ------------------------------------------------------------
-- 2. Order changes -> customer notifications + admin alerts
-- ------------------------------------------------------------
create or replace function notify_on_order_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link      text := '/track-order?order=' || new.order_number;
  v_admin_link text := '/admin/orders/' || new.id::text;
  v_title     text;
  v_msg       text;
  v_eta       text;
  v_courier   text;
  v_window    int;
  v_refund_id uuid;
  v_refund_amt numeric;
begin
  begin
    -- ---------------- Status changed ----------------
    if new.status is distinct from old.status then
      v_eta := case
        when new.estimated_delivery_date is not null
          then to_char(new.estimated_delivery_date, 'Dy, DD Mon')
        else null
      end;

      v_title := null;

      if new.status = 'confirmed' then
        v_title := 'Order confirmed';
        v_msg := 'Thank you! Your order ' || new.order_number || ' is confirmed.'
          || case when v_eta is not null then ' Estimated delivery by ' || v_eta || '.' else '' end;

      elsif new.status = 'processing' then
        v_title := 'Your order is being packed';
        v_msg := 'We are carefully packing order ' || new.order_number || '.';

      elsif new.status = 'shipped' then
        v_courier := nullif(trim(coalesce(new.shipping_provider, '')), '');
        v_title := 'Your order has shipped';
        v_msg := 'Order ' || new.order_number || ' is on its way'
          || case when v_courier is not null then ' with ' || v_courier else '' end
          || case when nullif(trim(coalesce(new.tracking_number, '')), '') is not null
                  then ' (AWB ' || trim(new.tracking_number) || ')' else '' end
          || '.'
          || case when v_eta is not null then ' Arrives by ' || v_eta || '.' else '' end;

      elsif new.status = 'out_for_delivery' then
        v_title := 'Out for delivery';
        v_msg := 'Order ' || new.order_number || ' is out for delivery and should reach you soon.';

      elsif new.status = 'delivered' then
        select coalesce(return_window_days, 7) into v_window from store_settings limit 1;
        v_title := 'Order delivered';
        v_msg := 'Order ' || new.order_number || ' has been delivered.'
          || case when coalesce(v_window, 7) > 0
                  then ' Need to return or exchange something? You have ' || coalesce(v_window, 7)
                       || ' days from delivery.'
                  else '' end;

      elsif new.status = 'cancelled' then
        -- Abandoned / failed-payment orders cancelled by the system are
        -- housekeeping, not news: the customer never had a live order.
        if not (coalesce(new.cancelled_by, '') = 'system' and old.payment_status is distinct from 'paid') then
          v_title := 'Order cancelled';
          v_msg := case
            when coalesce(new.cancelled_by, '') = 'customer' then 'Your order ' || new.order_number || ' has been cancelled.'
            else 'Your order ' || new.order_number || ' was cancelled by the store.'
          end
          || case when old.payment_status = 'paid'
                  then ' Your refund will go back to the original payment method.' else '' end;
        end if;

      elsif new.status = 'returned' then
        v_title := 'Return completed';
        v_msg := 'Your return for order ' || new.order_number || ' is complete.';

      elsif new.status = 'refunded' then
        -- When the refund also moved payment_status, the payment branch
        -- below announces it; avoid two near-identical notifications.
        if new.payment_status not in ('refunded', 'partially_refunded') then
          v_title := 'Refund issued';
          v_msg := 'A refund for order ' || new.order_number || ' has been issued.';
        end if;
      end if;

      if v_title is not null then
        perform notify_user(
          new.user_id, v_title, v_msg, v_link, new.id,
          'order:' || new.id::text || ':status:' || new.status::text
        );
      end if;

      -- Admin alert: customer cancelled their own order.
      if new.status = 'cancelled' and coalesce(new.cancelled_by, '') = 'customer' then
        perform notify_admins(
          'Order cancelled by customer',
          new.order_number || ' was cancelled by the customer.'
            || case when old.payment_status = 'paid'
                    then ' Check the Refund panel if the automatic refund did not go through.'
                    else '' end,
          v_admin_link, new.id,
          'admin:order:' || new.id::text || ':cancelled'
        );
      end if;
    end if;

    -- ---------------- Payment settled: new order for the admins ----------------
    if new.payment_status = 'paid' and old.payment_status is distinct from 'paid' then
      perform notify_admins(
        'New order received',
        new.order_number || ' — ₹' || trim(to_char(new.total, 'FM9999999990.00')) || ' (paid).',
        v_admin_link, new.id,
        'admin:order:' || new.id::text || ':paid'
      );
    end if;

    -- ---------------- Refund processed ----------------
    if new.payment_status in ('refunded', 'partially_refunded')
       and old.payment_status is distinct from new.payment_status then

      select id, amount into v_refund_id, v_refund_amt
      from refunds
      where order_id = new.id and status = 'processed'
      order by processed_at desc nulls last, created_at desc
      limit 1;

      -- Refunds for a return are announced by the return trigger instead.
      if v_refund_id is not null
         and not exists (select 1 from order_returns where refund_id = v_refund_id) then
        perform notify_user(
          new.user_id,
          'Refund processed',
          'A refund of ₹' || trim(to_char(v_refund_amt, 'FM9999999990.00')) || ' for order '
            || new.order_number || ' has been processed. It can take 5–7 business days to show in your account.',
          v_link, new.id,
          'order:' || new.id::text || ':refund:' || v_refund_id::text
        );
      end if;
    end if;

    -- ---------------- Tracking details added after shipping ----------------
    if new.status = old.status
       and new.status in ('shipped', 'out_for_delivery')
       and nullif(trim(coalesce(new.tracking_number, '')), '') is not null
       and new.tracking_number is distinct from old.tracking_number then
      v_courier := nullif(trim(coalesce(new.shipping_provider, '')), '');
      perform notify_user(
        new.user_id,
        'Tracking details added',
        'Order ' || new.order_number || ' tracking: '
          || coalesce(v_courier || ' ', '') || 'AWB ' || trim(new.tracking_number) || '.',
        v_link, new.id,
        'order:' || new.id::text || ':tracking:' || trim(new.tracking_number)
      );
    end if;

  exception when others then
    raise warning '[notifications] order trigger failed for %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists trg_orders_notify on orders;
create trigger trg_orders_notify
  after update on orders
  for each row
  when (
    old.status is distinct from new.status
    or old.payment_status is distinct from new.payment_status
    or old.tracking_number is distinct from new.tracking_number
  )
  execute function notify_on_order_change();

-- ------------------------------------------------------------
-- 3. Return / exchange changes -> customer notifications + admin alert
-- ------------------------------------------------------------
create or replace function notify_on_return_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_number text;
  v_noun   text := case when new.is_exchange then 'exchange' else 'return' end;
  v_link   text;
  v_title  text;
  v_msg    text;
begin
  begin
    select order_number into v_order_number from orders where id = new.order_id;
    if v_order_number is null then
      return new;
    end if;
    v_link := '/track-order?order=' || v_order_number;

    -- New request
    if tg_op = 'INSERT' then
      perform notify_user(
        new.user_id,
        initcap(v_noun) || ' request received',
        'We have received your ' || v_noun || ' request for order ' || v_order_number
          || '. We will review it shortly.',
        v_link, new.order_id,
        'return:' || new.id::text || ':requested'
      );

      perform notify_admins(
        'New ' || v_noun || ' request',
        v_order_number || ' — customer requested a ' || v_noun || '.',
        '/admin/orders/' || new.order_id::text, new.order_id,
        'admin:return:' || new.id::text || ':requested'
      );
      return new;
    end if;

    -- Status moved
    if new.status is distinct from old.status then
      v_title := null;

      if new.status = 'approved' then
        v_title := initcap(v_noun) || ' approved';
        v_msg := 'Your ' || v_noun || ' request for order ' || v_order_number
          || ' is approved. We will arrange the pickup.';
      elsif new.status = 'rejected' then
        v_title := initcap(v_noun) || ' request declined';
        v_msg := 'We could not approve your ' || v_noun || ' request for order ' || v_order_number || '.'
          || case when nullif(trim(coalesce(new.admin_notes, '')), '') is not null
                  then ' Reason: ' || trim(new.admin_notes) else '' end;
      elsif new.status = 'picked_up' then
        v_title := initcap(v_noun) || ' picked up';
        v_msg := 'Your item from order ' || v_order_number || ' has been picked up.';
      elsif new.status = 'received' then
        v_title := initcap(v_noun) || ' received';
        v_msg := 'We have received your item from order ' || v_order_number || '. '
          || case when new.is_exchange then 'Your replacement will be shipped shortly.'
                  else 'Your refund will be issued shortly.' end;
      elsif new.status = 'refunded' then
        v_title := 'Refund issued';
        v_msg := 'Your refund'
          || case when new.refund_amount is not null
                  then ' of ₹' || trim(to_char(new.refund_amount, 'FM9999999990.00')) else '' end
          || ' for order ' || v_order_number
          || ' has been issued. It can take 5–7 business days to show in your account.';
      elsif new.status = 'exchanged' then
        v_title := 'Exchange shipped';
        v_msg := 'Your replacement for order ' || v_order_number || ' is on its way.';
      end if;

      if v_title is not null then
        perform notify_user(
          new.user_id, v_title, v_msg, v_link, new.order_id,
          'return:' || new.id::text || ':' || new.status::text
        );
      end if;
    end if;

  exception when others then
    raise warning '[notifications] return trigger failed for %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists trg_order_returns_notify on order_returns;
create trigger trg_order_returns_notify
  after insert or update of status on order_returns
  for each row execute function notify_on_return_change();

-- ------------------------------------------------------------
-- 4. RLS review: make the own-row UPDATE policy explicit
-- ------------------------------------------------------------
-- Phase B already limits UPDATE to the is_read column; the WITH CHECK
-- stops a row from being handed to someone else even in theory.
drop policy if exists "notifications_update_own" on notifications;
create policy "notifications_update_own" on notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 5. Realtime: push new notifications to the bell
-- ------------------------------------------------------------
-- Realtime respects the SELECT policy, so each user only receives
-- their own rows. The app also polls, so this is a nice-to-have.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'notifications'
     ) then
    alter publication supabase_realtime add table notifications;
  end if;
exception when others then
  raise notice 'Could not add notifications to supabase_realtime: %', sqlerrm;
end $$;
