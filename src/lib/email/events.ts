/* ============================================
   EIFA COUTURE — Notification -> email event mapping
   ============================================
   Phase E's database triggers stamp every notification with a
   deterministic dedupe_key. Phase F reads that key to decide which
   email to send, so the trigger stays the single source of truth for
   "what happened". Formats (see migration 20261114170000):

     order:<orderId>:status:<status>        customer, order status change
     order:<orderId>:tracking:<awb>         customer, tracking added
     order:<orderId>:refund:<refundId>      customer, refund processed
     return:<returnId>:requested            customer, return/exchange filed
     return:<returnId>:<status>             customer, return step
     admin:order:<orderId>:paid             admins, new paid order
     admin:order:<orderId>:cancelled        admins, customer cancelled
     admin:return:<returnId>:requested      admins, new return request
   ============================================ */

const UUID = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';

export type EmailEvent =
  | { audience: 'customer'; kind: 'order_status'; orderId: string; status: string }
  | { audience: 'customer'; kind: 'tracking'; orderId: string; awb: string }
  | { audience: 'customer'; kind: 'refund'; orderId: string; refundId: string }
  | { audience: 'customer'; kind: 'return_step'; returnId: string; step: string }
  | { audience: 'admin'; kind: 'new_order'; orderId: string }
  | { audience: 'admin'; kind: 'order_cancelled'; orderId: string }
  | { audience: 'admin'; kind: 'new_return'; returnId: string };

const PATTERNS: Array<[RegExp, (m: RegExpMatchArray) => EmailEvent]> = [
  [
    new RegExp(`^order:(${UUID}):status:([a-z_]+)$`),
    (m) => ({ audience: 'customer', kind: 'order_status', orderId: m[1], status: m[2] }),
  ],
  [
    new RegExp(`^order:(${UUID}):tracking:(.+)$`),
    (m) => ({ audience: 'customer', kind: 'tracking', orderId: m[1], awb: m[2] }),
  ],
  [
    new RegExp(`^order:(${UUID}):refund:(${UUID})$`),
    (m) => ({ audience: 'customer', kind: 'refund', orderId: m[1], refundId: m[2] }),
  ],
  [
    new RegExp(`^return:(${UUID}):([a-z_]+)$`),
    (m) => ({ audience: 'customer', kind: 'return_step', returnId: m[1], step: m[2] }),
  ],
  [
    new RegExp(`^admin:order:(${UUID}):paid$`),
    (m) => ({ audience: 'admin', kind: 'new_order', orderId: m[1] }),
  ],
  [
    new RegExp(`^admin:order:(${UUID}):cancelled$`),
    (m) => ({ audience: 'admin', kind: 'order_cancelled', orderId: m[1] }),
  ],
  [
    new RegExp(`^admin:return:(${UUID}):requested$`),
    (m) => ({ audience: 'admin', kind: 'new_return', returnId: m[1] }),
  ],
];

/** Returns null for notifications that should not produce an email. */
export function parseEmailEvent(dedupeKey: string | null | undefined): EmailEvent | null {
  if (!dedupeKey) return null;
  for (const [pattern, build] of PATTERNS) {
    const match = dedupeKey.match(pattern);
    if (match) return build(match);
  }
  return null;
}

/**
 * Idempotency key for the email_events table. Customer emails are one
 * per (recipient, event); admin alerts fan out to every admin as
 * separate notification rows but must produce ONE email to the alert
 * inbox, so their key has no user in it.
 */
export function emailEventKey(event: EmailEvent, dedupeKey: string, userId: string): string {
  return event.audience === 'admin' ? dedupeKey : `${userId}:${dedupeKey}`;
}
