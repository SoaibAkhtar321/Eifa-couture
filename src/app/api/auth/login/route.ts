/* ============================================
   EIFA COUTURE — Login Route Handler
   ============================================
   Server-side wrapper around `supabase.auth.signInWithPassword`, so
   login attempts can be rate-limited before they reach Supabase.
   `useAuth().signInWithPassword` calls this instead of the browser
   Supabase client directly; on success it returns the session tokens
   so the client can call `supabase.auth.setSession()` and hydrate the
   browser client / auth store exactly as before.
   ============================================ */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { getClientIp, rateLimit, rateLimitResponseHeaders, RATE_LIMITS } from '@/lib/rate-limit';

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit(`login:${ip}`, RATE_LIMITS.login);

  if (!limit.success) {
    return NextResponse.json(
      { error: { message: 'Too many login attempts. Please try again shortly.' } },
      { status: 429, headers: rateLimitResponseHeaders(limit.retryAfterSeconds!) }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: 'Please enter a valid email address and password.' } },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 401 });
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
