import type { Metadata } from 'next';
import Link from 'next/link';

import { CONTACT_INFO, SOCIAL_LINKS } from '@/lib/constants';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Contact Us',
  description:
    'Contact Eifa Couture for product enquiries, order support, custom requests, and handcrafted Lucknowi Chikankari assistance.',
  path: '/contact',
});

const instagram = SOCIAL_LINKS.find((link) => link.name === 'Instagram');

const contactCards = [
  {
    title: 'Order Support',
    description:
      'Need help with sizing, product details, delivery, or an existing order? Reach out to our support team.',
    detail: CONTACT_INFO.email,
    href: `mailto:${CONTACT_INFO.email}`,
  },
  {
    title: 'Instagram Enquiry',
    description:
      'Ask about product availability, fabric, size guidance, or custom styling suggestions by message.',
    detail: instagram ? `@${instagram.href.replace(/\/+$/, '').split('/').pop()}` : 'Instagram',
    href: instagram?.href ?? '/contact',
  },
  {
    title: 'Call or Visit',
    description: `${CONTACT_INFO.address.line1}, ${CONTACT_INFO.address.line2}. Please call before visiting.`,
    detail: CONTACT_INFO.phone,
    href: CONTACT_INFO.phoneHref,
  },
];

const enquiryTypes = [
  'Product enquiry',
  'Size guidance',
  'Custom order',
  'Bulk / wholesale enquiry',
  'Order support',
];

export default function ContactPage() {
  return (
    <>

      <main className="bg-ivory">
        <section className="border-b border-beige bg-gradient-to-b from-cream/70 to-ivory">
          <div className="luxury-container py-6 sm:py-8 lg:py-12">
            <nav
              aria-label="Breadcrumb"
              className="mb-5 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-ink-muted sm:text-[11px]"
            >
              <Link href="/" className="hover:text-maroon">
                Home
              </Link>

              <span>/</span>

              <span className="text-ink-soft">Contact</span>
            </nav>

            <div className="max-w-2xl">
              <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.3em] text-gold sm:text-xs">
                Get In Touch
              </span>

              <h1 className="font-heading text-4xl leading-tight text-charcoal sm:text-5xl lg:text-6xl">
                Contact Eifa Couture
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-ink-muted sm:text-base">
                We are here to help with product details, size guidance, custom
                requests, order support, and handcrafted Chikankari enquiries.
              </p>
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-14 lg:py-20">
          <div className="luxury-container">
            <div className="grid gap-5 md:grid-cols-3">
              {contactCards.map((card) => (
                <article
                  key={card.title}
                  className="border border-beige bg-white p-6 transition-all duration-300 hover:border-gold/50 sm:p-7"
                >
                  <h2 className="font-heading text-2xl text-charcoal">
                    {card.title}
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-ink-muted">
                    {card.description}
                  </p>

                  <a
                    href={card.href}
                    className="mt-5 inline-flex font-body text-xs uppercase tracking-[0.2em] text-maroon transition-colors hover:text-gold"
                    target={card.href.startsWith('http') ? '_blank' : undefined}
                    rel={
                      card.href.startsWith('http') ? 'noopener noreferrer' : undefined
                    }
                  >
                    {card.detail}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-cream py-10 sm:py-14 lg:py-20">
          <div className="luxury-container">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
              <div>
                <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.3em] text-gold sm:text-xs">
                  Enquiry Form
                </span>

                <h2 className="font-heading text-4xl leading-tight text-charcoal sm:text-5xl">
                  Tell Us What You Are Looking For
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-ink-muted sm:text-base sm:leading-8">
                  Write to us by email, message us on Instagram, or call us. Please mention your order
                  number if you are asking about an existing order.
                </p>

                <div className="mt-7 border border-beige bg-white p-5">
                  <p className="font-body text-[10px] uppercase tracking-[0.24em] text-gold">
                    We Can Help With
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {enquiryTypes.map((type) => (
                      <span
                        key={type}
                        className="border border-beige bg-ivory px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-ink-muted"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-5 border border-beige bg-white p-5 sm:p-7 lg:p-8">
                <p className="font-body text-[10px] uppercase tracking-[0.24em] text-gold">Reach Us Directly</p>

                <dl className="space-y-4 text-sm leading-7 text-charcoal">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.18em] text-ink-muted">Email</dt>
                    <dd>
                      <a className="text-maroon underline" href={`mailto:${CONTACT_INFO.email}`}>
                        {CONTACT_INFO.email}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.18em] text-ink-muted">Phone</dt>
                    <dd>
                      <a className="text-maroon underline" href={CONTACT_INFO.phoneHref}>
                        {CONTACT_INFO.phone}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.18em] text-ink-muted">Visit</dt>
                    <dd>
                      {CONTACT_INFO.address.line1}, {CONTACT_INFO.address.line2}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.18em] text-ink-muted">Hours</dt>
                    <dd>
                      Mon–Fri {CONTACT_INFO.workingHours.weekdays}
                      <br />
                      Sat–Sun {CONTACT_INFO.workingHours.weekends}
                      <br />
                      {CONTACT_INFO.workingHours.note}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-maroon py-12 text-center text-white sm:py-16">
          <div className="luxury-container">
            <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.3em] text-gold sm:text-xs">
              Need Styling Help?
            </span>

            <h2 className="mx-auto max-w-2xl font-heading text-4xl leading-tight sm:text-5xl">
              We Can Help You Choose The Right Piece
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/65 sm:text-base sm:leading-8">
              Explore our handcrafted collection or reach out for product and
              size guidance.
            </p>

            <Link
              href="/shop"
              className="btn-luxury mt-8 inline-flex border border-gold bg-gold px-8 py-4 text-charcoal hover:bg-white"
            >
              Shop Collection
            </Link>
          </div>
        </section>
      </main>

    </>
  );
}