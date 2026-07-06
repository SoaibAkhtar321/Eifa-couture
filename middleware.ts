/* ============================================
   EIFA COUTURE — Auth Middleware
   ============================================
   Runs on every matched request to refresh the Supabase session
   cookie before it expires. This is the piece `lib/supabase/server.ts`
   refers to: Server Components cannot write cookies, so without this
   middleware, a session nearing expiry would never get refreshed and
   users would be silently signed out on the server side even while
   `AuthProvider` still thinks they're logged in on the client.

   This does NOT gate routes (no redirect-if-logged-out logic) — guest
   browsing must keep working everywhere per project requirements.
   Route protection, if needed later (e.g. for /account), should be
   layered on top of this, not instead of it.
   ============================================ */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  if (!supabaseUrl || !supabaseAnonKey) {
    // Fails loudly in the browser client / server client already;
    // middleware just no-ops rather than crashing every request.
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refreshes the session if expired — required for Server Components
  // to reliably read a valid session. Must be called even though the
  // result isn't used directly here.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, and common static asset extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};