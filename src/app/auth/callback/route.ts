/* ============================================
   EIFA COUTURE — Auth Callback Route
   ============================================
   Required companion to Google OAuth and email-confirmation links.
   Supabase redirects here with a `code` query param after a user
   completes Google sign-in or clicks a confirmation/magic link; this
   route exchanges that code for a session (writing the session
   cookie via the server Supabase client) and then redirects into the
   app. Without this route, `signInWithOAuth` in `useAuth` would
   redirect back with a code that never gets exchanged, and the user
   would appear signed out.
   ============================================ */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/account';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
