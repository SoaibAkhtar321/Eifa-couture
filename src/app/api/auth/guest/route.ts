/* ============================================
   EIFA COUTURE — Guest Session Route Handler
   ============================================
   Guest checkout: a shopper who is not signed in gets an anonymous
   Supabase session (`signInAnonymously`) at the moment they place an
   order, so the order is owned by a real `auth.uid()` and every
   existing protection (create_order RPC, RLS, Razorpay ownership
   checks) keeps working unchanged.

   Proxied through our own rate-limited route, same as login/register,
   because Supabase Auth itself cannot be rate-limited from here.
   Requires "Allow anonymous sign-ins" to be enabled in Supabase
   (Authentication → Sign In / Providers).
   ============================================ */

import { NextResponse, type NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { getClientIp, rateLimit, rateLimitResponseHeaders, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit(`guest:${ip}`, RATE_LIMITS.guestSession);

  if (!limit.success) {
    return NextResponse.json(
      { error: { message: 'Too many attempts. Please try again shortly.' } },
      { status: 429, headers: rateLimitResponseHeaders(limit.retryAfterSeconds!) }
    );
  }

  const supabase = await createClient();

  // Never replace a session that already exists (signed-in or guest).
  const {
    data: { user: existing },
  } = await supabase.auth.getUser();
  if (existing) {
    return NextResponse.json({ session: null, existing: true });
  }

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error || !data.session) {
    return NextResponse.json(
      { error: { message: 'Guest checkout is unavailable right now. Please sign in or try again.' } },
      { status: 503 }
    );
  }

  return NextResponse.json({
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    },
  });
}
