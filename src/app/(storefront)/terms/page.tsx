import type { Metadata } from 'next';
import Link from 'next/link';

import LegalPage from '@/components/legal/LegalPage';
import { CONTACT_INFO, LEGAL_INFO } from '@/lib/constants';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Terms of Service',
  description:
    'The terms that apply when you browse, create an account and place orders on the Eifa Couture website, including pricing, payments, delivery and your rights as a consumer.',
  path: '/terms',
});

export default function TermsPage() {
  const email = CONTACT_INFO.email;

  return (
    <LegalPage
      title="Terms of Service"
      updated="15 November 2026"
      currentPath="/terms"
      intro="These terms apply when you visit this website or place an order with Eifa Couture. By using the site or placing an order, you agree to them. Please read them together with our Privacy Policy, Shipping Policy and Cancellation, Returns & Refunds policy."
      sections={[
        {
          heading: 'About us',
          body: (
            <p>
              This website is operated by {LEGAL_INFO.tradeName}
              {LEGAL_INFO.legalName ? ` (${LEGAL_INFO.legalName})` : ''}, {CONTACT_INFO.address.line1},{' '}
              {CONTACT_INFO.address.line2}, India. You can reach us at <a href={`mailto:${email}`}>{email}</a>
              {CONTACT_INFO.phone ? ` or ${CONTACT_INFO.phone}` : ''}.
            </p>
          ),
        },
        {
          heading: 'Eligibility and your account',
          body: (
            <>
              <p>
                You must be at least 18 years old, or use the site with a parent or guardian&rsquo;s involvement, and be
                able to enter a legally binding contract under Indian law.
              </p>
              <p>
                You need an account to place an order. Give accurate information, keep your login details confidential,
                and tell us at once if you think someone else has used your account. You are responsible for activity on
                your account. We may suspend or close accounts that are used for fraud, abuse or in breach of these
                terms.
              </p>
            </>
          ),
        },
        {
          heading: 'Our products',
          body: (
            <p>
              Our pieces are hand-embroidered Lucknowi Chikankari. Small variations in thread work, stitching, shade and
              finish are a natural part of handcrafted work and are not defects. Colours may look slightly different on
              different screens. Size charts are approximate body measurements; please check the size guide before
              ordering. Product photos are for illustration, and we make every effort to describe fabric, colour and care
              accurately.
            </p>
          ),
        },
        {
          heading: 'Prices and taxes',
          body: (
            <p>
              All prices are in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise. Any
              shipping charge is shown separately at checkout before you pay, and the total you pay is shown before you
              confirm the order. We may change prices at any time, but the price shown when you place the order is the
              price you pay.
            </p>
          ),
        },
        {
          heading: 'Placing an order',
          body: (
            <>
              <p>
                Placing an order is an offer to buy. The contract is formed when we confirm your order and your payment
                is received. We may decline or cancel an order, and refund anything you have paid in full, if an item is
                out of stock, a price or description was clearly wrong, the delivery address cannot be served, or we
                suspect fraud.
              </p>
              <p>
                You can cancel an order yourself from <strong>My Account</strong> until it is shipped. See{' '}
                <Link href="/refund-policy">Cancellation, Returns &amp; Refunds</Link>.
              </p>
            </>
          ),
        },
        {
          heading: 'Payments',
          body: (
            <>
              <p>
                Payments are made online through Razorpay using the methods shown at checkout (such as UPI, cards, net
                banking and wallets). Payment is taken in advance; we do not currently offer cash on delivery. Your
                payment details are handled by Razorpay and its banking partners under their own terms, and we do not
                store them.
              </p>
              <p>
                If money is debited but the order is not confirmed, the amount is normally reversed to your account by
                the bank or Razorpay within 5–7 working days. Contact us with your payment reference if it is not.
              </p>
            </>
          ),
        },
        {
          heading: 'Delivery',
          body: (
            <p>
              We deliver across India, with delivery times and charges as set out in our{' '}
              <Link href="/shipping-policy">Shipping Policy</Link>. Delivery dates are estimates, not guarantees, and may
              be affected by courier delays, weather, festivals or events outside our control.
            </p>
          ),
        },
        {
          heading: 'Cancellations, returns and refunds',
          body: (
            <p>
              Your rights to cancel, return, exchange and receive refunds are set out in our{' '}
              <Link href="/refund-policy">Cancellation, Returns &amp; Refunds policy</Link>, which forms part of these
              terms. Nothing in these terms limits your rights under the Consumer Protection Act, 2019.
            </p>
          ),
        },
        {
          heading: 'Reviews and content you submit',
          body: (
            <p>
              You may post honest reviews of products you have bought. You must not post anything unlawful, abusive,
              misleading or that infringes someone else&rsquo;s rights. By posting, you allow us to display the review on
              the site. We may remove content that breaks these rules. We do not pay for or reward reviews in exchange for
              positive ratings.
            </p>
          ),
        },
        {
          heading: 'Acceptable use',
          body: (
            <ul className="list-disc space-y-2 pl-5">
              <li>Do not use the site for anything unlawful or fraudulent.</li>
              <li>Do not attempt to access other people&rsquo;s accounts, the admin area, or our systems without permission.</li>
              <li>Do not scrape, overload, or interfere with the site, or use bots to place orders in bulk.</li>
              <li>Do not misuse offers, coupons or the returns process.</li>
            </ul>
          ),
        },
        {
          heading: 'Intellectual property',
          body: (
            <p>
              The Eifa Couture name, logo, designs, photographs, product descriptions and website content belong to us or
              our licensors. You may view and use them for your personal shopping only. You may not copy, reproduce or
              use them commercially without our written permission.
            </p>
          ),
        },
        {
          heading: 'Limitation of liability',
          body: (
            <p>
              To the extent the law allows, we are not liable for indirect or consequential loss, or for delays or
              failures caused by events beyond our reasonable control. Our total liability for any order is limited to
              the amount you paid for that order. Nothing in these terms excludes liability that cannot be excluded by law,
              including for fraud or for your statutory consumer rights.
            </p>
          ),
        },
        {
          heading: 'Privacy',
          body: (
            <p>
              How we collect and use your personal data is explained in our{' '}
              <Link href="/privacy-policy">Privacy Policy</Link>.
            </p>
          ),
        },
        {
          heading: 'Grievances and complaints',
          body: (
            <p>
              For any complaint about an order, product, or the site, write to our{' '}
              {LEGAL_INFO.grievanceOfficer.designation}
              {LEGAL_INFO.grievanceOfficer.name ? `, ${LEGAL_INFO.grievanceOfficer.name},` : ''} at{' '}
              <a href={`mailto:${email}`}>{email}</a>. We acknowledge complaints within{' '}
              {LEGAL_INFO.acknowledgeWithinHours} hours and aim to resolve them within {LEGAL_INFO.resolveWithinDays} days.
              You may also approach the National Consumer Helpline (1915) or file a complaint on the National Consumer
              Helpline portal.
            </p>
          ),
        },
        {
          heading: 'Governing law and disputes',
          body: (
            <p>
              These terms are governed by the laws of India. We hope to resolve any dispute through the complaint process
              above first. Subject to your rights as a consumer to approach any competent consumer commission, the courts
              at Lucknow, Uttar Pradesh have jurisdiction.
            </p>
          ),
        },
        {
          heading: 'Changes to these terms',
          body: (
            <p>
              We may update these terms from time to time. The version in force when you place an order applies to that
              order. The &ldquo;last updated&rdquo; date above shows when they last changed.
            </p>
          ),
        },
      ]}
    />
  );
}
