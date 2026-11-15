/* ============================================
   EIFA COUTURE — Notification email dispatcher (server only)
   ============================================
   Given a notification id, decides whether it needs an email, loads the
   order / return it refers to, renders the template, claims the send
   in `email_events` (so replays can never double-send) and sends via
   Resend.

   Runs ONLY from /api/webhooks/notifications, i.e. after the order or
   return action has already committed. Nothing in here can fail or
   block an order action; every failure is recorded in email_events and
   returned as an outcome instead of thrown.
   ============================================ */

import { CONTACT_INFO } from '@/lib/constants';
import { createServiceClient } from '@/lib/supabase/service';

import { emailEventKey, parseEmailEvent, type EmailEvent } from './events';
import { isEmailConfigured, sendEmail } from './send';
import {
  renderAdminNewOrderEmail,
  renderAdminNewReturnEmail,
  renderAdminOrderCancelledEmail,
  renderOrderStatusEmail,
  renderRefundEmail,
  renderReturnStepEmail,
  renderTrackingEmail,
  type EmailOrder,
  type EmailReturn,
  type Rendered,
} from './templates';

type Supabase = ReturnType<typeof createServiceClient>;

export type DispatchOutcome =
  | { outcome: 'sent'; template: string }
  | { outcome: 'failed'; template: string; error: string }
  | { outcome: 'duplicate' }
  | { outcome: 'skipped'; reason: string };

const STALE_SENDING_MS = 5 * 60_000;

function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://eifacouture.com';
  return raw.replace(/\/+$/, '');
}

const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));

/* ---------- data loading ---------- */

async function loadOrder(supabase: Supabase, orderId: string): Promise<EmailOrder | null> {
  const { data: order } = await supabase
    .from('orders')
    .select(
      'id, order_number, user_id, total, estimated_delivery_date, shipping_provider, tracking_number, tracking_url, cancelled_by, shipping_address'
    )
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return null;

  const [{ data: items }, { data: profile }, { data: authUser }] = await Promise.all([
    supabase.from('order_items').select('name, size, color_name, quantity, unit_price').eq('order_id', orderId),
    supabase.from('profiles').select('display_name').eq('id', order.user_id).maybeSingle(),
    supabase.auth.admin.getUserById(order.user_id),
  ]);

  const a = (order.shipping_address ?? {}) as Record<string, unknown>;
  const address = a && Object.keys(a).length
    ? {
        fullName: str(a.full_name),
        line1: str(a.address_line1),
        line2: a.address_line2 ? str(a.address_line2) : null,
        city: str(a.city),
        state: str(a.state),
        pincode: str(a.pincode),
        phone: a.phone ? str(a.phone) : null,
      }
    : null;

  return {
    id: order.id,
    orderNumber: order.order_number,
    total: Number(order.total),
    estimatedDelivery: order.estimated_delivery_date ?? null,
    courier: order.shipping_provider ?? null,
    awb: order.tracking_number ?? null,
    trackingUrl: order.tracking_url ?? null,
    cancelledBy: order.cancelled_by ?? null,
    customerName: str(profile?.display_name) || address?.fullName || 'Customer',
    customerEmail: authUser?.user?.email ?? (a.email ? str(a.email) : null),
    address,
    items: (items ?? []).map((i: Record<string, unknown>) => ({
      name: str(i.name),
      size: str(i.size),
      color: str(i.color_name),
      quantity: Number(i.quantity),
      unitPrice: Number(i.unit_price),
    })),
  };
}

async function loadReturn(
  supabase: Supabase,
  returnId: string
): Promise<{ ret: EmailReturn; orderId: string } | null> {
  const { data: r } = await supabase
    .from('order_returns')
    .select(
      'id, order_id, order_item_id, is_exchange, reason, admin_notes, refund_amount, exchange_size, pickup_courier, pickup_tracking_number, pickup_date'
    )
    .eq('id', returnId)
    .maybeSingle();
  if (!r) return null;

  const { data: item } = await supabase
    .from('order_items')
    .select('name, size')
    .eq('id', r.order_item_id)
    .maybeSingle();

  return {
    orderId: r.order_id,
    ret: {
      id: r.id,
      isExchange: Boolean(r.is_exchange),
      reason: str(r.reason),
      adminNotes: r.admin_notes ?? null,
      refundAmount: r.refund_amount != null ? Number(r.refund_amount) : null,
      exchangeSize: r.exchange_size ?? null,
      itemName: str(item?.name) || 'Item',
      itemSize: str(item?.size),
      pickupCourier: r.pickup_courier ?? null,
      pickupTrackingNumber: r.pickup_tracking_number ?? null,
      pickupDate: r.pickup_date ?? null,
    },
  };
}

/* ---------- rendering ---------- */

async function renderFor(
  supabase: Supabase,
  event: EmailEvent
): Promise<{ rendered: Rendered; order: EmailOrder } | { skip: string }> {
  const ctx = { siteUrl: siteUrl() };

  if (event.kind === 'new_return' || event.kind === 'return_step') {
    const loaded = await loadReturn(supabase, event.returnId);
    if (!loaded) return { skip: 'return not found' };
    const order = await loadOrder(supabase, loaded.orderId);
    if (!order) return { skip: 'order not found' };

    if (event.kind === 'new_return') {
      return { rendered: renderAdminNewReturnEmail(order, loaded.ret, ctx), order };
    }
    const rendered = renderReturnStepEmail(event.step, order, loaded.ret, ctx);
    return rendered ? { rendered, order } : { skip: `no template for return step ${event.step}` };
  }

  const order = await loadOrder(supabase, event.orderId);
  if (!order) return { skip: 'order not found' };

  switch (event.kind) {
    case 'order_status': {
      const rendered = renderOrderStatusEmail(event.status, order, ctx);
      return rendered ? { rendered, order } : { skip: `no template for status ${event.status}` };
    }
    case 'tracking':
      return { rendered: renderTrackingEmail(order, event.awb, ctx), order };
    case 'refund': {
      const { data: refund } = await supabase.from('refunds').select('amount').eq('id', event.refundId).maybeSingle();
      return { rendered: renderRefundEmail(order, refund ? Number(refund.amount) : null, ctx), order };
    }
    case 'new_order':
      return { rendered: renderAdminNewOrderEmail(order, ctx), order };
    case 'order_cancelled':
      return { rendered: renderAdminOrderCancelledEmail(order, ctx), order };
  }
}

/* ---------- claim (idempotency) ---------- */

async function claimSend(
  supabase: Supabase,
  eventKey: string,
  notificationId: string,
  recipient: string,
  template: string
): Promise<boolean> {
  const { error } = await supabase.from('email_events').insert({
    event_key: eventKey,
    notification_id: notificationId,
    recipient,
    template,
    status: 'sending',
  });
  if (!error) return true;
  if (error.code !== '23505') throw new Error(`email_events insert failed: ${error.message}`);

  // Already claimed. Retry only a previous failure or a send that died mid-flight.
  const { data: existing } = await supabase
    .from('email_events')
    .select('status, attempts, updated_at')
    .eq('event_key', eventKey)
    .maybeSingle();
  if (!existing) return false;

  const stale =
    existing.status === 'sending' && Date.now() - new Date(existing.updated_at).getTime() > STALE_SENDING_MS;
  if (existing.status !== 'failed' && !stale) return false;

  // Compare-and-swap so two concurrent retries cannot both win.
  const { data: won } = await supabase
    .from('email_events')
    .update({ status: 'sending', attempts: existing.attempts + 1, error: null, updated_at: new Date().toISOString() })
    .eq('event_key', eventKey)
    .eq('updated_at', existing.updated_at)
    .select('id');
  return Boolean(won && won.length > 0);
}

/* ---------- entry point ---------- */

export async function dispatchNotificationEmail(notificationId: string): Promise<DispatchOutcome> {
  if (!isEmailConfigured()) return { outcome: 'skipped', reason: 'RESEND_API_KEY not configured' };

  const supabase = createServiceClient();

  const { data: notification } = await supabase
    .from('notifications')
    .select('id, user_id, dedupe_key')
    .eq('id', notificationId)
    .maybeSingle();
  if (!notification) return { outcome: 'skipped', reason: 'notification not found' };

  const event = parseEmailEvent(notification.dedupe_key);
  if (!event) return { outcome: 'skipped', reason: 'notification type has no email' };

  const built = await renderFor(supabase, event);
  if ('skip' in built) return { outcome: 'skipped', reason: built.skip };
  const { rendered, order } = built;

  // Recipient
  let recipients: string[];
  if (event.audience === 'admin') {
    // ADMIN_ALERT_EMAIL (comma-separated) overrides; otherwise alerts go to the store inbox.
    recipients = (process.env.ADMIN_ALERT_EMAIL ?? '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
    if (recipients.length === 0 && CONTACT_INFO.email) recipients = [CONTACT_INFO.email];
    if (recipients.length === 0) return { outcome: 'skipped', reason: 'no admin alert recipient configured' };
  } else {
    // Defence in depth: the customer notification must belong to the order's owner.
    const { data: owner } = await supabase.from('orders').select('user_id').eq('id', order.id).maybeSingle();
    if (!owner || owner.user_id !== notification.user_id) {
      return { outcome: 'skipped', reason: 'notification user does not own the order' };
    }
    if (!order.customerEmail) return { outcome: 'skipped', reason: 'customer has no email' };
    recipients = [order.customerEmail];
  }

  const eventKey = emailEventKey(event, notification.dedupe_key as string, notification.user_id);
  const claimed = await claimSend(supabase, eventKey, notification.id, recipients.join(','), rendered.template);
  if (!claimed) return { outcome: 'duplicate' };

  const result = await sendEmail({
    to: recipients,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    idempotencyKey: eventKey,
  });

  await supabase
    .from('email_events')
    .update(
      result.ok
        ? { status: 'sent', provider_id: result.id, error: null, updated_at: new Date().toISOString() }
        : { status: 'failed', error: result.error.slice(0, 500), updated_at: new Date().toISOString() }
    )
    .eq('event_key', eventKey);

  return result.ok
    ? { outcome: 'sent', template: rendered.template }
    : { outcome: 'failed', template: rendered.template, error: result.error };
}
