/* ============================================
   EIFA COUTURE — Notification -> Email Webhook
   ============================================
   Called by a Supabase Database Webhook on every INSERT into
   `notifications` (configure in Supabase dashboard → Database →
   Webhooks):

     Table:   notifications          Events: Insert
     Type:    HTTP Request           Method: POST
     URL:     https://<your-domain>/api/webhooks/notifications
     Headers: Content-Type: application/json
              x-webhook-secret: <NOTIFICATION_WEBHOOK_SECRET>

   Why a webhook: order status changes reach the database from several
   places (admin dropdown writing directly from the browser, the
   Razorpay webhook, customer cancel, refunds, returns). Phase E's
   triggers turn every one of them into a notification row, so this is
   the one place that sees all of them.

   Security: shared-secret header, compared in constant time. The
   payload is NOT trusted — only the notification id is read from it,
   and everything else (user, order, amounts) is re-read from the
   database with the service role.

   Failure policy: this runs after the order action has committed, so
   nothing here can block or fail it. Send failures are recorded in
   `email_events` and reported as 200 {ok:false}; only an unexpected
   crash returns 500.
   ============================================ */

import { createHash, timingSafeEqual } from 'crypto';

import { NextResponse, type NextRequest } from 'next/server';

import { dispatchNotificationEmail } from '@/lib/email/dispatch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function secretsMatch(provided: string, expected: string): boolean {
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const expected = process.env.NOTIFICATION_WEBHOOK_SECRET;
  if (!expected) {
    console.error('[notifications-webhook] NOTIFICATION_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const provided = request.headers.get('x-webhook-secret') ?? '';
  if (!provided || !secretsMatch(provided, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const payload = (body ?? {}) as {
    type?: string;
    table?: string;
    record?: { id?: unknown };
    notification_id?: unknown;
  };

  // Supabase sends type "INSERT"; a bare { notification_id } is accepted for manual tests.
  if (payload.type && payload.type !== 'INSERT') {
    return NextResponse.json({ ok: true, outcome: 'skipped', reason: 'not an INSERT' });
  }
  if (payload.table && payload.table !== 'notifications') {
    return NextResponse.json({ ok: true, outcome: 'skipped', reason: 'wrong table' });
  }

  const id = payload.record?.id ?? payload.notification_id;
  if (typeof id !== 'string' || !UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Missing notification id' }, { status: 400 });
  }

  try {
    const result = await dispatchNotificationEmail(id);
    if (result.outcome === 'failed') {
      console.error('[notifications-webhook] email failed:', result.template, result.error);
    }
    return NextResponse.json({ ok: result.outcome !== 'failed', ...result });
  } catch (error) {
    console.error('[notifications-webhook] unexpected error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
