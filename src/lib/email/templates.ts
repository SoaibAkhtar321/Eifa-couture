/* ============================================
   EIFA COUTURE — Email templates (pure, no I/O)
   ============================================
   Every template builds one `Content` object that is rendered to BOTH
   an HTML email (table layout, inline styles — works in Gmail/Outlook)
   and a plain-text alternative. All dynamic strings are HTML-escaped.
   Brand colours mirror globals.css (maroon / gold / ivory / beige).
   ============================================ */

const C = {
  maroon: '#5A0B22',
  gold: '#C8A548',
  ivory: '#FBF5EA',
  beige: '#EFE3CF',
  ink: '#1F1A17',
  soft: '#4A423B',
  muted: '#7A6F66',
};

export interface EmailItem {
  name: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
}

export interface EmailAddress {
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string | null;
}

export interface EmailOrder {
  id: string;
  orderNumber: string;
  total: number;
  estimatedDelivery: string | null; // YYYY-MM-DD
  courier: string | null;
  awb: string | null;
  trackingUrl: string | null;
  cancelledBy: string | null;
  customerName: string;
  customerEmail: string | null;
  address: EmailAddress | null;
  items: EmailItem[];
}

export interface EmailReturn {
  id: string;
  isExchange: boolean;
  reason: string;
  adminNotes: string | null;
  refundAmount: number | null;
  exchangeSize: string | null;
  itemName: string;
  itemSize: string;
}

export interface Rendered {
  template: string;
  subject: string;
  html: string;
  text: string;
}

interface Cta {
  label: string;
  url: string;
}

interface Content {
  template: string;
  subject: string;
  preheader: string;
  heading: string;
  paragraphs: string[];
  cta?: Cta;
  order?: EmailOrder;
  /** Extra label/value lines shown under the paragraphs. */
  facts?: Array<[string, string]>;
  /** Admin emails skip the friendly greeting. */
  greeting?: string | null;
}

export interface TemplateContext {
  siteUrl: string;
}

/* ---------- helpers ---------- */

export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const money = (n: number) =>
  '₹' + new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

function formatDate(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const d = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  });
}

const trackUrl = (ctx: TemplateContext, order: EmailOrder) =>
  `${ctx.siteUrl}/track-order?order=${encodeURIComponent(order.orderNumber)}`;

const adminOrderUrl = (ctx: TemplateContext, orderId: string) => `${ctx.siteUrl}/admin/orders/${orderId}`;

const firstName = (name: string) => name.trim().split(/\s+/)[0] || 'there';

function addressLines(a: EmailAddress): string[] {
  return [a.fullName, a.line1, a.line2 ?? '', `${a.city}, ${a.state} ${a.pincode}`, a.phone ? `Phone: ${a.phone}` : '']
    .filter(Boolean);
}

/* ---------- renderer ---------- */

function renderContent(content: Content): Rendered {
  const { order } = content;
  const greeting =
    content.greeting === undefined && order ? `Hi ${firstName(order.customerName)},` : content.greeting;

  /* text */
  const text: string[] = [];
  if (greeting) text.push(greeting, '');
  text.push(content.heading, '');
  content.paragraphs.forEach((p) => text.push(p, ''));
  content.facts?.forEach(([k, v]) => text.push(`${k}: ${v}`));
  if (content.facts?.length) text.push('');
  if (order) {
    text.push(`Order ${order.orderNumber}`);
    order.items.forEach((i) =>
      text.push(`- ${i.name} (${i.size}, ${i.color}) x${i.quantity}  ${money(i.unitPrice * i.quantity)}`)
    );
    text.push(`Total: ${money(order.total)}`, '');
    if (order.address) text.push('Delivery address:', ...addressLines(order.address), '');
  }
  if (content.cta) text.push(`${content.cta.label}: ${content.cta.url}`, '');
  text.push('— Eifa Couture · Lucknowi Chikankari');

  /* html */
  const paragraphs = content.paragraphs
    .map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${C.soft};">${esc(p)}</p>`)
    .join('');

  const facts = content.facts?.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 18px;width:100%;">${content.facts
        .map(
          ([k, v]) =>
            `<tr><td style="padding:4px 0;font-size:13px;color:${C.muted};width:38%;">${esc(k)}</td><td style="padding:4px 0;font-size:14px;color:${C.ink};">${esc(v)}</td></tr>`
        )
        .join('')}</table>`
    : '';

  const orderBlock = order
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid ${C.beige};margin-top:8px;">
        <tr><td colspan="2" style="padding:14px 0 6px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${C.muted};">Order ${esc(order.orderNumber)}</td></tr>
        ${order.items
          .map(
            (i) => `<tr>
          <td style="padding:6px 0;font-size:14px;color:${C.ink};">${esc(i.name)}<br><span style="font-size:12px;color:${C.muted};">${esc(i.size)} · ${esc(i.color)} · Qty ${i.quantity}</span></td>
          <td style="padding:6px 0;font-size:14px;color:${C.ink};text-align:right;vertical-align:top;">${money(i.unitPrice * i.quantity)}</td></tr>`
          )
          .join('')}
        <tr><td style="padding:10px 0 0;border-top:1px solid ${C.beige};font-size:14px;font-weight:bold;color:${C.ink};">Total</td>
            <td style="padding:10px 0 0;border-top:1px solid ${C.beige};font-size:14px;font-weight:bold;color:${C.ink};text-align:right;">${money(order.total)}</td></tr>
      </table>
      ${
        order.address
          ? `<p style="margin:18px 0 0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${C.muted};">Delivery address</p>
             <p style="margin:6px 0 0;font-size:14px;line-height:1.55;color:${C.ink};">${addressLines(order.address).map(esc).join('<br>')}</p>`
          : ''
      }`
    : '';

  const cta = content.cta
    ? `<p style="margin:24px 0 4px;"><a href="${esc(content.cta.url)}" style="display:inline-block;background:${C.maroon};color:#ffffff;text-decoration:none;font-size:12px;letter-spacing:.16em;text-transform:uppercase;padding:14px 28px;">${esc(content.cta.label)}</a></p>`
    : '';

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(content.subject)}</title></head>
<body style="margin:0;padding:0;background:${C.ivory};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(content.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ivory};"><tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
    <tr><td style="background:${C.maroon};padding:22px 28px;text-align:center;">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:.32em;color:${C.gold};">EIFA COUTURE</span>
    </td></tr>
    <tr><td style="background:#ffffff;padding:30px 28px;border:1px solid ${C.beige};border-top:0;font-family:Arial,Helvetica,sans-serif;">
      ${greeting ? `<p style="margin:0 0 10px;font-size:15px;color:${C.ink};">${esc(greeting)}</p>` : ''}
      <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:normal;color:${C.maroon};">${esc(content.heading)}</h1>
      ${paragraphs}${facts}${orderBlock}${cta}
    </td></tr>
    <tr><td style="padding:18px 28px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${C.muted};">
      Eifa Couture · Handcrafted Lucknowi Chikankari<br>You are receiving this because of activity on your order.
    </td></tr>
  </table>
</td></tr></table></body></html>`;

  return { template: content.template, subject: content.subject, html, text: text.join('\n') };
}

/* ---------- customer: order status ---------- */

export function renderOrderStatusEmail(
  status: string,
  order: EmailOrder,
  ctx: TemplateContext
): Rendered | null {
  const n = order.orderNumber;
  const eta = formatDate(order.estimatedDelivery);
  const track: Cta = { label: 'Track your order', url: trackUrl(ctx, order) };
  const base = { order, cta: track };

  switch (status) {
    case 'confirmed':
      return renderContent({
        ...base,
        template: 'order_confirmed',
        subject: `Order ${n} confirmed`,
        preheader: 'Thank you for shopping with Eifa Couture.',
        heading: 'Your order is confirmed',
        paragraphs: [
          'Thank you for your order. Your payment is received and we are getting your pieces ready.',
          ...(eta ? [`Estimated delivery: ${eta}.`] : []),
        ],
      });
    case 'processing':
      return renderContent({
        ...base,
        template: 'order_processing',
        subject: `We are packing order ${n}`,
        preheader: 'Your order is being packed.',
        heading: 'Your order is being packed',
        paragraphs: ['Our team is carefully packing your order. We will email you again as soon as it ships.'],
      });
    case 'shipped':
      return renderContent({
        ...base,
        template: 'order_shipped',
        subject: `Order ${n} has shipped`,
        preheader: 'Your order is on its way.',
        heading: 'Your order is on its way',
        paragraphs: ['Good news — your order has been handed to the courier.', ...(eta ? [`Estimated delivery: ${eta}.`] : [])],
        facts: [
          ...(order.courier ? ([['Courier', order.courier]] as Array<[string, string]>) : []),
          ...(order.awb ? ([['Tracking number (AWB)', order.awb]] as Array<[string, string]>) : []),
        ],
        cta: order.trackingUrl ? { label: 'Track with courier', url: order.trackingUrl } : track,
      });
    case 'out_for_delivery':
      return renderContent({
        ...base,
        template: 'order_out_for_delivery',
        subject: `Order ${n} is out for delivery`,
        preheader: 'It should reach you today.',
        heading: 'Out for delivery',
        paragraphs: ['Your order is out for delivery and should reach you soon. Please keep your phone handy.'],
      });
    case 'delivered':
      return renderContent({
        ...base,
        template: 'order_delivered',
        subject: `Order ${n} delivered`,
        preheader: 'We hope you love it.',
        heading: 'Your order has been delivered',
        paragraphs: [
          'We hope you love your new pieces. If something is not right, you can request a return or exchange from your orders page within the return window.',
        ],
        cta: { label: 'View my orders', url: `${ctx.siteUrl}/account/orders` },
      });
    case 'cancelled':
      return renderContent({
        ...base,
        template: 'order_cancelled',
        subject: `Order ${n} cancelled`,
        preheader: 'Your order has been cancelled.',
        heading: 'Your order has been cancelled',
        paragraphs: [
          order.cancelledBy === 'customer'
            ? 'As requested, your order has been cancelled.'
            : 'We are sorry — your order has been cancelled by our team.',
          'If you had already paid, your refund will go back to the original payment method and we will email you once it is processed.',
        ],
      });
    case 'returned':
      return renderContent({
        ...base,
        template: 'order_returned',
        subject: `Return completed for order ${n}`,
        preheader: 'Your return is complete.',
        heading: 'Your return is complete',
        paragraphs: ['We have completed the return for your order.'],
      });
    case 'refunded':
      return renderContent({
        ...base,
        template: 'order_refund_issued',
        subject: `Refund issued for order ${n}`,
        preheader: 'Your refund has been issued.',
        heading: 'Your refund has been issued',
        paragraphs: ['A refund for your order has been issued to your original payment method.'],
      });
    default:
      return null; // pending, etc. — no email
  }
}

/* ---------- customer: tracking added / refund processed ---------- */

export function renderTrackingEmail(order: EmailOrder, awb: string, ctx: TemplateContext): Rendered {
  return renderContent({
    template: 'order_tracking_added',
    subject: `Tracking details for order ${order.orderNumber}`,
    preheader: 'Your tracking details are ready.',
    heading: 'Tracking details added',
    paragraphs: ['You can now follow your parcel with the courier.'],
    facts: [
      ...(order.courier ? ([['Courier', order.courier]] as Array<[string, string]>) : []),
      ['Tracking number (AWB)', awb],
    ],
    cta: order.trackingUrl
      ? { label: 'Track with courier', url: order.trackingUrl }
      : { label: 'Track your order', url: trackUrl(ctx, order) },
  });
}

export function renderRefundEmail(order: EmailOrder, amount: number | null, ctx: TemplateContext): Rendered {
  return renderContent({
    template: 'refund_processed',
    subject: `Refund processed for order ${order.orderNumber}`,
    preheader: 'Your refund is on its way.',
    heading: 'Your refund has been processed',
    paragraphs: ['Your refund has been processed. It can take 5–7 business days to appear in your account.'],
    facts: amount != null ? [['Refund amount', money(amount)]] : [],
    cta: { label: 'View order', url: trackUrl(ctx, order) },
  });
}

/* ---------- customer: return / exchange steps ---------- */

export function renderReturnStepEmail(
  step: string,
  order: EmailOrder,
  ret: EmailReturn,
  ctx: TemplateContext
): Rendered | null {
  const noun = ret.isExchange ? 'exchange' : 'return';
  const Noun = noun.charAt(0).toUpperCase() + noun.slice(1);
  const n = order.orderNumber;
  const item = `${ret.itemName} (${ret.itemSize})`;
  const facts: Array<[string, string]> = [['Item', item]];
  const cta: Cta = { label: `View ${noun} status`, url: trackUrl(ctx, order) };
  const mk = (template: string, subject: string, heading: string, paragraphs: string[], extra: Array<[string, string]> = []) =>
    renderContent({
      template, subject, preheader: heading, heading, paragraphs, cta,
      facts: [...facts, ...extra],
      greeting: `Hi ${firstName(order.customerName)},`,
    });

  switch (step) {
    case 'requested':
      return mk(`return_requested`, `${Noun} request received for order ${n}`, `We received your ${noun} request`,
        [`We have received your ${noun} request and will review it shortly.`], [['Reason', ret.reason]]);
    case 'approved':
      return mk('return_approved', `${Noun} approved for order ${n}`, `Your ${noun} is approved`,
        [`Your ${noun} request has been approved. We will arrange the pickup and keep you posted.`]);
    case 'rejected':
      return mk('return_rejected', `${Noun} request update for order ${n}`, `We could not approve your ${noun}`,
        [`We are sorry — we were not able to approve this ${noun} request.`],
        ret.adminNotes ? [['Note from our team', ret.adminNotes]] : []);
    case 'picked_up':
      return mk('return_picked_up', `${Noun} picked up for order ${n}`, 'We have picked up your item',
        ['The courier has picked up your item. We will let you know when it reaches us.']);
    case 'received':
      return mk('return_received', `${Noun} received for order ${n}`, 'We have received your item',
        [ret.isExchange ? 'Your item has reached us. We will ship your replacement shortly.' : 'Your item has reached us. Your refund will be issued shortly.']);
    case 'refunded':
      return mk('return_refunded', `Refund issued for order ${n}`, 'Your refund has been issued',
        ['Your refund has been issued. It can take 5–7 business days to appear in your account.'],
        ret.refundAmount != null ? [['Refund amount', money(ret.refundAmount)]] : []);
    case 'exchanged':
      return mk('exchange_shipped', `Your replacement for order ${n} has shipped`, 'Your replacement is on its way',
        ['We have shipped your replacement.'],
        ret.exchangeSize ? [['New size', ret.exchangeSize]] : []);
    default:
      return null;
  }
}

/* ---------- admin alerts ---------- */

export function renderAdminNewOrderEmail(order: EmailOrder, ctx: TemplateContext): Rendered {
  return renderContent({
    template: 'admin_new_order',
    subject: `New order ${order.orderNumber} — ${money(order.total)}`,
    preheader: `${order.customerName} placed a paid order.`,
    heading: 'New order received',
    greeting: null,
    paragraphs: [`${order.customerName} placed a paid order. It is ready to be processed.`],
    order,
    cta: { label: 'Open in admin', url: adminOrderUrl(ctx, order.id) },
  });
}

export function renderAdminOrderCancelledEmail(order: EmailOrder, ctx: TemplateContext): Rendered {
  return renderContent({
    template: 'admin_order_cancelled',
    subject: `Order ${order.orderNumber} cancelled by customer`,
    preheader: 'A customer cancelled their order.',
    heading: 'Order cancelled by customer',
    greeting: null,
    paragraphs: [
      `${order.customerName} cancelled this order. If it was paid, a refund was started automatically — check the Refund panel in admin if it did not go through.`,
    ],
    order,
    cta: { label: 'Open in admin', url: adminOrderUrl(ctx, order.id) },
  });
}

export function renderAdminNewReturnEmail(order: EmailOrder, ret: EmailReturn, ctx: TemplateContext): Rendered {
  const noun = ret.isExchange ? 'exchange' : 'return';
  return renderContent({
    template: 'admin_new_return',
    subject: `New ${noun} request — order ${order.orderNumber}`,
    preheader: `${order.customerName} requested a ${noun}.`,
    heading: `New ${noun} request`,
    greeting: null,
    paragraphs: [`${order.customerName} requested a ${noun} on order ${order.orderNumber}.`],
    facts: [
      ['Item', `${ret.itemName} (${ret.itemSize})`],
      ['Reason', ret.reason],
      ...(ret.isExchange && ret.exchangeSize ? ([['Wants size', ret.exchangeSize]] as Array<[string, string]>) : []),
    ],
    cta: { label: 'Review in admin', url: adminOrderUrl(ctx, order.id) },
  });
}
