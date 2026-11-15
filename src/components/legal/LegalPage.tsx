import Link from 'next/link';
import type { ReactNode } from 'react';

import { CONTACT_INFO, LEGAL_INFO } from '@/lib/constants';

export type LegalSection = { heading: string; body: ReactNode };

const RELATED_LINKS = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Shipping Policy', href: '/shipping-policy' },
  { label: 'Cancellation, Returns & Refunds', href: '/refund-policy' },
  { label: 'Contact Us', href: '/contact' },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Shared layout for the legal / policy pages: a table of contents,
 * the numbered sections, the business + grievance contact block that
 * Indian e-commerce rules require, and links to the sibling policies.
 */
export default function LegalPage({
  title,
  updated,
  intro,
  sections,
  currentPath,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
  /** Path of this page, so it is left out of the "Related policies" list. */
  currentPath?: string;
}) {
  const { address } = CONTACT_INFO;
  const officer = LEGAL_INFO.grievanceOfficer;
  const related = RELATED_LINKS.filter((link) => link.href !== currentPath);

  return (
    <main className="bg-ivory py-12 md:py-20">
      <article className="luxury-container max-w-3xl">
        <p className="text-[10px] uppercase tracking-[0.28em] text-gold-dark md:text-xs">Last updated {updated}</p>
        <h1 className="mt-3 font-heading text-4xl text-charcoal md:text-5xl">{title}</h1>
        <p className="mt-5 text-sm leading-7 text-ink-soft md:text-base md:leading-8">{intro}</p>

        {sections.length > 3 && (
          <nav aria-label="On this page" className="mt-8 border border-beige bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-charcoal">On this page</p>
            <ol className="mt-3 grid gap-x-8 gap-y-1.5 text-sm text-ink-soft sm:grid-cols-2">
              {sections.map((section, index) => (
                <li key={section.heading}>
                  <a className="hover:text-maroon" href={`#${slugify(section.heading)}`}>
                    {index + 1}. {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="mt-10 space-y-9">
          {sections.map((section, index) => (
            <section key={section.heading} id={slugify(section.heading)} className="scroll-mt-24">
              <h2 className="font-heading text-2xl text-charcoal">
                {index + 1}. {section.heading}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-ink-soft md:text-base md:leading-8 [&_a]:text-maroon [&_a]:underline [&_li]:leading-7 [&_strong]:font-semibold [&_strong]:text-charcoal">
                {section.body}
              </div>
            </section>
          ))}

          <section id="contact" className="scroll-mt-24 border border-beige bg-white p-6">
            <h2 className="font-heading text-2xl text-charcoal">Business &amp; grievance contact</h2>
            <dl className="mt-4 space-y-3 text-sm leading-7 text-ink-soft md:text-base">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal">Business</dt>
                <dd>
                  {LEGAL_INFO.tradeName}
                  {LEGAL_INFO.legalName && <> (legal name: {LEGAL_INFO.legalName})</>}
                  {LEGAL_INFO.gstin && <> · GSTIN {LEGAL_INFO.gstin}</>}
                  <br />
                  {address.line1}, {address.line2}, {address.country}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal">
                  {officer.designation}
                </dt>
                <dd>
                  {officer.name && <>{officer.name} · </>}
                  <a className="text-maroon underline" href={`mailto:${CONTACT_INFO.email}`}>
                    {CONTACT_INFO.email}
                  </a>
                  {CONTACT_INFO.phone && (
                    <>
                      {' '}
                      ·{' '}
                      <a className="text-maroon underline" href={`tel:${CONTACT_INFO.phone.replace(/[^+\d]/g, '')}`}>
                        {CONTACT_INFO.phone}
                      </a>
                    </>
                  )}
                  <br />
                  We acknowledge complaints within {LEGAL_INFO.acknowledgeWithinHours} hours and aim to resolve them
                  within {LEGAL_INFO.resolveWithinDays} days.
                </dd>
              </div>
            </dl>
          </section>

          <nav aria-label="Related policies">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-charcoal">Related policies</p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {related.map((link) => (
                <li key={link.href}>
                  <Link className="text-maroon underline" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </article>
    </main>
  );
}
