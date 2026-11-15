import type { Metadata } from 'next';

import LegalPage from '@/components/legal/LegalPage';
import { LEGAL_LAST_UPDATED } from '@/lib/constants';
import { buildFaqGroups } from '@/lib/faq';
import { getPolicyValues } from '@/lib/policy';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Frequently Asked Questions',
  description:
    'Answers about ordering without an account, payment, free delivery, delivery time, cancellations, returns, exchanges and refunds at Eifa Couture.',
  path: '/faq',
});

export default async function FaqPage() {
  const policy = await getPolicyValues();
  const groups = buildFaqGroups(policy);

  // FAQPage markup. Google no longer shows FAQ rich results, but the markup
  // is still valid and helps assistants and answer engines read the page.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: groups.flatMap((group) =>
      group.items.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    ),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <LegalPage
        title="Frequently Asked Questions"
        updated={LEGAL_LAST_UPDATED}
        currentPath="/faq"
        intro="Quick answers about ordering, delivery, returns and refunds. The full rules are in our Shipping Policy and Cancellation, Returns & Refunds pages."
        sections={groups.map((group) => ({
          heading: group.heading,
          body: (
            <div className="space-y-5">
              {group.items.map((item) => (
                <div key={item.q}>
                  <h3 className="font-subheading text-base text-charcoal">{item.q}</h3>
                  <p className="mt-1">{item.a}</p>
                </div>
              ))}
            </div>
          ),
        }))}
      />
    </>
  );
}
