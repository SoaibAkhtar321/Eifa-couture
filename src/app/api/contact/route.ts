/* ============================================
   EIFA COUTURE — Contact form route handler
   ============================================
   POST /api/contact
   zod validation, honeypot, per-IP rate limit, then Resend to the
   store inbox (CONTACT_INFO.email) with reply-to set to the customer.
   The customer's message is never stored: it only goes to the inbox.
   ============================================ */

import { NextResponse, type NextRequest } from 'next/server';

import { CONTACT_INFO } from '@/lib/constants';
import { contactSchema } from '@/lib/contact/schema';
import { isEmailConfigured, sendEmail } from '@/lib/email/send';
import { esc } from '@/lib/email/templates';
import { getClientIp, rateLimit, rateLimitResponseHeaders, RATE_LIMITS } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 10_000;

const fail = (message: string, status: number, headers?: HeadersInit) =>
  NextResponse.json({ error: { message } }, { status, headers });

const FALLBACK = `Please email ${CONTACT_INFO.email} or call ${CONTACT_INFO.phone} instead.`;

export async function POST(request: NextRequest) {
  const limit = await rateLimit(`contact:${getClientIp(request)}`, RATE_LIMITS.contact);
  if (!limit.success) {
    return fail(
      'Too many messages from this connection. Please wait a few minutes and try again.',
      429,
      rateLimitResponseHeaders(limit.retryAfterSeconds!)
    );
  }

  const raw = await request.text().catch(() => '');
  if (!raw || raw.length > MAX_BODY_BYTES) return fail('Please check your message and try again.', 400);

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return fail('Please check your message and try again.', 400);
  }

  const parsed = contactSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? 'Please check the form and try again.';
    return fail(first, 400);
  }
  const data = parsed.data;

  // Honeypot filled: pretend success so bots learn nothing, send nothing.
  if (data.website) return NextResponse.json({ ok: true });

  if (!isEmailConfigured()) {
    console.error('[contact] RESEND_API_KEY is not configured');
    return fail(`We could not send your message right now. ${FALLBACK}`, 503);
  }

  const subject = `Website enquiry: ${data.topic} (${data.name})`;
  const rows: Array<[string, string]> = [
    ['Name', data.name],
    ['Email', data.email],
    ['Phone', data.phone || '—'],
    ['Topic', data.topic],
    ['Order number', data.orderNumber || '—'],
  ];

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#222;font-size:15px;line-height:1.6">
<h2 style="margin:0 0 12px">New website enquiry</h2>
<table cellpadding="4" style="border-collapse:collapse">
${rows.map(([k, v]) => `<tr><td style="color:#777;padding-right:16px">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('\n')}
</table>
<p style="margin:16px 0 4px;color:#777">Message</p>
<p style="margin:0;white-space:pre-wrap">${esc(data.message)}</p>
<p style="margin-top:20px;color:#999;font-size:12px">Reply to this email to answer the customer directly.</p>
</div>`;

  const text = [
    'New website enquiry',
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    'Message:',
    data.message,
  ].join('\n');

  const result = await sendEmail({
    to: CONTACT_INFO.email,
    subject,
    html,
    text,
    replyTo: data.email,
  });

  if (!result.ok) {
    console.error('[contact] send failed:', result.error);
    return fail(`We could not send your message right now. ${FALLBACK}`, 502);
  }

  return NextResponse.json({ ok: true });
}
