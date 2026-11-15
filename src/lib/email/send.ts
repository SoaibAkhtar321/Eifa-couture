/* ============================================
   EIFA COUTURE — Resend send helper
   ============================================
   Thin wrapper over Resend's REST API (no SDK dependency).

   Contract: sendEmail() NEVER throws and never rejects. Callers get
   { ok: false, error } instead, so an email problem can never fail
   an order, cancel, refund or return action (it is also only ever
   called from the notification webhook, after the order action has
   already committed).

   Until a domain is verified in Resend, set
     EMAIL_FROM="Eifa Couture <onboarding@resend.dev>"
   Resend's test sender only delivers to the email address of the
   Resend account owner.
   ============================================ */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'Eifa Couture <onboarding@resend.dev>';
const TIMEOUT_MS = 8_000;

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  /** Stable key so Resend itself also de-duplicates a retried send. */
  idempotencyKey?: string;
  /** Per-message reply-to (e.g. the customer on a contact-form email). Overrides EMAIL_REPLY_TO. */
  replyTo?: string;
}

export type SendEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string };

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY is not set' };

  const configuredFrom = process.env.EMAIL_FROM?.trim();
  if (!configuredFrom && process.env.NODE_ENV === 'production') {
    // The default sender is Resend's test address, which only delivers to the
    // Resend account owner: customers would silently get nothing.
    console.warn('[email] EMAIL_FROM is not set; set it to an address on a verified Resend domain.');
  }
  const from = configuredFrom || DEFAULT_FROM;
  const replyTo = input.replyTo?.trim() || process.env.EMAIL_REPLY_TO?.trim();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(input.idempotencyKey ? { 'Idempotency-Key': input.idempotencyKey.slice(0, 256) } : {}),
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
      signal: controller.signal,
    });

    const body = (await response.json().catch(() => null)) as
      | { id?: string; message?: string; name?: string }
      | null;

    if (!response.ok) {
      return {
        ok: false,
        error: `Resend ${response.status}: ${body?.message ?? body?.name ?? 'request failed'}`,
      };
    }
    return { ok: true, id: body?.id ?? null };
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? 'Resend request timed out'
        : error instanceof Error
          ? error.message
          : 'Unknown email error';
    return { ok: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}
