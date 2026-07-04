/* ============================================
   EIFA COUTURE — Supabase Server Client
   ============================================
   Server-side Supabase instance for use inside Server Components,
   Route Handlers, and Server Actions. Reads/writes the auth session
   via Next.js cookies so it stays in sync with the browser client.

   Do NOT use this inside Client Components — use
   `lib/supabase/client.ts` there instead.

   NOTE: In Server Components, `cookies().set()` will throw because
   Server Components cannot write cookies. That's expected — the
   try/catch below swallows it. Session refresh in that case is
   handled by middleware, which *can* write cookies. This mirrors the
   official @supabase/ssr Next.js App Router pattern.
   ============================================ */

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

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
 * Creates a new Supabase client scoped to the current request, backed
 * by the Next.js cookie store. Must be called fresh per request (not
 * cached at module scope), since it captures that request's cookies.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component — cookies can't be written
          // here. Safe to ignore as long as middleware is refreshing
          // the session (see future middleware.ts).
        }
      },
    },
  });
}
