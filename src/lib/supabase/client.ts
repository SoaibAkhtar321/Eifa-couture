/* ============================================
   EIFA COUTURE — Supabase Browser Client
   ============================================
   Client-side Supabase instance for use inside Client Components
   ('use client'), hooks, and providers. Session state is persisted
   via cookies (handled internally by @supabase/ssr) so it stays in
   sync with the server client used in Server Components/middleware.

   Do NOT use this client inside Server Components, Route Handlers,
   or middleware — use `lib/supabase/server.ts` there instead.
   ============================================ */

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
      'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY ' +
      'are set (see .env.example).'
  );
}

/**
 * Creates a new Supabase client scoped to the browser.
 *
 * A fresh instance is intentionally created on each call rather than
 * exported as a singleton — this matches the official @supabase/ssr
 * pattern and avoids stale auth state across Fast Refresh in dev.
 * Consumers (e.g. `AuthProvider`) should create one instance with
 * `useState(() => createClient())` and reuse it for the component's
 * lifetime rather than calling this on every render.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!);
}
