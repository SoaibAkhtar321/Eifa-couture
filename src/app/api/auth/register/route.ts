/* ============================================
   EIFA COUTURE — Register Route Handler
   ============================================
   Server-side wrapper around `supabase.auth.signUp`, so signups can
   be rate-limited before they reach Supabase. `useAuth().signUp`
   calls this instead of the browser Supabase client directly; on
   success it returns the session tokens so the client can call
   `supabase.auth.setSession()` and hydrate the browser client / auth
   store exactly as before (Confirm Email is OFF, so signUp already
   returns an authenticated session).
   ============================================ */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { getClientIp, rateLimit, rateLimitResponseHeaders, RATE_LIMITS } from '@/lib/rate-limit';

const registerSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit(`register:${ip}`, RATE_LIMITS.register);

  if (!limit.success) {
    return NextResponse.json(
      { error: { message: 'Too many sign-up attempts. Please try again shortly.' } },
      { status: 429, headers: rateLimitResponseHeaders(limit.retryAfterSeconds!) }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: 'Please enter a valid email address and an 8+ character password.' } },
      { status: 400 }
    );
  }

  const { origin } = new URL(request.url);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 400 });
  }

  return NextResponse.json({
    session: data.session
      ? {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        }
      : null,
  });
}
