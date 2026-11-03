import type { Metadata } from 'next';

import LegalPage from '@/components/legal/LegalPage';

export const metadata: Metadata = { title: 'Privacy Policy | Eifa Couture' };

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="November 2026"
      intro="This policy explains what personal information Eifa Couture collects when you use this website, why we collect it, and how it is protected."
      sections={[
        {
          heading: 'Information we collect',
          body: (
            <p>
              Your name, email address and phone number when you create an account; delivery addresses you save; order
              history; wishlist and bag contents; and reviews you choose to post. Payments are handled by our payment
              partner — we never see or store your full card details.
            </p>
          ),
        },
        {
          heading: 'How we use it',
          body: (
            <p>
              To process and deliver orders, provide customer support, send order updates, prevent fraud, and improve the
              store. We do not sell your personal information.
            </p>
          ),
        },
        {
          heading: 'Sharing',
          body: (
            <p>
              Only with service providers needed to run the store — hosting and database, payment processing, and courier
              partners for delivery — and where required by law.
            </p>
          ),
        },
        {
          heading: 'Your choices',
          body: (
            <p>
              You can view and edit your profile and addresses from your account at any time, or contact us to request
              deletion of your account and associated data.
            </p>
          ),
        },
      ]}
    />
  );
}
