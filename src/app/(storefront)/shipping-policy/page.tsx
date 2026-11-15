import type { Metadata } from 'next';
import Link from 'next/link';

import LegalPage from '@/components/legal/LegalPage';
import { CONTACT_INFO, LEGAL_LAST_UPDATED } from '@/lib/constants';
import { getPolicyValues } from '@/lib/policy';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Shipping Policy',
  description:
    'Eifa Couture shipping and delivery policy: where we deliver, delivery times, free delivery, order tracking and what to do if a parcel is delayed or damaged.',
  path: '/shipping-policy',
});

export default async function ShippingPolicyPage() {
  const policy = await getPolicyValues();
  const email = CONTACT_INFO.email;
  const { min, max } = policy.deliveryDays;

  return (
    <LegalPage
      title="Shipping Policy"
      updated={LEGAL_LAST_UPDATED}
      currentPath="/shipping-policy"
      intro="Every Eifa Couture piece is hand-packed in Lucknow and sent with care. This page explains where we deliver, how long it takes, what it costs and how to track your parcel."
      sections={[
        {
          heading: 'Where we deliver',
          body: (
            <p>
              We deliver to most pin codes across India through our courier partners. We do not currently ship outside
              India. If a courier does not serve your pin code, we will tell you after you order and offer a refund or a
              different delivery address.
            </p>
          ),
        },
        {
          heading: 'Delivery time',
          body: (
            <>
              <p>
                Orders are hand-packed and handed to the courier shortly after they are confirmed. Standard delivery
                usually takes <strong>{min}–{max} working days</strong> from the date you place the order.
              </p>
              <p>
                The estimated delivery date for your order is shown in <strong>My Account → Orders</strong> and in your
                order emails. It is an estimate, not a guarantee: remote areas, festivals, weather and courier delays can
                add time. Made-to-order or customised pieces may take longer.
              </p>
            </>
          ),
        },
        {
          heading: 'Delivery charges',
          body: (
            <p>
              There is no delivery or shipping charge. Delivery is free on every order, whatever the order value, and
              the total shown at checkout is the total you pay. Payment is taken in advance online; we do not offer
              cash on delivery.
            </p>
          ),
        },
        {
          heading: 'Tracking your order',
          body: (
            <p>
              You get email updates as your order moves along, and signed-in customers also get in-app updates. When it
              ships, we add the courier&rsquo;s tracking number where one is available. You can follow your order any
              time from <Link href="/track-order">Track Order</Link> using your order number and email (this works for
              guest orders too), or from <strong>My Account → Orders</strong>.
            </p>
          ),
        },
        {
          heading: 'Delivery address and contact number',
          body: (
            <p>
              Please enter a complete address, pin code and a working phone number, because the courier will call you. We
              cannot change the address once an order has shipped. If you need to correct it before then, cancel the
              order (see our <Link href="/refund-policy">Cancellation, Returns &amp; Refunds</Link>{' '}
              policy) or write to <a href={`mailto:${email}`}>{email}</a> straight away.
            </p>
          ),
        },
        {
          heading: 'Failed or delayed delivery',
          body: (
            <>
              <p>
                If the courier cannot reach you, they normally try again. If delivery keeps failing because the address
                is wrong or incomplete, or the parcel is refused, the parcel comes back to us. We will contact you
                about re-sending it.
              </p>
              <p>
                If your order has not arrived by the estimated date, email <a href={`mailto:${email}`}>{email}</a> with
                your order number and we will chase the courier.
              </p>
            </>
          ),
        },
        {
          heading: 'Damaged or wrong parcel',
          body: (
            <p>
              Please check the parcel when it arrives. If it is visibly damaged, or the item is wrong or damaged, take
              photos and request a return from your order within {policy.returnWindowDays} days of delivery. What happens next is set
              out in our{' '}
              <Link href="/refund-policy">Cancellation, Returns &amp; Refunds policy</Link>.
            </p>
          ),
        },
        {
          heading: 'Ownership and risk',
          body: (
            <p>
              The parcel is yours once it is delivered to the address you gave. Until then, loss or damage in transit is
              our responsibility and we will resolve it with the courier at no cost to you.
            </p>
          ),
        },
      ]}
    />
  );
}
