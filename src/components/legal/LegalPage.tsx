import type { ReactNode } from 'react';

import { CONTACT_INFO } from '@/lib/constants';

export type LegalSection = { heading: string; body: ReactNode };

export default function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <main className="bg-ivory py-12 md:py-20">
      <article className="luxury-container max-w-3xl">
        <p className="text-[10px] uppercase tracking-[0.28em] text-gold-dark md:text-xs">Last updated {updated}</p>
        <h1 className="mt-3 font-heading text-4xl text-charcoal md:text-5xl">{title}</h1>
        <p className="mt-5 text-sm leading-7 text-ink-soft md:text-base md:leading-8">{intro}</p>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-heading text-2xl text-charcoal">{section.heading}</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-ink-soft md:text-base md:leading-8">
                {section.body}
              </div>
            </section>
          ))}
          <section>
            <h2 className="font-heading text-2xl text-charcoal">Contact</h2>
            <p className="mt-3 text-sm leading-7 text-ink-soft md:text-base">
              Questions? Write to{' '}
              <a className="text-maroon underline" href={`mailto:${CONTACT_INFO.email}`}>
                {CONTACT_INFO.email}
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
