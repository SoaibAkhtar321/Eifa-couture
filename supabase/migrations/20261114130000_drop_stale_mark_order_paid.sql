-- Remove stale 4-arg mark_order_paid (left over from 0017). Idempotent.
drop function if exists mark_order_paid(uuid, text, text, text);
