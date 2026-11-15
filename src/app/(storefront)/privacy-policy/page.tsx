import type { Metadata } from 'next';

import LegalPage from '@/components/legal/LegalPage';
import { CONTACT_INFO, LEGAL_INFO } from '@/lib/constants';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Privacy Policy',
  description:
    'How Eifa Couture collects, uses, shares and protects your personal data, and how you can exercise your rights under the Digital Personal Data Protection Act, 2023.',
  path: '/privacy-policy',
});

export default function PrivacyPolicyPage() {
  const email = CONTACT_INFO.email;

  return (
    <LegalPage
      title="Privacy Policy"
      updated="15 November 2026"
      currentPath="/privacy-policy"
      intro="This policy explains what personal data Eifa Couture collects when you use this website, why we collect it, who we share it with, how long we keep it, and how you can exercise your rights. It is written to meet the Digital Personal Data Protection Act, 2023 (DPDP Act), the Information Technology Act, 2000 and the rules made under them."
      sections={[
        {
          heading: 'Who we are',
          body: (
            <p>
              {LEGAL_INFO.tradeName} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates this website and decides why and how
              your personal data is processed. Under the DPDP Act we are the <strong>Data Fiduciary</strong>. Our contact
              details are at the end of this page.
            </p>
          ),
        },
        {
          heading: 'Personal data we collect',
          body: (
            <>
              <p>We collect only what we need to run the store:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Account details:</strong> your name, email address, phone number and password (stored in
                  hashed form by our authentication provider, never in readable form). If you sign in with Google, we
                  receive your name and email address from Google.
                </li>
                <li>
                  <strong>Delivery details:</strong> the names, phone numbers and addresses you save or enter at
                  checkout.
                </li>
                <li>
                  <strong>Order information:</strong> items bought, amounts, order and payment status, delivery tracking,
                  and any cancellation, return, exchange or refund requests, including photos you upload to support a
                  return.
                </li>
                <li>
                  <strong>Shopping activity:</strong> your bag and wishlist, and reviews or ratings you choose to post.
                </li>
                <li>
                  <strong>Messages to us:</strong> what you send through the contact form, email or social media.
                </li>
                <li>
                  <strong>Technical data:</strong> IP address, browser and device type, and security logs, used to keep
                  the site safe and prevent abuse.
                </li>
              </ul>
              <p>
                <strong>Payments:</strong> card, UPI and net-banking details are entered on Razorpay&rsquo;s secure
                checkout. We never see or store your full card number, CVV, UPI PIN or banking password. We receive only
                the payment status, payment ID and payment method (for example UPI or card).
              </p>
            </>
          ),
        },
        {
          heading: 'Why we use your data',
          body: (
            <>
              <p>We process your personal data only for these purposes:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>to create and secure your account and sign you in;</li>
                <li>to take, confirm, pack, ship and deliver your orders;</li>
                <li>to process payments, cancellations, returns, exchanges and refunds;</li>
                <li>to send you order, shipping, return and refund updates by email or in-app notification;</li>
                <li>to answer your questions and provide customer support;</li>
                <li>to prevent fraud, abuse and security incidents;</li>
                <li>to meet legal obligations such as tax, accounting and consumer-protection requirements;</li>
                <li>to improve the store, using the activity described above.</li>
              </ul>
              <p>
                We do not sell your personal data, and we do not use it for advertising profiles. We will send
                marketing messages only if you ask for them, and you can stop them at any time.
              </p>
            </>
          ),
        },
        {
          heading: 'Consent and how to withdraw it',
          body: (
            <>
              <p>
                When you create an account, place an order or submit a form, you give us your data voluntarily for the
                purposes above. Where we rely on your consent, it is specific to those purposes, and you may withdraw it
                at any time as easily as you gave it by writing to <a href={`mailto:${email}`}>{email}</a>.
              </p>
              <p>
                Withdrawing consent does not affect processing done earlier. It may mean we can no longer provide parts
                of the service that need the data, such as delivering an open order. We may also keep data we are
                legally required to keep, as explained below.
              </p>
            </>
          ),
        },
        {
          heading: 'Who we share data with',
          body: (
            <>
              <p>
                We share personal data only with service providers who process it on our behalf, and only as much as they
                need:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Razorpay</strong> — to process payments and refunds.
                </li>
                <li>
                  <strong>Courier and logistics partners</strong> — your name, phone number and delivery address, to
                  deliver or collect parcels.
                </li>
                <li>
                  <strong>Supabase</strong> — database, authentication and file storage for the website.
                </li>
                <li>
                  <strong>Resend</strong> — to send transactional emails such as order confirmations.
                </li>
                <li>
                  <strong>Google</strong> — only if you choose &ldquo;Continue with Google&rdquo; to sign in.
                </li>
                <li>
                  <strong>Website hosting provider</strong> — to serve the site.
                </li>
              </ul>
              <p>
                We may also disclose data where the law requires it, for example to a court, tax authority or law
                enforcement agency acting under legal authority. Product reviews you post are public and show the name
                you review under.
              </p>
            </>
          ),
        },
        {
          heading: 'Cookies and local storage',
          body: (
            <>
              <p>
                We use only what is needed for the site to work: a sign-in session cookie so you stay logged in, and
                your browser&rsquo;s local storage to remember your bag, wishlist and recent searches on your device.
              </p>
              <p>
                We currently do not use advertising cookies or third-party analytics trackers. If we add any, we will
                update this policy and ask for your consent first. You can clear cookies and local storage in your
                browser settings; you will then be signed out and your saved bag on that device will be cleared.
              </p>
            </>
          ),
        },
        {
          heading: 'How long we keep your data',
          body: (
            <>
              <p>We keep personal data only for as long as it is needed for the purpose it was collected for:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Account and saved addresses:</strong> until you ask us to delete your account.
                </li>
                <li>
                  <strong>Order, invoice and payment records:</strong> for the period the law requires us to keep
                  accounting and tax records (generally up to 8 years), even after your account is deleted.
                </li>
                <li>
                  <strong>Support messages:</strong> for up to 3 years after the matter is closed.
                </li>
                <li>
                  <strong>Security logs:</strong> for a short period, normally not more than 12 months.
                </li>
              </ul>
              <p>When data is no longer needed, we erase it or remove the details that identify you.</p>
            </>
          ),
        },
        {
          heading: 'How we protect your data',
          body: (
            <>
              <p>
                We use encryption in transit (HTTPS), role-based access so that only authorised staff can see order and
                customer information, row-level security on our database, rate limiting on sign-in and forms, and
                payment handling by a PCI-DSS compliant provider.
              </p>
              <p>
                No system is perfectly secure. If a personal data breach affects you, we will notify you and the Data
                Protection Board of India as the law requires.
              </p>
            </>
          ),
        },
        {
          heading: 'Your rights',
          body: (
            <>
              <p>Under the DPDP Act you have the right to:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Access</strong> a summary of the personal data we hold about you, what we do with it, and the
                  other parties we share it with;
                </li>
                <li>
                  <strong>Correct</strong> inaccurate or incomplete data, and update outdated data;
                </li>
                <li>
                  <strong>Erase</strong> your data when it is no longer needed for the purpose it was collected, unless
                  the law requires us to keep it;
                </li>
                <li>
                  <strong>Withdraw consent</strong> at any time;
                </li>
                <li>
                  <strong>Grievance redressal</strong> — have a complaint about our handling of your data heard
                  (see below);
                </li>
                <li>
                  <strong>Nominate</strong> another person to exercise these rights on your behalf if you die or are
                  unable to act.
                </li>
              </ul>
              <p>
                You can view and edit your profile and addresses yourself from <strong>My Account</strong>. For anything
                else, email <a href={`mailto:${email}`}>{email}</a> from the address registered on your account. We may
                ask you to confirm your identity first. We acknowledge requests within {LEGAL_INFO.acknowledgeWithinHours}{' '}
                hours and complete them within {LEGAL_INFO.resolveWithinDays} days.
              </p>
            </>
          ),
        },
        {
          heading: 'Children',
          body: (
            <p>
              This store is meant for adults. If you are under 18, please place orders only with the involvement of a
              parent or guardian. We do not knowingly collect a child&rsquo;s personal data without verifiable parental
              consent, and we do not track or profile children or show them targeted advertising. If you believe a child
              has given us data without that consent, email us and we will delete it.
            </p>
          ),
        },
        {
          heading: 'Transfers outside India',
          body: (
            <p>
              Some of our service providers may store or process data on servers outside India. We transfer personal data
              only to the extent needed to run the store, and only to countries and providers permitted under the DPDP
              Act and the Government of India&rsquo;s notifications, and we require our providers to protect it.
            </p>
          ),
        },
        {
          heading: 'Complaints',
          body: (
            <>
              <p>
                If you are unhappy with how we handle your data, first write to our {LEGAL_INFO.grievanceOfficer.designation}
                {LEGAL_INFO.grievanceOfficer.name ? ` (${LEGAL_INFO.grievanceOfficer.name})` : ''} at{' '}
                <a href={`mailto:${email}`}>{email}</a>. We will acknowledge within {LEGAL_INFO.acknowledgeWithinHours}{' '}
                hours and respond within {LEGAL_INFO.resolveWithinDays} days.
              </p>
              <p>
                If your complaint is not resolved, you may complain to the <strong>Data Protection Board of India</strong>{' '}
                as provided by the DPDP Act.
              </p>
            </>
          ),
        },
        {
          heading: 'Changes to this policy',
          body: (
            <p>
              We may update this policy when our practices or the law change. The &ldquo;last updated&rdquo; date above
              will change, and for material changes we will notify you by email or a notice on the site.
            </p>
          ),
        },
      ]}
    />
  );
}
