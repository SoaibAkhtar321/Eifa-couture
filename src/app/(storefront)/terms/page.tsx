import type { Metadata } from 'next';

import { buildPageMetadata } from '@/lib/seo';

import LegalPage from '@/components/legal/LegalPage';

export const metadata: Metadata = buildPageMetadata({
  title: 'Terms of Service',
  description:
    'The terms that apply when you browse and place orders on the Eifa Couture website.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="November 2026"
      intro="By using this website or placing an order with Eifa Couture you agree to the terms below."
      sections={[
        {
          heading: 'Products',
          body: (
            <p>
              Our pieces are hand-embroidered, so small variations in thread work, colour and finish are part of the craft
              and not defects. Colours may look slightly different depending on your screen.
            </p>
          ),
        },
        {
          heading: 'Pricing & orders',
          body: (
            <p>
              Prices are in Indian Rupees and include applicable taxes unless stated otherwise. An order is confirmed once
              you receive a confirmation. We may cancel an order and refund any amount paid if an item is unavailable or a
              pricing error occurs.
            </p>
          ),
        },
        {
          heading: 'Accounts',
          body: (
            <p>
              You are responsible for keeping your login details secure and for activity on your account.
            </p>
          ),
        },
        {
          heading: 'Governing law',
          body: <p>These terms are governed by the laws of India; courts in Lucknow, Uttar Pradesh have jurisdiction.</p>,
        },
      ]}
    />
  );
}
