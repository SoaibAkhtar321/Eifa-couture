# Razorpay live mode (Eifa Couture)

## 1. Environment variables the code reads (names only)
| Variable | Read in | Notes |
|---|---|---|
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `src/lib/razorpay.ts`, `src/lib/payments.ts` (browser) | Public. Inlined at BUILD time: redeploy after changing it. |
| `RAZORPAY_KEY_SECRET` | `src/lib/razorpay.ts` | Server only. Orders, refunds, checkout signature. |
| `RAZORPAY_WEBHOOK_SECRET` | `src/lib/razorpay.ts` | Server only. A different secret from the key secret. |
| `SUPABASE_SERVICE_ROLE_KEY` | `src/lib/supabase/service.ts` | Server only. |
| `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO` | `src/lib/email/send.ts` | `EMAIL_FROM` must be on a verified Resend domain. |
| `NEXT_PUBLIC_SITE_URL` | `src/lib/email/dispatch.ts` | Optional. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `src/lib/auth/turnstile-client.ts` | Optional, public. |

## 2. Set the live keys (you paste them yourself, never in chat)
Test keys start `rzp_test_`, live keys `rzp_live_`. Key id and key secret must come from the same mode.

**Local (`.env.local`, gitignored):** keep TEST keys here. Open `C:\Eifa-couture\.env.local` in an editor, set the three Razorpay variables, save. Do not commit it.

**Vercel:** Project -> Settings -> Environment Variables.
1. For each of `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`: edit or add the variable.
2. Preview and Development: test values. Production: live values (untick the other environments for the live entry).
3. Mark the two secrets Sensitive.
4. Redeploy Production (Deployments -> latest -> Redeploy). The public key id only changes after a new build.

## 3. Live webhook (Razorpay dashboard, live mode)
Account & Settings -> Webhooks -> Add New Webhook.
- URL: `https://eifacouture.com/api/webhooks/razorpay`
- Secret: choose a long random value; put the same value in Vercel as `RAZORPAY_WEBHOOK_SECRET` (Production).
- Events (exactly what the code handles): `payment.authorized`, `payment.captured`, `payment.failed`, `refund.processed`, `refund.failed`.
- Settings -> Payment Capture: automatic. Otherwise payments authorize but never settle.

## 4. Code path verified by reading the code
- Create order: `/api/payments/razorpay/create-order`, owner-checked, amount from the DB total, idempotent replay, blocked for paid or deliberately cancelled orders. Rate limit now uses `razorpayCreateOrder` (it was using the stricter login limit).
- Verify: `/api/payments/razorpay/verify`, owner-checked, order id must match, HMAC check (timing-safe), then idempotent `mark_order_paid`.
- Webhook: raw-body HMAC check, fails closed if the secret is missing, unknown orders acknowledged, settlement idempotent, refund events reconciled.
- Guest and signed-in users share this path (guests have an anonymous session that owns the order).
- Test and live behave the same; only the keys differ.
Not exercised against live Razorpay: that is what step 5 is for.

## 5. Live smoke test
1. Production deployed with live keys; webhook created.
2. Place one small real order (lowest-priced item) as a guest. Pay by UPI or card.
3. Confirm: order shows Paid in /admin, the confirmation page and customer email arrive, the store alert email arrives, Razorpay dashboard shows the payment captured, and a webhook delivery with 200.
4. Mark it Delivered, request a return from the order page, approve -> picked up -> received in /admin/returns.
5. Click the refund button; confirm status goes processing -> processed, the customer email arrives, and the money reaches the original payment method (UPI/cards can take several working days).
6. Repeat once as a signed-in customer if you want both paths proven.

## 6. Keys
Rotate (Razorpay -> API Keys -> Regenerate) any key that was ever committed, pasted in chat, screenshotted or shared, including old test keys, and update Vercel. A repo history scan found no live key patterns, but anything shared outside your password manager counts as exposed.

## 7. After launch: watch
- Razorpay dashboard: failed payments, webhook delivery failures (Webhooks -> logs; Razorpay disables a webhook after repeated failures).
- Orders paid in Razorpay but still Pending in /admin (webhook or verify failure).
- Refunds stuck in processing or failed (/admin/orders refund panel).
- Returns stuck in requested, approved or received for more than a few days (/admin/returns).
- Orders flagged needs-stock-review.
- Resend dashboard: bounced or failed emails.
