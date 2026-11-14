-- ============================================================
-- EIFA COUTURE — Returns & exchanges (Phase D)
-- ============================================================
-- Requires 20261114140000 (Phase B: order_returns columns, unique
-- open-return index, returns_insert_own dropped) and 0018 (refunds).
-- Re-runnable.
--
-- 1. order_returns.refund_id links a return to the refund that paid
--    it out, so a retried "Mark refunded" can never refund twice.
-- 2. request_return(): customer request. Ownership, delivered, paid,
--    return window, item, quantity, exchange variant + stock are all
--    checked under an order-row lock. Service-role only.
-- 3. admin_update_return(): the only way a return changes status.
--    Enforces the transition map, restocks on request, takes stock
--    for the exchange piece, writes the history row. Service-role only.
-- 4. The direct admin UPDATE policy on order_returns is dropped, so
--    nothing can skip the transition rules.

alter table order_returns
  add column if not exists refund_id uuid references refunds(id) on delete set null;

drop policy if exists "returns_update_admin" on order_returns;

-- ------------------------------------------------------------
-- request_return()
-- ------------------------------------------------------------
create or replace function request_return(
  p_order_id uuid,
  p_user_id uuid,
  p_order_item_id uuid,
  p_quantity int,
  p_reason text,
  p_details text default null,
  p_is_exchange boolean default false,
  p_exchange_size text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_item record;
  v_window int;
  v_reason text := nullif(left(trim(coalesce(p_reason, '')), 200), '');
  v_details text := nullif(left(trim(coalesce(p_details, '')), 1000), '');
  v_already int;
  v_variant uuid;
  v_available int;
  v_return_id uuid;
begin
  select id, user_id, order_number, status, payment_status, delivered_at
  into v_order
  from orders
  where id = p_order_id
  for update;

  -- Same error for "missing" and "someone else's" so ids can't be probed.
  if v_order.id is null or v_order.user_id is distinct from p_user_id then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;

  if v_order.status <> 'delivered' or v_order.delivered_at is null then
    raise exception 'order_not_delivered' using errcode = '22023';
  end if;

  if v_order.payment_status not in ('paid', 'partially_refunded') then
    raise exception 'order_not_paid' using errcode = '22023';
  end if;

  select return_window_days into v_window from store_settings limit 1;
  v_window := coalesce(v_window, 7);

  -- Window closes at the end of the Nth day after delivery (IST).
  if now() >= (((v_order.delivered_at at time zone 'Asia/Kolkata')::date + v_window + 1)::timestamp
               at time zone 'Asia/Kolkata') then
    raise exception 'return_window_closed' using errcode = '22023';
  end if;

  if v_reason is null then
    raise exception 'reason_required' using errcode = '22023';
  end if;

  select id, product_id, size, color_name, quantity, name
  into v_item
  from order_items
  where id = p_order_item_id and order_id = p_order_id;

  if v_item.id is null then
    raise exception 'item_not_found' using errcode = 'P0002';
  end if;

  if p_quantity is null or p_quantity < 1 or p_quantity > v_item.quantity then
    raise exception 'invalid_quantity' using errcode = '22023';
  end if;

  if exists (
    select 1 from order_returns
    where order_item_id = p_order_item_id
      and status in ('requested', 'approved', 'picked_up', 'received')
  ) then
    raise exception 'return_already_open' using errcode = '22023';
  end if;

  -- Completed returns/exchanges count against what was bought.
  select coalesce(sum(quantity), 0) into v_already
  from order_returns
  where order_item_id = p_order_item_id and status in ('refunded', 'exchanged');

  if v_already + p_quantity > v_item.quantity then
    raise exception 'quantity_exceeds_purchased' using errcode = '22023';
  end if;

  if p_is_exchange then
    if p_exchange_size is null or length(trim(p_exchange_size)) = 0 then
      raise exception 'exchange_size_required' using errcode = '22023';
    end if;

    select id into v_variant
    from product_variants
    where product_id = v_item.product_id
      and size = trim(p_exchange_size)
      and color_name = v_item.color_name
      and is_active;

    if v_variant is null then
      raise exception 'exchange_variant_unavailable' using errcode = '22023';
    end if;

    select quantity - reserved into v_available from inventory where variant_id = v_variant;
    if coalesce(v_available, 0) < p_quantity then
      raise exception 'exchange_out_of_stock' using errcode = '22023';
    end if;
  end if;

  insert into order_returns (
    order_item_id, order_id, user_id, status, reason, details, quantity,
    is_exchange, exchange_variant_id, exchange_size
  ) values (
    p_order_item_id, p_order_id, p_user_id, 'requested', v_reason, v_details, p_quantity,
    coalesce(p_is_exchange, false), v_variant,
    case when p_is_exchange then trim(p_exchange_size) else null end
  )
  returning id into v_return_id;

  insert into order_status_history (
    order_id, event_type, previous_status, new_status, actor_type, actor_id, notes
  ) values (
    p_order_id, 'return_requested', null, null, 'customer', p_user_id,
    case when p_is_exchange then 'Exchange' else 'Return' end
      || ' requested for ' || v_item.name || ' (x' || p_quantity || '): ' || v_reason
  );

  return jsonb_build_object(
    'id', v_return_id,
    'order_number', v_order.order_number,
    'status', 'requested'
  );
end;
$$;

revoke all on function request_return(uuid, uuid, uuid, int, text, text, boolean, text) from public;
revoke all on function request_return(uuid, uuid, uuid, int, text, text, boolean, text) from anon, authenticated;
grant execute on function request_return(uuid, uuid, uuid, int, text, text, boolean, text) to service_role;

-- ------------------------------------------------------------
-- admin_update_return()
-- ------------------------------------------------------------
create or replace function admin_update_return(
  p_return_id uuid,
  p_admin_id uuid,
  p_to return_status,
  p_notes text default null,
  p_restock boolean default false,
  p_refund_amount numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_order_id uuid;
  v_order record;
  v_ret record;
  v_variant uuid;
  v_notes text := nullif(left(trim(coalesce(p_notes, '')), 500), '');
  v_ok boolean;
  v_taken int;
begin
  select role::text into v_role from profiles where id = p_admin_id;
  if v_role is null or v_role not in ('admin', 'superadmin') then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  select order_id into v_order_id from order_returns where id = p_return_id;
  if v_order_id is null then
    raise exception 'return_not_found' using errcode = 'P0002';
  end if;

  -- Lock order first, then the return (request_return locks the same way).
  select id, order_number into v_order from orders where id = v_order_id for update;

  select r.id, r.status, r.is_exchange, r.quantity, r.exchange_variant_id, r.order_item_id
  into v_ret
  from order_returns r
  where r.id = p_return_id
  for update;

  v_ok := case v_ret.status
    when 'requested' then p_to in ('approved', 'rejected')
    when 'approved'  then p_to in ('picked_up', 'rejected')
    when 'picked_up' then p_to = 'received'
    when 'received'  then p_to in ('refunded', 'exchanged')
    else false
  end;
  if not v_ok then
    raise exception 'invalid_transition' using errcode = '22023';
  end if;

  if p_to = 'exchanged' and not v_ret.is_exchange then
    raise exception 'not_an_exchange' using errcode = '22023';
  end if;

  if p_to = 'rejected' and v_notes is null then
    raise exception 'rejection_note_required' using errcode = '22023';
  end if;

  if p_to = 'refunded' and (p_refund_amount is null or p_refund_amount <= 0) then
    raise exception 'invalid_refund_amount' using errcode = '22023';
  end if;

  -- Back on the shelf only when the admin says the piece is sellable.
  if p_to = 'received' and coalesce(p_restock, false) then
    select variant_id into v_variant from order_items where id = v_ret.order_item_id;
    if v_variant is not null then
      update inventory set quantity = quantity + v_ret.quantity where variant_id = v_variant;
    end if;
  end if;

  -- The replacement leaves the shelf when it ships.
  if p_to = 'exchanged' then
    if v_ret.exchange_variant_id is null then
      raise exception 'exchange_variant_unavailable' using errcode = '22023';
    end if;
    update inventory
       set quantity = quantity - v_ret.quantity
     where variant_id = v_ret.exchange_variant_id
       and quantity - reserved >= v_ret.quantity;
    get diagnostics v_taken = row_count;
    if v_taken = 0 then
      raise exception 'exchange_out_of_stock' using errcode = '22023';
    end if;
  end if;

  update order_returns
     set status = p_to,
         admin_notes = coalesce(v_notes, admin_notes),
         refund_amount = case when p_to = 'refunded' then p_refund_amount else refund_amount end,
         resolved_at = case when p_to in ('rejected', 'refunded', 'exchanged') then now() else resolved_at end
   where id = p_return_id;

  insert into order_status_history (
    order_id, event_type, previous_status, new_status, actor_type, actor_id, notes
  ) values (
    v_order_id, 'return_' || p_to::text, null, null, 'admin', p_admin_id, v_notes
  );

  return jsonb_build_object(
    'id', p_return_id,
    'order_id', v_order_id,
    'order_number', v_order.order_number,
    'status', p_to
  );
end;
$$;

revoke all on function admin_update_return(uuid, uuid, return_status, text, boolean, numeric) from public;
revoke all on function admin_update_return(uuid, uuid, return_status, text, boolean, numeric) from anon, authenticated;
grant execute on function admin_update_return(uuid, uuid, return_status, text, boolean, numeric) to service_role;
