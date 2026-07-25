-- ============================================================
-- EIFA COUTURE — Migration 0017
-- Refund management: partial/full refunds over Razorpay
-- ============================================================
-- Additive only — no existing migration is modified. Introduces:
--   - payment_status gains 'partially_refunded' (full refund still
--     lands on the existing 'refunded' value, so no other code that
--     switches on payment_status needs to change).
--   - a new `refunds` table, one row per refund attempt (not per
--     order), so partial refunds have full history.
--   - two SECURITY DEFINER RPCs, granted to service_role ONLY,
--     mirroring the trust boundary already established by
--     mark_order_paid() / release_order_reservation() in 0015 and the
--     late-payment stock-safety branch added in 0016: Razorpay refund
--     creation is an external HTTP call that can't live inside a
--     single DB transaction, so the flow is split into "reserve
--     intent" (initiate_refund, locks the order row so concurrent
--     refund clicks can't double-spend the captured amount) and
--     "record outcome" (finalize_refund, called after the Razorpay
--     API call returns success or failure).
-- ============================================================

-- ------------------------------------------------------------
-- Schema additions
-- ------------------------------------------------------------

-- Safe to run more than once; ADD VALUE IF NOT EXISTS is idempotent.
-- Referencing this new label inside the function bodies below is
-- fine even in the same migration transaction — plpgsql function
-- bodies are stored as text and the enum literal is only resolved
-- when the function is *called*, not when it's defined.
alter type payment_status add value if not exists 'partially_refunded';

create table if not exists refunds (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references orders(id) on delete cascade,
  razorpay_payment_id text not null,
  -- NULL while a refund is still in flight with Razorpay; set by
  -- finalize_refund() once Razorpay confirms creation.
  razorpay_refund_id  text,
  amount              numeric(10,2) not null check (amount > 0),
  status              text not null default 'processing'
                        check (status in ('processing', 'processed', 'failed')),
  reason              text,
  -- Our own idempotency token, also sent to Razorpay as
  -- X-Razorpay-Idempotency-Key on the refund creation call — belt
  -- and suspenders against a retried request creating two refunds
  -- for the same intent.
  idempotency_key     text not null unique,
  initiated_by        uuid references profiles(id),
  error_message       text,
  created_at          timestamptz not null default now(),
  processed_at        timestamptz
);

-- A successful Razorpay refund id should never map to two of our
-- refund rows.
create unique index if not exists uq_refunds_razorpay_refund_id
  on refunds(razorpay_refund_id) where razorpay_refund_id is not null;

create index if not exists idx_refunds_order_id on refunds(order_id);

alter table refunds enable row level security;

-- A customer can read refunds for their own orders, admins can read
-- all. No insert/update/delete policy is granted to authenticated/
-- anon — writes only ever happen through the two RPCs below via the
-- service-role key, same trust boundary as
-- mark_order_paid()/release_order_reservation().
create policy "refunds_select_own_or_admin" on refunds for select
  using (
    is_admin() or exists (
      select 1 from orders o where o.id = refunds.order_id and o.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- initiate_refund()
-- Locks the order row, validates it's refundable, and reserves the
-- intent by inserting a 'processing' refund row. The order-row lock
-- (FOR UPDATE) is what makes this safe against concurrent refund
-- clicks on the same order — a second call blocks until the first
-- transaction commits, then re-evaluates the already-refunded total
-- against the (now up to date) sum of processing/processed refunds.
-- Service-role only — called from the admin refund API route, before
-- the Razorpay refund API call is made.
-- ------------------------------------------------------------
create or replace function initiate_refund(
  p_order_id uuid,
  p_amount numeric,
  p_reason text,
  p_idempotency_key text,
  p_initiated_by uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_already_committed numeric(10,2);
  v_refundable numeric(10,2);
  v_refund_id uuid;
begin
  select id, order_number, payment_status, payment_provider,
         razorpay_payment_id, total
  into v_order
  from orders
  where id = p_order_id
  for update;

  if v_order.id is null then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;

  if v_order.payment_provider <> 'razorpay' then
    raise exception 'unsupported_payment_provider' using errcode = '22023';
  end if;

  if v_order.razorpay_payment_id is null or length(trim(v_order.razorpay_payment_id)) = 0 then
    raise exception 'missing_payment_id' using errcode = '22023';
  end if;

  if v_order.payment_status not in ('paid', 'partially_refunded') then
    raise exception 'order_not_paid' using errcode = '22023';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid_refund_amount' using errcode = '22023';
  end if;

  -- Sum both 'processing' and 'processed' refunds: a refund still in
  -- flight with Razorpay must count against the refundable balance
  -- too, otherwise two concurrent full-refund clicks (which each
  -- pass through this lock sequentially) would both be allowed to
  -- reserve the full amount before either one's Razorpay call
  -- returns. This function holds the order row lock for its whole
  -- duration, so this select is race-free against other callers.
  select coalesce(sum(amount), 0)
  into v_already_committed
  from refunds
  where order_id = p_order_id and status in ('processing', 'processed');

  v_refundable := v_order.total - v_already_committed;

  if v_refundable <= 0 then
    raise exception 'order_already_refunded' using errcode = '22023';
  end if;

  if p_amount > v_refundable then
    raise exception 'refund_exceeds_captured_amount' using errcode = '22023';
  end if;

  insert into refunds (
    order_id, razorpay_payment_id, amount, status, reason,
    idempotency_key, initiated_by
  ) values (
    p_order_id, v_order.razorpay_payment_id, p_amount, 'processing', p_reason,
    p_idempotency_key, p_initiated_by
  )
  returning id into v_refund_id;

  return jsonb_build_object(
    'refund_id', v_refund_id,
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'razorpay_payment_id', v_order.razorpay_payment_id,
    'amount', p_amount
  );
end;
$$;

revoke all on function initiate_refund(uuid, numeric, text, text, uuid) from public;
grant execute on function initiate_refund(uuid, numeric, text, text, uuid) to service_role;

-- ------------------------------------------------------------
-- finalize_refund()
-- Records the outcome of the Razorpay refund API call. Idempotent:
-- if the refund row is no longer 'processing' (already finalized by
-- an earlier call — e.g. a redelivered webhook racing the API route
-- response), this is a safe no-op that returns the existing state.
-- On success, flips the order to 'refunded' (full) or
-- 'partially_refunded' (partial) based on the running total of
-- processed refunds vs. the order total. Order.status is NOT
-- touched here — restocking/status transitions stay on the existing
-- admin "Status" dropdown (updateOrderStatus in orders-actions.ts),
-- which already has its own restock-on-'refunded' behavior; wiring
-- refunds into that flow automatically is left for a follow-up.
-- ------------------------------------------------------------
create or replace function finalize_refund(
  p_refund_id uuid,
  p_status text,
  p_razorpay_refund_id text default null,
  p_error_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_refund record;
  v_order record;
  v_processed_total numeric(10,2);
  v_new_payment_status payment_status;
begin
  if p_status not in ('processed', 'failed') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;

  select id, order_id, status, amount
  into v_refund
  from refunds
  where id = p_refund_id
  for update;

  if v_refund.id is null then
    raise exception 'refund_not_found' using errcode = 'P0002';
  end if;

  if v_refund.status <> 'processing' then
    -- Already finalized. Idempotent no-op.
    return jsonb_build_object(
      'refund_id', v_refund.id, 'status', v_refund.status, 'already_processed', true
    );
  end if;

  select id, order_number, total, payment_status
  into v_order
  from orders
  where id = v_refund.order_id
  for update;

  if p_status = 'failed' then
    update refunds
      set status = 'failed',
          error_message = p_error_message,
          processed_at = now()
      where id = p_refund_id;

    return jsonb_build_object(
      'refund_id', v_refund.id, 'status', 'failed', 'already_processed', false
    );
  end if;

  if p_razorpay_refund_id is null or length(trim(p_razorpay_refund_id)) = 0 then
    raise exception 'missing_razorpay_refund_id' using errcode = '22023';
  end if;

  update refunds
    set status = 'processed',
        razorpay_refund_id = p_razorpay_refund_id,
        processed_at = now()
    where id = p_refund_id;

  select coalesce(sum(amount), 0)
  into v_processed_total
  from refunds
  where order_id = v_refund.order_id and status = 'processed';

  v_new_payment_status := case
    when v_processed_total >= v_order.total then 'refunded'
    else 'partially_refunded'
  end;

  update orders
    set payment_status = v_new_payment_status
    where id = v_refund.order_id;

  return jsonb_build_object(
    'refund_id', v_refund.id,
    'status', 'processed',
    'already_processed', false,
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'payment_status', v_new_payment_status,
    'total_refunded', v_processed_total
  );
end;
$$;

revoke all on function finalize_refund(uuid, text, text, text) from public;
grant execute on function finalize_refund(uuid, text, text, text) to service_role;