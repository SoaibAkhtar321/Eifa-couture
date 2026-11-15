import type { Metadata } from 'next';
import Link from 'next/link';

import LegalPage from '@/components/legal/LegalPage';
import { CONTACT_INFO, SHIPPING_INFO } from '@/lib/constants';
import { buildPageMetadata } from '@/lib/seo';
import { formatPrice } from '@/lib/utils';

export const metadata: Metadata = buildPageMetadata({
  title: 'Shipping Policy',
  description:
    'Eifa Couture shipping and delivery policy: where we deliver, delivery times, shipping charges, order tracking and what to do if a parcel is delayed or damaged.',
  path: '/shipping-policy',
});

export default function ShippingPolicyPage() {
  const email = CONTACT_INFO.email;
  const { min, max } = SHIPPING_INFO.standardDeliveryDays;

  return (
    <LegalPage
      title="Shipping Policy"
      updated="15 November 2026"
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
                usually takes <strong>{min}–{max} working days</strong> from the date you place the order. Sundays and
                public holidays are not counted.
              </p>
              <p>
                The estimated delivery date for your order is shown in <strong>My Account → Orders</strong> and in your
                order emails. It is an estimate, not a guarantee: remote areas, festivals, weather and courier delays can
                add time. Made-to-order or customised pieces may take longer, and we will tell you before you pay.
              </p>
            </>
          ),
        },
        {
          heading: 'Shipping charges',
          body: (
            <>
              <p>
                Shipping is free on orders above {formatPrice(SHIPPING_INFO.freeShippingThreshold)}. Below that, a flat
                charge of {formatPrice(SHIPPING_INFO.standardShippingCost)} applies. The exact amount for your order is
                always shown at checkout before you pay, and there are no hidden fees after that.
              </p>
              <p>
                We may change shipping charges or the free-shipping amount from time to time. The charges shown at
                checkout when you place your order apply to that order.
              </p>
            </>
          ),
        },
        {
          heading: 'Tracking your order',
          body: (
            <p>
              You get email and in-app updates as your order is confirmed, packed, shipped, out for delivery and
              delivered. When it ships, we add the courier&rsquo;s tracking number. You can follow your parcel any time
              from <Link href="/track-order">Track Order</Link> or <strong>My Account → Orders</strong>.
            </p>
          ),
        },
        {
          heading: 'Delivery address and contact number',
          body: (
            <p>
              Please enter a complete address, pin code and a working phone number, because the courier will call you. We
              cannot change the address once an order has shipped. If you need to correct it before then, cancel the
              order from My Account (see our <Link href="/refund-policy">Cancellation, Returns &amp; Refunds</Link>{' '}
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
                is wrong or incomplete, or the parcel is refused, the parcel comes back to us. We will contact you to
                re-send it; the shipping cost for re-sending may be charged to you.
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
              photos and request a return from My Account within 7 days of delivery. We will arrange a pickup and a
              replacement or full refund, as set out in our{' '}
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
