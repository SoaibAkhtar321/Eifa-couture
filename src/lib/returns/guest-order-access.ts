/* ============================================
   EIFA COUTURE — Guest order access (server only)
   ============================================
   A guest who ordered without an account and is now on another
   device or browser has no session that owns the order. They prove
   access with the order number AND the email typed at checkout.

   Rules:
   - Only orders owned by an ANONYMOUS (guest) user can be reached
     this way. Orders of signed-in customers need a real sign-in.
   - Every failure (no such order, wrong email, signed-in customer's
     order) returns the SAME generic response, so nothing about an
     order can be learned by guessing.
   - Rate limits are applied by the callers, per IP and per order.
   ============================================ */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getClientIp, rateLimit, rateLimitResponseHeaders, RATE_LIMITS } from '@/lib/rate-limit';
import { createServiceClient } from '@/lib/supabase/service';

export const GUEST_NOT_FOUND_MESSAGE =
  'We could not find an order with those details. Check the order number and the email used at checkout.';

export const guestCredentialsSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .transform((v) => v.toUpperCase())
    .refine((v) => /^[A-Z0-9-]+$/.test(v)),
  email: z.string().trim().toLowerCase().email().max(254),
});

export type GuestCredentials = z.infer<typeof guestCredentialsSchema>;

export interface GuestOrder {
  id: string;
  user_id: string;
  order_number: string;
  status: string;
  payment_status: string;
  placed_at: string;
  delivered_at: string | null;
}

export const guestNotFound = () =>
  NextResponse.json({ error: { message: GUEST_NOT_FOUND_MESSAGE } }, { status: 404 });

/** Applies the IP and per-order limits. Returns a 429 response when blocked. */
export async function guestRateLimited(
  request: NextRequest,
  orderNumber: string,
  scope: string
): Promise<NextResponse | null> {
  const [ip, perOrder] = await Promise.all([
    rateLimit(`${scope}:ip:${getClientIp(request)}`, RATE_LIMITS.guestLookup),
    rateLimit(`${scope}:order:${orderNumber}`, RATE_LIMITS.guestLookupPerOrder),
  ]);
  if (ip.success && perOrder.success) return null;

  const retry = Math.max(ip.retryAfterSeconds ?? 0, perOrder.retryAfterSeconds ?? 0, 1);
  return NextResponse.json(
    { error: { message: 'Too many attempts. Please wait a few minutes and try again.' } },
    { status: 429, headers: rateLimitResponseHeaders(retry) }
  );
}

/** Returns the order only when number + email match AND it is a guest order. */
export async function findGuestOrder(credentials: GuestCredentials): Promise<GuestOrder | null> {
  const service = createServiceClient();

  const { data: order } = await service
    .from('orders')
    .select('id, user_id, order_number, status, payment_status, placed_at, delivered_at, shipping_address')
    .eq('order_number', credentials.orderNumber)
    .maybeSingle();

  if (!order) return null;

  const address = (order.shipping_address ?? {}) as { email?: unknown };
  const orderEmail = typeof address.email === 'string' ? address.email.trim().toLowerCase() : '';
  if (!orderEmail || orderEmail !== credentials.email) return null;

  const { data: owner } = await service.auth.admin.getUserById(order.user_id);
  const isGuest = (owner?.user as { is_anonymous?: boolean } | null | undefined)?.is_anonymous === true;
  if (!isGuest) return null;

  return {
    id: order.id,
    user_id: order.user_id,
    order_number: order.order_number,
    status: order.status,
    payment_status: order.payment_status,
    placed_at: order.placed_at,
    delivered_at: order.delivered_at ?? null,
  };
}
