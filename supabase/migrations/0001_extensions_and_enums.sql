-- ============================================================
-- EIFA COUTURE — Migration 0001
-- Extensions, Enums, and shared helper functions
-- ============================================================
-- Safe to run multiple times (IF NOT EXISTS / OR REPLACE everywhere).

-- ── Extensions ──
create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "pg_trgm";       -- fuzzy/ILIKE search on product name, tags
create extension if not exists "unaccent";      -- accent-insensitive search

-- ── Enums ──
-- Kept as native enums (not text+check) because these sets are stable and
-- small; native enums are cheaper to index/compare and self-document in
-- the Supabase-generated TS types.

do $$ begin
  create type user_role as enum ('customer', 'admin', 'superadmin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type address_type as enum ('home', 'work', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum (
    'pending', 'confirmed', 'processing', 'shipped',
    'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_provider as enum ('razorpay', 'stripe', 'cod', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type coupon_type as enum ('percentage', 'fixed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum ('order', 'promotion', 'system', 'review');
exception when duplicate_object then null; end $$;

do $$ begin
  create type return_status as enum (
    'requested', 'approved', 'rejected', 'picked_up',
    'received', 'refunded', 'exchanged'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type shipment_status as enum (
    'label_created', 'picked_up', 'in_transit',
    'out_for_delivery', 'delivered', 'failed', 'rto'
  );
exception when duplicate_object then null; end $$;

-- ── Shared helper: auto-maintain updated_at ──
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Shared helper: current app role (used heavily by RLS in 0003) ──
-- Reads role from the caller's own profile row. STABLE + SECURITY DEFINER
-- so it can be used inside policies without recursive RLS evaluation.
create or replace function auth_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth_role() in ('admin', 'superadmin'), false);
$$;
