/* ============================================
   EIFA COUTURE — Rate Limiter
   ============================================
   Simple in-memory fixed-window rate limiter for public write
   endpoints (auth, contact, coupon validation). No Redis/Upstash is
   in the current stack, so this is the simplest production-ready
   option: it runs inside the same Node.js process as the Next.js
   server and needs no extra infrastructure.

   Tradeoff: on a multi-instance deployment each instance keeps its
   own counters, so the effective limit is `limit * instanceCount`
   rather than a single global limit. That's an acceptable tradeoff
   for brute-force/abuse mitigation on this project's deployment
   target (single Node server), and can be swapped for a shared store
   (e.g. Upstash Redis) later without changing any call sites — only
   this file would need to change.
   ============================================ */

import type { NextRequest } from 'next/server';

interface RateLimitConfig {
  /** Max requests allowed per window. */
  limit: number;
  /** Window size in milliseconds. */
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  /** Requests remaining in the current window (0 if blocked). */
  remaining: number;
  /** Seconds until the caller should retry (only set when blocked). */
  retryAfterSeconds?: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodically drop expired buckets so the map doesn't grow forever
// under sustained traffic. Guarded for environments (edge runtime,
// tests) where `setInterval`/`unref` may not behave the same way.
const CLEANUP_INTERVAL_MS = 5 * 60_000;
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, CLEANUP_INTERVAL_MS);
// Don't keep the Node process alive just for cleanup.
cleanupTimer.unref?.();

/**
 * Checks and increments the request count for `key` within the
 * current fixed window. Call once per incoming request, before doing
 * any real work.
 */
export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return { success: true, remaining: config.limit - 1 };
  }

  if (existing.count >= config.limit) {
    return {
      success: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { success: true, remaining: config.limit - existing.count };
}

/**
 * Best-effort client IP extraction behind a proxy/CDN. Falls back to
 * a constant key if nothing is available (e.g. local dev without a
 * proxy) — requests still share a single bucket in that case rather
 * than bypassing the limiter entirely.
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]!.trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return 'unknown';
}

/**
 * Pre-configured limits for public write endpoints. Kept in one place
 * so the actual numbers are easy to find and tune.
 *
 * `coupon` is reserved for the customer-facing coupon validation
 * endpoint. That endpoint doesn't exist yet in the codebase (only
 * admin coupon management is implemented) — this config is here so
 * protecting it is a one-line `rateLimit()` call once it ships.
 *
 * `razorpayCreateOrder` / `razorpayVerify` are deliberately more
 * permissive than `login`: unlike a login attempt, a single legitimate
 * checkout can call create-order more than once (page refresh,
 * dismissed-modal retry, "Retry Payment" on order-confirmation), and
 * IPs are frequently shared across many customers behind mobile
 * carrier NAT/office networks in this market. Both routes are still
 * idempotent server-side regardless of how many times they're called.
 */
export const RATE_LIMITS = {
  login: { limit: 5, windowMs: 60_000 },
  register: { limit: 3, windowMs: 60_000 },
  forgotPassword: { limit: 3, windowMs: 15 * 60_000 },
  contact: { limit: 5, windowMs: 10 * 60_000 },
  coupon: { limit: 10, windowMs: 60_000 },
  razorpayCreateOrder: { limit: 20, windowMs: 60_000 },
  razorpayVerify: { limit: 20, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitConfig>;

export function rateLimitResponseHeaders(retryAfterSeconds: number): HeadersInit {
  return { 'Retry-After': String(retryAfterSeconds) };
}
