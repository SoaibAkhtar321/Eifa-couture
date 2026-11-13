import Link from 'next/link';

import Reveal from '@/components/motion/Reveal';

export type HeaderTone = 'light' | 'dark';

const TONES: Record<HeaderTone, { eyebrow: string; title: string; subtitle: string; rule: string; link: string }> = {
  light: {
    eyebrow: 'text-gold-deep',
    title: 'text-ink',
    subtitle: 'text-ink-soft',
    rule: 'bg-gold-deep/50',
    link: 'border-gold-deep text-ink hover:bg-gold-deep hover:text-white',
  },
  dark: {
    eyebrow: 'text-gold-light',
    title: 'text-white',
    subtitle: 'text-white/90',
    rule: 'bg-gold-light/60',
    link: 'border-gold-light text-gold-light hover:bg-gold-light hover:text-espresso',
  },
};

interface SectionHeaderProps {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  tone?: HeaderTone;
  viewAllHref?: string;
  viewAllLabel?: string;
}

/**
 * Shared editorial header for homepage sections: gold-ruled eyebrow,
 * serif title, italic subtitle and an optional "View all" pill.
 */
export default function SectionHeader({
  id,
  eyebrow,
  title,
  subtitle,
  tone = 'light',
  viewAllHref,
  viewAllLabel = 'View all',
}: SectionHeaderProps) {
  const t = TONES[tone];

  return (
    <Reveal className="mb-8 flex flex-col items-center text-center md:mb-12">
      <span className={`flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] md:text-xs ${t.eyebrow}`}>
        <span className={`block h-px w-8 md:w-12 ${t.rule}`} aria-hidden="true" />
        {eyebrow}
        <span className={`block h-px w-8 md:w-12 ${t.rule}`} aria-hidden="true" />
      </span>
      <h2 id={id} className={`mt-3 font-heading text-3xl leading-tight md:text-5xl lg:text-6xl ${t.title}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-3 max-w-xl font-subheading text-base italic md:text-xl ${t.subtitle}`}>{subtitle}</p>
      )}
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className={`mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border px-6 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors md:text-xs ${t.link}`}
        >
          {viewAllLabel} <span aria-hidden="true">→</span>
        </Link>
      )}
    </Reveal>
  );
}
