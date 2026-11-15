import type { Metadata } from 'next';

import { buildPageMetadata } from '@/lib/seo';

import LegalPage from '@/components/legal/LegalPage';
import { RETURN_POLICY } from '@/lib/constants';

export const metadata: Metadata = buildPageMetadata({
  title: 'Shipping, Returns & Refunds',
  description:
    'Eifa Couture shipping, delivery, return, exchange and refund policy for handcrafted Chikankari orders.',
  path: '/refund-policy',
});

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Shipping, Returns & Refunds"
      updated="November 2026"
      intro={RETURN_POLICY.message}
      sections={[
        {
          heading: 'Returns & exchanges',
          body: (
            <ul className="list-disc space-y-2 pl-5">
              {RETURN_POLICY.conditions.map((condition) => (
                <li key={condition}>{condition}</li>
              ))}
            </ul>
          ),
        },
        {
          heading: 'Refunds',
          body: (
            <p>
              Once a return is received and inspected, refunds are issued to the original payment method within{' '}
              {RETURN_POLICY.refundProcessingDays.min}–{RETURN_POLICY.refundProcessingDays.max} working days.
            </p>
          ),
        },
        {
          heading: 'Shipping',
          body: (
            <p>
              Orders are hand-packed and dispatched from Lucknow. Shipping charges, if any, are shown at checkout before you
              place your order. You can follow your parcel from the Track Order page.
            </p>
          ),
        },
      ]}
    />
  );
}
