-- ============================================================
-- EIFA COUTURE — Migration 0019
-- Phase 10 (Financial Dashboard): capture Razorpay payment method
-- ============================================================
-- Purely additive. Adds a nullable `payment_method` column to
-- `orders` so future reporting (Payment Method Analytics on
-- /admin/finance) can break revenue down by UPI / card / netbanking /
-- wallet / EMI / other. Populated from Razorpay's `payment.entity`
-- object, which is already delivered on every `payment.captured`
-- webhook — no new Razorpay API call, no change to the checkout,
-- verification, or webhook control flow. This migration only touches
-- schema + `mark_order_paid()`'s persistence step.
--
-- Card sub-type: Razorpay's top-level `method` field only says
-- "card" — it does not distinguish credit vs. debit. That
-- distinction lives in the same payload at `payment.entity.card.type`
-- ('credit' | 'debit' | 'prepaid'), so the webhook route reads that
-- too and this column stores the more specific value
-- ('credit_card' / 'debit_card') when available, falling back to the
-- raw Razorpay method name otherwise (upi / netbanking / wallet /
-- emi / card / other).
--
-- Incidental fix bundled in (documented, not silently done): the
-- existing verify and webhook routes already call mark_order_paid()
-- with a `p_actor_type` argument that the function (as of 0016) does
-- not declare. Since PostgREST rejects RPC calls with unrecognized
-- named parameters, every real settlement call would fail against
-- the function as it stood. Because this migration has to
-- CREATE OR REPLACE that function anyway to add p_payment_method,
-- p_actor_type is added here too (accepted, currently unused/
-- unstored — no order_status_history table exists in these
-- migrations to write it to, and creating one is out of scope for
-- this change). This restores the pre-existing call sites to working
-- order without altering any control flow.
-- ============================================================

alter table orders
  add column if not exists payment_method text;

comment on column orders.payment_method is
  'Razorpay payment method at settlement time (upi, netbanking, wallet, '
  'emi, credit_card, debit_card, card, other). Nullable — only ever set '
  'once a payment actually settles. Populated additively by '
  'mark_order_paid(); existing checkout/verification/webhook control '
  'flow is unchanged. See migration 0019.';

create index if not exists idx_orders_payment_method
  on orders(payment_method) where payment_method is not null;

-- ------------------------------------------------------------
-- mark_order_paid() — additive: p_payment_method and p_actor_type
-- are both new optional parameters (defaulted, so any caller that
-- omits them behaves exactly as before). Behavior is otherwise
-- byte-for-byte identical to the 0016 version.
--
-- Backfill behavior: if this call arrives for an order that's
-- already marked paid (the idempotent "already_processed" branch —
-- e.g. the client verify call raced the webhook and lost), and this
-- call carries a non-null payment method while the stored one is
-- still null, we opportunistically fill it in. This is what lets
-- payment_method get captured reliably regardless of whether the
-- webhook (which has the method) or the verify route (which does
-- not) settles the order first.
-- ------------------------------------------------------------
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
begin
  select id, order_number, payment_status, status, stock_settled_at, payment_method
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

  return jsonb_build_object(
    'id', v_order.id, 'order_number', v_order.order_number,
    'status', 'confirmed', 'payment_status', 'paid', 'already_processed', false,
    'needs_stock_review', v_shortfall
  );
end;
$$;

revoke all on function mark_order_paid(uuid, text, text, text, text) from public;
grant execute on function mark_order_paid(uuid, text, text, text, text) to service_role;

-- Drop the old 3-arg overload signature's grants are irrelevant since
-- CREATE OR REPLACE on the same name+arg-types replaces in place when
-- the parameter list is extended with defaults on the *same*
-- function identity only if Postgres treats it as the same overload.
-- Postgres identifies functions by name + input arg *types*, and
-- adding new defaulted trailing params to an existing function is a
-- signature change (new overload), so the old 3-arg version remains
-- callable side-by-side unless explicitly dropped. Drop it so there
-- is exactly one mark_order_paid to avoid ambiguity/confusion for
-- future callers.
drop function if exists mark_order_paid(uuid, text, text);
