-- ============================================================
-- EIFA COUTURE — Clean up stale guest (anonymous) users
-- ============================================================
-- Guest checkout creates one anonymous auth user per browser. Users
-- that never placed an order are dead weight (and an abuse signal).
-- This function deletes anonymous users that:
--   * are older than p_older_than (default 30 days, minimum 1 day), and
--   * have NO orders (orders.user_id is ON DELETE RESTRICT anyway).
-- Cascades remove their empty profile, cart, wishlist, addresses.
-- Re-runnable. Callable only by the service role / postgres.
-- ============================================================

create or replace function public.cleanup_stale_anonymous_users(
  p_older_than interval default interval '30 days'
)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_deleted integer;
begin
  if p_older_than < interval '1 day' then
    raise exception 'p_older_than must be at least 1 day' using errcode = '22023';
  end if;

  delete from auth.users u
  where u.is_anonymous
    and coalesce(u.last_sign_in_at, u.created_at) < now() - p_older_than
    and not exists (select 1 from public.orders o where o.user_id = u.id);

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.cleanup_stale_anonymous_users(interval) from public, anon, authenticated;
grant execute on function public.cleanup_stale_anonymous_users(interval) to service_role;

-- Preview before deleting anything (read-only):
--   select count(*) from auth.users u
--   where u.is_anonymous
--     and coalesce(u.last_sign_in_at, u.created_at) < now() - interval '30 days'
--     and not exists (select 1 from public.orders o where o.user_id = u.id);
--
-- Optional weekly schedule (needs the pg_cron extension enabled in Supabase):
--   select cron.schedule('cleanup-stale-guests', '0 3 * * 0',
--     $$select public.cleanup_stale_anonymous_users(interval '30 days')$$);
