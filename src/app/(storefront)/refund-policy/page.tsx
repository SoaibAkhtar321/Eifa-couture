import type { Metadata } from 'next';
import Link from 'next/link';

import LegalPage from '@/components/legal/LegalPage';
import { CONTACT_INFO, RETURN_POLICY } from '@/lib/constants';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Cancellation, Returns & Refunds',
  description:
    'How to cancel an Eifa Couture order, return or exchange a piece within 7 days of delivery, and when and how refunds are paid.',
  path: '/refund-policy',
});

export default function RefundPolicyPage() {
  const { min, max } = RETURN_POLICY.refundProcessingDays;
  const email = CONTACT_INFO.email;

  return (
    <LegalPage
      title="Cancellation, Returns & Refunds"
      updated="15 November 2026"
      currentPath="/refund-policy"
      intro={`${RETURN_POLICY.message} This page explains exactly how cancellations, returns, exchanges and refunds work, step by step.`}
      sections={[
        {
          heading: 'Cancelling an order',
          body: (
            <>
              <p>
                You can cancel an order yourself from <strong>My Account → Orders</strong> at any time{' '}
                <strong>before it is shipped</strong> (while it is shown as Order placed, Confirmed or Packing). The
                cancelled order is refunded in full, including any shipping charge, as described under &ldquo;How
                refunds are paid&rdquo; below.
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
                You may request a return within <strong>{RETURN_POLICY.returnWindow} days of delivery</strong>. The
                request must be made from <strong>My Account → Orders</strong> once the order shows as Delivered. A return
                is accepted when:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                {RETURN_POLICY.conditions
                  .filter((condition) => !/refund/i.test(condition) && !/exchange/i.test(condition))
                  .map((condition) => (
                    <li key={condition}>{condition}</li>
                  ))}
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
              possible and within the {RETURN_POLICY.returnWindow}-day window, and attach clear photos in the request.
              These returns are accepted even if the tags have been removed to check the piece, and we cover the return
              pickup and refund your shipping charge.
            </p>
          ),
        },
        {
          heading: 'Exchanges',
          body: (
            <p>
              If a size does not fit, you can request an <strong>exchange for a different size of the same piece and
              colour</strong> from the same place, within {RETURN_POLICY.exchangeWindow} days of delivery and subject to
              stock. If your size is not available, we will refund you instead.
            </p>
          ),
        },
        {
          heading: 'What cannot be returned',
          body: (
            <ul className="list-disc space-y-2 pl-5">
              <li>Customised, altered or made-to-measure pieces, and bridal pieces.</li>
              <li>Sale or clearance items marked as final sale.</li>
              <li>Items that have been worn, washed, altered, or are missing tags or original packaging.</li>
              <li>Requests made after the {RETURN_POLICY.returnWindow}-day return window has closed.</li>
            </ul>
          ),
        },
        {
          heading: 'How a return works',
          body: (
            <ol className="list-decimal space-y-2 pl-5">
              <li>Open the delivered order in My Account and choose Return / Exchange for the item.</li>
              <li>Pick the reason (and the new size for an exchange) and add photos if the item is damaged or wrong.</li>
              <li>We review the request and email you whether it is approved. A rejected request comes with a reason.</li>
              <li>
                If approved, we arrange a pickup from your delivery address where our courier serves your pincode.
                Otherwise we will tell you how to send it back. Pack the item in its original packaging with the tags.
              </li>
              <li>
                When the item reaches us and passes inspection, we issue your refund or dispatch your exchange. You can
                follow each step in My Account.
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
                  <strong>Returned items:</strong> the price of the returned items is refunded after we receive and
                  inspect them.
                </li>
                <li>
                  <strong>Shipping charges:</strong> refunded when we cancel the order, or when the return is because of
                  a damaged, defective or wrong item. For other returns the original shipping charge is not refunded.
                </li>
                <li>
                  <strong>Timeline:</strong> we start the refund promptly, and it reaches your account within{' '}
                  {min}–{max} working days after we start it. Some banks and card issuers take a few extra days to show
                  it on your statement.
                </li>
              </ul>
              <p>
                If an online payment is debited but your order is not confirmed, the amount is reversed automatically,
                normally within {min}–{max} working days. If it is not, email us your payment reference and we will
                follow it up with Razorpay.
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
