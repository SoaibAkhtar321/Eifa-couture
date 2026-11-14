'use client';

/* ============================================
   EIFA COUTURE — Address Data Access
   ============================================
   Thin Supabase query layer for the `addresses` table. Kept out of
   components so AddressList/AddressForm stay UI-only, mirroring how
   useAuth() keeps Supabase calls out of the auth UI.

   Default-address handling: the DB enforces exactly one default per
   user via a partial unique index (`is_default = true`), which is a
   cross-row rule a CHECK constraint can't express. So promoting a new
   default requires unsetting the old one first — two calls, but
   sequenced, since Supabase doesn't expose a transaction RPC here
   without writing a Postgres function. If that race ever matters in
   practice, move this into a `set_default_address(uuid)` RPC.
   ============================================ */

import { createClient } from '@/lib/supabase/client';
import type { AddressType, DbAddress } from '@/types/database';

export interface AddressInput {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  type: AddressType;
  is_default: boolean;
}

export async function fetchAddresses(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  return { data: (data ?? []) as DbAddress[], error };
}

export async function createAddress(userId: string, rawInput: AddressInput) {
  const supabase = createClient();
  const phone = normalizeIndianPhone(rawInput.phone);
  if (!phone) return { data: null as DbAddress | null, error: { message: PHONE_ERROR_MESSAGE } };
  const input = { ...rawInput, phone };

  if (input.is_default) {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId);
  }

  const { data, error } = await supabase
    .from('addresses')
    .insert({ ...input, user_id: userId })
    .select()
    .single();

  return { data: data as DbAddress | null, error };
}

export async function updateAddress(userId: string, id: string, rawInput: AddressInput) {
  const supabase = createClient();
  const phone = normalizeIndianPhone(rawInput.phone);
  if (!phone) return { data: null as DbAddress | null, error: { message: PHONE_ERROR_MESSAGE } };
  const input = { ...rawInput, phone };

  if (input.is_default) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId)
      .neq('id', id);
  }

  const { data, error } = await supabase
    .from('addresses')
    .update(input)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  return { data: data as DbAddress | null, error };
}

export async function deleteAddress(userId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('addresses').delete().eq('id', id).eq('user_id', userId);
  return { error };
}

export async function setDefaultAddress(userId: string, id: string) {
  const supabase = createClient();

  await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId).neq('id', id);

  const { data, error } = await supabase
    .from('addresses')
    .update({ is_default: true })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  return { data: data as DbAddress | null, error };
}

export const ADDRESS_TYPE_OPTIONS: { value: AddressType; label: string }[] = [
  { value: 'home', label: 'Home' },
  { value: 'work', label: 'Work' },
  { value: 'other', label: 'Other' },
];

/**
 * Reduce user input to a bare 10-digit Indian mobile number, or null if it
 * cannot be one. Accepts spaces/dashes/brackets and an optional +91 / 91
 * country code; a leading 0 is NOT accepted.
 */
export function normalizeIndianPhone(value: string): string | null {
  const digits = value.replace(/[\s\-().]/g, '').replace(/^\+/, '');
  const national = /^91\d{10}$/.test(digits) ? digits.slice(2) : digits;
  // Indian mobiles are 10 digits starting 6-9; reject repeated-digit junk (9999999999).
  if (!/^[6-9]\d{9}$/.test(national)) return null;
  if (/^(\d)\1{9}$/.test(national)) return null;
  return national;
}

export function isValidIndianPhone(value: string) {
  return normalizeIndianPhone(value) !== null;
}

export const PHONE_ERROR_MESSAGE = 'Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.';

export function isValidIndianPincode(value: string) {
  return /^\d{6}$/.test(value.trim());
}