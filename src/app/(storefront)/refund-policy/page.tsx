import type { Metadata } from 'next';
import Link from 'next/link';

import LegalPage from '@/components/legal/LegalPage';
import { CONTACT_INFO, LEGAL_LAST_UPDATED, RETURN_POLICY } from '@/lib/constants';
import { getPolicyValues } from '@/lib/policy';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Cancellation, Returns & Refunds',
  description:
    'How to cancel an Eifa Couture order, request a return or exchange after delivery, and when and how refunds are paid.',
  path: '/refund-policy',
});

export default async function RefundPolicyPage() {
  const policy = await getPolicyValues();
  const { min, max } = policy.refundDays;
  const windowDays = policy.returnWindowDays;
  const email = CONTACT_INFO.email;

  return (
    <LegalPage
      title="Cancellation, Returns & Refunds"
      updated={LEGAL_LAST_UPDATED}
      currentPath="/refund-policy"
      intro={`${RETURN_POLICY.message} This page explains how cancellations, returns, exchanges and refunds work, step by step. All orders are paid in advance online; we do not offer cash on delivery.`}
      sections={[
        {
          heading: 'Cancelling an order',
          body: (
            <>
              <p>
                You can cancel an order yourself <strong>before it is shipped</strong> (while it is shown as Order
                placed, Confirmed or Packing). Signed-in customers cancel from <strong>My Account → Orders</strong>.
                If you checked out as a guest, open your order from <Link href="/track-order">Track Order</Link> with
                your order number and email. A cancelled order is refunded in full, as
                described under &ldquo;How refunds are paid&rdquo; below.
              </p>
              <p>
                Once an order has been shipped it can no longer be cancelled, but you can request a return after it is
                delivered. If you need help with an order you cannot cancel yourself, write to{' '}
                <a href={`mailto:${email}`}>{email}</a> with your order number.
              </p>
              <p>
                We may cancel an order if an item is unavailable, a price was clearly wrong, or we cannot deliver to your
                address. In that case you are refunded in full and informed by email.
              </p>
            </>
          ),
        },
        {
          heading: 'Returns',
          body: (
            <>
              <p>
                You may request a return within <strong>{windowDays} days of delivery</strong>, once the order shows as
                Delivered. Signed-in customers request it from <strong>My Account → Orders</strong>. Guest customers can
                do it from the same browser they ordered with, or from <Link href="/track-order">Track Order</Link> using
                the order number and email used at checkout. A return is accepted when:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                {RETURN_POLICY.conditions.map((condition) => (
                  <li key={condition}>{condition}</li>
                ))}
                <li>The request is made inside the {windowDays}-day window above.</li>
              </ul>
              <p>
                Handcrafted variations in thread work, shade and finish are part of Chikankari and are not defects. Slight
                differences between a photo and the piece in your hands are not a reason for return on their own, but if
                you feel a piece is not as described, tell us and we will look at it fairly.
              </p>
            </>
          ),
        },
        {
          heading: 'Damaged, defective or wrong items',
          body: (
            <p>
              If your piece arrives damaged, defective or is not the item you ordered, request a return as soon as
              possible and within the {windowDays}-day window, and attach clear photos in the request. We review these
              requests with priority.
            </p>
          ),
        },
        {
          heading: 'Exchanges',
          body: (
            <p>
              If a size does not fit, you can request an <strong>exchange for a different size of the same piece and
              colour</strong> from the same place as a return, within {windowDays} days of delivery and subject to
              stock. If the size you want is not available, you can request a return instead.
            </p>
          ),
        },
        {
          heading: 'How a return works',
          body: (
            <ol className="list-decimal space-y-2 pl-5">
              <li>Open the delivered order and choose Return / Exchange for the item and quantity.</li>
              <li>Pick the reason (and the new size for an exchange) and add photos if the item is damaged or wrong.</li>
              <li>
                We review the request and email you whether it is approved. A rejected request comes with a reason.
              </li>
              <li>
                If approved, we arrange a courier pickup. Once the pickup is booked, the courier name, tracking number
                and pickup date (where we have them) are shown with your order. Please keep the item packed in its
                original packaging with the tags until it is collected.
              </li>
              <li>
                When the item reaches us and has been checked, we issue your refund or dispatch your exchange. You can
                follow each step on your order, and we email you when the refund is issued.
              </li>
            </ol>
          ),
        },
        {
          heading: 'How refunds are paid',
          body: (
            <>
              <p>
                Refunds are always made to the <strong>original payment method</strong> (the UPI account, card or bank
                account you paid with) through Razorpay. We do not refund in cash or to a different account.
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Cancelled before shipping:</strong> the full amount, including shipping, is refunded.
                </li>
                <li>
                  <strong>Returned items:</strong> the refund is issued only after the item has reached us and been
                  checked. You are refunded what you actually paid for the returned items. If you used a coupon, its
                  discount is shared across the items in the order, so a returned item is refunded its share of the
                  amount you paid. Partial returns are refunded for the returned quantity only.
                </li>
                <li>
                  <strong>Timeline:</strong> we start the refund after we have received and checked the item, and it
                  reaches your account within {min}–{max} working days after we start it. Some banks and card issuers
                  take a few extra days to show it on your statement.
                </li>
              </ul>
              <p>
                If an online payment is debited but your order is not confirmed, the amount is normally reversed within{' '}
                {min}–{max} working days. If it is not, email us your payment reference and we will follow it up with
                Razorpay.
              </p>
            </>
          ),
        },
        {
          heading: 'Need help?',
          body: (
            <p>
              Write to <a href={`mailto:${email}`}>{email}</a> with your order number. For delivery timelines and
              charges, see our <Link href="/shipping-policy">Shipping Policy</Link>. These rules are part of our{' '}
              <Link href="/terms">Terms of Service</Link> and do not reduce your rights under the Consumer Protection
              Act, 2019.
            </p>
          ),
        },
      ]}
    />
  );
}
