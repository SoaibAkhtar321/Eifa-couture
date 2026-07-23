/* ============================================
   EIFA COUTURE — Forgot Password Route Handler
   ============================================
   Server-side wrapper around `supabase.auth.resetPasswordForEmail`,
   so reset requests can be rate-limited before they reach Supabase.
   `useAuth().resetPasswordForEmail` calls this instead of the browser
   Supabase client directly.

   Always returns success (unless rate-limited or malformed) whether
   or not the email exists, matching Supabase's own behavior — this
   avoids leaking which emails are registered.
   ============================================ */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { getClientIp, rateLimit, rateLimitResponseHeaders, RATE_LIMITS } from '@/lib/rate-limit';

const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit(`forgot-password:${ip}`, RATE_LIMITS.forgotPassword);

  if (!limit.success) {
    return NextResponse.json(
      { error: { message: 'Too many reset requests. Please try again later.' } },
      { status: 429, headers: rateLimitResponseHeaders(limit.retryAfterSeconds!) }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: 'Please enter a valid email address.' } },
      { status: 400 }
    );
  }

  const { origin } = new URL(request.url);
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/reset-password`,
  });

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 400 });
  }

  return NextResponse.json({ error: null });
}
