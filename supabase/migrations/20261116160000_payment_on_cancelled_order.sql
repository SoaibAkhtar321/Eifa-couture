-- ============================================================
-- EIFA COUTURE — Payment arriving for a cancelled order
-- ============================================================
-- Safe to run more than once. Paste into the Supabase SQL Editor.
--
-- Problem: if a customer (or admin) cancelled an order and a Razorpay
-- payment for it still went through (payment window left open in
-- another tab), mark_order_paid() flipped the order back to
-- 'confirmed' and took stock, even though the customer had cancelled.
--
-- This migration:
--  1. mark_order_paid(): for an order cancelled by the customer or an
--     admin, records the payment but keeps the order CANCELLED, leaves
--     stock alone, and returns cancelled_order_paid = true so the API
--     can refund it automatically. System-expired orders stay
--     retryable exactly as before.
--  2. mark_order_paid(): the already-paid no-op now reports the order's
--     real status instead of always 'confirmed'.
--  3. mark_order_paid(): restores the 'Payment successful' and
--     'Confirmed' order-timeline entries, which stopped being written
--     when migration 0019 re-based the function on 0016.
--  4. notify_on_order_change(): admins get "Payment received for a
--     cancelled order" instead of a misleading "New order received".

create or replace function mark_order_paid(
  p_order_id uuid,
  p_razorpay_payment_id text,
  p_razorpay_signature text,
  p_payment_method text default null,
  p_actor_type text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_item record;
  v_inv record;
  v_available int;
  v_deduct int;
  v_shortfall boolean := false;
  v_actor text := case when p_actor_type in ('customer', 'admin', 'system', 'webhook')
                       then p_actor_type else 'system' end;
begin
  select id, order_number, payment_status, status, cancelled_by, stock_settled_at, payment_method
  into v_order
  from orders
  where id = p_order_id
  for update;

  if v_order.id is null then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;

  if v_order.payment_status = 'paid' then
    -- Already processed by an earlier call (client verify + webhook
    -- racing each other, or a redelivered webhook). No-op on order
    -- state, but opportunistically backfill payment_method if this
    -- call has one and the stored value is still empty.
    if p_payment_method is not null and v_order.payment_method is null then
      update orders set payment_method = p_payment_method where id = p_order_id;
    end if;

    return jsonb_build_object(
      'id', v_order.id, 'order_number', v_order.order_number,
      'status', v_order.status, 'payment_status', 'paid', 'already_processed', true,
      'needs_stock_review', false
    );
  end if;

  if v_order.payment_status = 'refunded' then
    raise exception 'order_already_refunded' using errcode = '22023';
  end if;

  if p_razorpay_payment_id is null or length(trim(p_razorpay_payment_id)) = 0 then
    raise exception 'missing_payment_id' using errcode = '22023';
  end if;

  -- A payment can arrive for an order the customer or an admin has
  -- ALREADY cancelled (e.g. the Razorpay window was still open in
  -- another tab). Keep the order cancelled and leave stock alone — it
  -- was released when the order was cancelled — but record the payment
  -- so it can be refunded. The caller sees 'cancelled_order_paid' and
  -- starts the refund. (System-expired orders are NOT matched here:
  -- those stay retryable, as before.)
  if v_order.status = 'cancelled' and v_order.cancelled_by in ('customer', 'admin') then
    update orders
      set payment_status = 'paid',
          razorpay_payment_id = p_razorpay_payment_id,
          razorpay_signature = p_razorpay_signature,
          payment_verified_at = now(),
          stock_settled_at = coalesce(v_order.stock_settled_at, now()),
          payment_method = coalesce(p_payment_method, v_order.payment_method)
      where id = p_order_id;

    insert into order_status_history (
      order_id, event_type, previous_status, new_status, actor_type, notes
    ) values (
      p_order_id, 'payment_after_cancel', null, null, v_actor,
      'Payment received after the order was cancelled. It is being refunded.'
    );

    return jsonb_build_object(
      'id', v_order.id, 'order_number', v_order.order_number,
      'status', 'cancelled', 'payment_status', 'paid', 'already_processed', false,
      'needs_stock_review', false, 'cancelled_order_paid', true
    );
  end if;

  if v_order.stock_settled_at is null then
    -- Fast path (unchanged from 0015/0016): stock is still actively
    -- reserved for this order from create_order()'s Pass 2. Convert
    -- the reservation straight into a deduction.
    for v_item in
      select variant_id, quantity
      from order_items
      where order_id = p_order_id and variant_id is not null
    loop
      update inventory
        set quantity = greatest(quantity - v_item.quantity, 0),
            reserved = greatest(reserved - v_item.quantity, 0)
        where variant_id = v_item.variant_id;
    end loop;
  else
    -- Late-settlement path (unchanged from 0016): this order's
    -- reservation was already released back to the shared pool
    -- before this payment succeeded. Re-check live availability per
    -- item rather than blindly decrementing.
    for v_item in
      select variant_id, quantity
      from order_items
      where order_id = p_order_id and variant_id is not null
    loop
      select quantity, reserved into v_inv
      from inventory
      where variant_id = v_item.variant_id
      for update;

      v_available := greatest(coalesce(v_inv.quantity, 0) - coalesce(v_inv.reserved, 0), 0);
      v_deduct := least(v_available, v_item.quantity);

      if v_deduct > 0 then
        update inventory
          set quantity = greatest(quantity - v_deduct, 0)
          where variant_id = v_item.variant_id;
      end if;

      if v_deduct < v_item.quantity then
        v_shortfall := true;
      end if;
    end loop;
  end if;

  update orders
    set payment_status = 'paid',
        status = 'confirmed',
        razorpay_payment_id = p_razorpay_payment_id,
        razorpay_signature = p_razorpay_signature,
        payment_verified_at = now(),
        stock_settled_at = coalesce(v_order.stock_settled_at, now()),
        needs_stock_review = v_shortfall,
        payment_method = coalesce(p_payment_method, v_order.payment_method)
    where id = p_order_id;

  -- Timeline entries (written by the 0017 version, dropped when 0019
  -- re-based the function on 0016): the payment itself, then the
  -- order moving to Confirmed.
  insert into order_status_history (
    order_id, event_type, previous_status, new_status, actor_type
  ) values (
    p_order_id, 'payment_successful', null, null, v_actor
  );

  if v_order.status is distinct from 'confirmed' then
    insert into order_status_history (
      order_id, event_type, previous_status, new_status, actor_type
    ) values (
      p_order_id, 'status_change', v_order.status, 'confirmed', v_actor
    );
  end if;

  return jsonb_build_object(
    'id', v_order.id, 'order_number', v_order.order_number,
    'status', 'confirmed', 'payment_status', 'paid', 'already_processed', false,
    'needs_stock_review', v_shortfall
  );
end;
$$;

revoke all on function mark_order_paid(uuid, text, text, text, text) from public;
revoke all on function mark_order_paid(uuid, text, text, text, text) from anon, authenticated;
grant execute on function mark_order_paid(uuid, text, text, text, text) to service_role;

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
      if new.status = 'cancelled' then
        -- Money arrived for an order that was already cancelled.
        perform notify_admins(
          'Payment received for a cancelled order',
          new.order_number || ' was paid after it was cancelled. An automatic refund is being issued;'
            || ' check the Refund panel if it does not go through.',
          v_admin_link, new.id,
          'admin:order:' || new.id::text || ':paid-after-cancel'
        );
      else
        perform notify_admins(
          'New order received',
          new.order_number || ' — ₹' || trim(to_char(new.total, 'FM9999999990.00')) || ' (paid).',
          v_admin_link, new.id,
          'admin:order:' || new.id::text || ':paid'
        );
      end if;
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
