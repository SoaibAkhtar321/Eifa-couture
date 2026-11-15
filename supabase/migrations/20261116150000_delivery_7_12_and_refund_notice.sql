-- ============================================================
-- EIFA COUTURE — Delivery time 7–12 days + refund-after-verification notice
-- 1. store_settings: delivery estimate 7–12 days (default + current row)
-- 2. In-app return notifications: say the refund is issued once the
--    store has received and verified the item
-- Safe to run more than once.
-- ============================================================

-- ---------- 1. DELIVERY ESTIMATE ----------
alter table store_settings alter column delivery_days_min set default 7;
alter table store_settings alter column delivery_days_max set default 12;
update store_settings set delivery_days_min = 7, delivery_days_max = 12;

-- ---------- 2. RETURN NOTIFICATIONS ----------
-- Same function as migration 20261114170000, with the wording changed.
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
          || '. We will review it shortly.'
          || case when new.is_exchange then ''
                  else ' Your refund will be issued to your original payment method once we have received the item and verified it.' end,
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
                  else 'Once we have verified it, your refund will be issued to your original payment method.' end;
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

