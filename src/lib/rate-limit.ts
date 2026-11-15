/* ============================================
   EIFA COUTURE — Rate Limiter
   ============================================
   Fixed-window rate limiter for public write endpoints.

   Two backends, same call sites:
   - Upstash Redis (shared across all serverless instances) when
     UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set.
     This is the real protection on Vercel.
   - In-memory per instance otherwise (local dev, or if Upstash is
     not configured / temporarily unreachable). On Vercel each
     instance has its own counters, so this fallback is weak.

   If Upstash errors or times out we fall back to memory instead of
   blocking customers: a Redis outage must never take checkout down.
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

function memoryRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
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

interface UpstashReply {
  result?: unknown;
  error?: string;
}

/** Shared fixed-window counter in Upstash Redis (REST). Returns null on any failure. */
async function upstashRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;

  const redisKey = `rl:${key}`;
  try {
    const res = await fetch(`${url.replace(/\/+$/, '')}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['INCR', redisKey],
        // Start the window on the first hit only (NX): later hits keep the same expiry.
        ['PEXPIRE', redisKey, config.windowMs, 'NX'],
        ['PTTL', redisKey],
      ]),
      cache: 'no-store',
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return null;

    const replies = (await res.json()) as UpstashReply[];
    const count = Number(replies[0]?.result);
    const ttlMs = Number(replies[2]?.result);
    if (!Number.isFinite(count) || replies.some((r) => r.error)) return null;

    if (count > config.limit) {
      const waitMs = Number.isFinite(ttlMs) && ttlMs > 0 ? ttlMs : config.windowMs;
      return { success: false, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil(waitMs / 1000)) };
    }
    return { success: true, remaining: Math.max(0, config.limit - count) };
  } catch {
    // Never log the key: it can contain an IP address or an order number.
    console.error('[rate-limit] Upstash unavailable, using in-memory fallback');
    return null;
  }
}

/**
 * Checks and increments the request count for `key` within the current fixed
 * window. Call (and await) once per incoming request, before doing real work.
 */
export async function rateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const shared = await upstashRateLimit(key, config);
  return shared ?? memoryRateLimit(key, config);
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
  /** Guest checkout session creation — keyed by IP. Shared mobile
   *  carrier IPs are common, so this is generous but still bounded. */
  guestSession: { limit: 10, windowMs: 10 * 60_000 },
  coupon: { limit: 10, windowMs: 60_000 },
  razorpayCreateOrder: { limit: 20, windowMs: 60_000 },
  razorpayVerify: { limit: 20, windowMs: 60_000 },
  /** Admin refund issuance — keyed by admin user id (see the refund
   *  route), not IP, since admins may share an office network. Loose
   *  enough not to interfere with legitimate use, tight enough to
   *  slow down a compromised admin session or a UI double-click bug
   *  from firing many refunds in a row. */
  adminRefund: { limit: 20, windowMs: 60_000 },
  /** Customer self-cancel — keyed by user id. Generous for a real
   *  customer (a few orders), tight against scripted abuse. */
  orderCancel: { limit: 5, windowMs: 60_000 },
  /** Customer return/exchange request — keyed by user id. */
  returnRequest: { limit: 5, windowMs: 60_000 },
  /** Guest order lookup / guest return (order number + email) — keyed by
   *  IP and again by order number, so one order's email cannot be guessed. */
  guestLookup: { limit: 10, windowMs: 10 * 60_000 },
  guestLookupPerOrder: { limit: 8, windowMs: 15 * 60_000 },
} as const satisfies Record<string, RateLimitConfig>;

export function rateLimitResponseHeaders(retryAfterSeconds: number): HeadersInit {
  return { 'Retry-After': String(retryAfterSeconds) };
}
