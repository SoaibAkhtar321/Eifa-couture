/* ============================================
   EIFA COUTURE — Supabase Service-Role Client
   ============================================
   Bypasses RLS entirely using the `service_role` key. This must NEVER
   be imported into a Client Component, and must NEVER be exposed via
   a NEXT_PUBLIC_* env var — it is the trust boundary that lets
   `mark_order_paid()` / `release_order_reservation()` be called at
   all, since those RPCs are revoked from `authenticated`/`anon` on
   purpose (see supabase/migrations/0015_razorpay_payment_rpcs.sql).

   Use this ONLY from:
     - /api/payments/razorpay/verify   (post-checkout client callback)
     - /api/webhooks/razorpay          (Razorpay server-to-server webhook)
     - /api/payments/razorpay/create-order (to stamp payment_provider_ref)

   Every other server read (order history, account pages, etc.) must
   keep using lib/supabase/server.ts, which respects RLS and the
   signed-in user's session. Reaching for this client anywhere else is
   a privilege-escalation bug waiting to happen.
   ============================================ */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Creates a fresh service-role Supabase client. Not cached at module
 * scope on purpose — route handlers are short-lived and this avoids
 * any accidental cross-request state; the client itself is cheap to
 * construct (no network call happens until the first query).
 *
 * Throws loudly if misconfigured rather than silently falling back to
 * the anon client, since a silent fallback here would make payment
 * settlement RPCs fail with a confusing "permission denied" instead of
 * a clear setup error.
 */
export function createServiceClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase service-role environment variables. ' +
        'Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY ' +
        'are set (see .env.example). SUPABASE_SERVICE_ROLE_KEY must come ' +
        'from Project Settings → API → service_role in the Supabase ' +
        'dashboard, and must never be prefixed with NEXT_PUBLIC_.'
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}