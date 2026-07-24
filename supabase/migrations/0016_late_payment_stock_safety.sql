-- ============================================================
-- EIFA COUTURE — Migration 0016
-- Phase 7: late-payment stock safety
-- ============================================================
-- Gap this closes:
--   mark_order_paid() (0015) always converted an order's RESERVED
--   stock into a real deduction, assuming that reservation was still
--   intact. That's true for the common case (customer pays within
--   the checkout flow), but two existing, already-supported paths
--   release an order's reservation back to the shared pool while
--   leaving the order retryable:
--     - payment.failed webhook -> release_order_reservation()
--       (declined card; order stays 'pending', customer can retry)
--     - release_stale_reservations() 30-minute sweep
--       (idle checkout; order becomes 'cancelled', but the
--       order-confirmation page still offers Retry Payment for it)
--   If either retry later succeeds, the previously-reserved units are
--   no longer reliably "ours" — they may have been sold to another
--   customer in the meantime. The old mark_order_paid() decremented
--   inventory.quantity unconditionally regardless, which can oversell.
--
-- Fix: mark_order_paid() now branches on whether stock_settled_at was
-- already set when payment succeeded.
--   - NULL (still actively reserved): unchanged fast path — convert
--     reservation straight into deduction, exactly as in 0015.
--   - NOT NULL (reservation already released earlier): re-check live
--     availability per item under lock and deduct only what's
--     actually available. The order is still marked paid — a
--     captured payment must never be silently discarded — but if any
--     item couldn't be fully covered, `needs_stock_review` is set so
--     ops can reconcile (restock, backorder, or refund the shortfall)
--     instead of the system quietly overselling.
--
-- No API contract break: mark_order_paid()'s existing callers
-- (verify route, webhook route) only read the fields they already
-- used; `needs_stock_review` is an additive field in the returned
-- jsonb.
-- ============================================================

alter table orders
  add column if not exists needs_stock_review boolean not null default false;

comment on column orders.needs_stock_review is
  'Set true by mark_order_paid() when a payment settled after this '
  'order''s stock reservation had already been released (declined-card '
  'retry, or retry after the 30-minute idle timeout) and current stock '
  'could not fully cover the order. Ops should reconcile manually.';

create or replace function mark_order_paid(
  p_order_id uuid,
  p_razorpay_payment_id text,
  p_razorpay_signature text
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
begin
  select id, order_number, payment_status, status, stock_settled_at
  into v_order
  from orders
  where id = p_order_id
  for update;

  if v_order.id is null then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;

  if v_order.payment_status = 'paid' then
    -- Already processed by an earlier call (client verify + webhook
    -- racing each other, or a redelivered webhook). No-op.
    return jsonb_build_object(
      'id', v_order.id, 'order_number', v_order.order_number,
      'status', 'confirmed', 'payment_status', 'paid', 'already_processed', true,
      'needs_stock_review', false
    );
  end if;

  if v_order.payment_status = 'refunded' then
    raise exception 'order_already_refunded' using errcode = '22023';
  end if;

  if p_razorpay_payment_id is null or length(trim(p_razorpay_payment_id)) = 0 then
    raise exception 'missing_payment_id' using errcode = '22023';
  end if;

  if v_order.stock_settled_at is null then
    -- Fast path (unchanged from 0015): stock is still actively
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
    -- Late-settlement path: this order's reservation was already
    -- released back to the shared pool before this payment succeeded
    -- (declined-card retry, or a retry after the stale-reservation
    -- sweep). Those units aren't reliably ours anymore, so re-check
    -- live availability per item rather than blindly decrementing.
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
        needs_stock_review = v_shortfall
    where id = p_order_id;

  return jsonb_build_object(
    'id', v_order.id, 'order_number', v_order.order_number,
    'status', 'confirmed', 'payment_status', 'paid', 'already_processed', false,
    'needs_stock_review', v_shortfall
  );
end;
$$;

revoke all on function mark_order_paid(uuid, text, text) from public;
grant execute on function mark_order_paid(uuid, text, text) to service_role;
