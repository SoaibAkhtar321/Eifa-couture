import Link from 'next/link';

import Reveal from '@/components/motion/Reveal';

interface ComingSoonPanelProps {
  title: string;
  text: string;
  href: string;
  ctaLabel: string;
  dark?: boolean;
}

/**
 * Shown beside an audience's lead image when it has no products yet, so
 * the Women / Men / Accessories sections never vanish from the homepage.
 */
export default function ComingSoonPanel({ title, text, href, ctaLabel, dark = false }: ComingSoonPanelProps) {
  return (
    <Reveal className="h-full">
      <div
        className={`flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center md:px-12 ${
          dark ? 'border-gold-light/60 bg-white/5' : 'border-gold-deep/50 bg-white/60'
        }`}
      >
        <span className={`text-[10px] uppercase tracking-[0.3em] md:text-xs ${dark ? 'text-gold-light' : 'text-gold-deep'}`}>
          ✦ Arriving soon ✦
        </span>
        <h3 className={`mt-4 max-w-md font-heading text-2xl leading-tight md:text-4xl ${dark ? 'text-white' : 'text-ink'}`}>
          {title}
        </h3>
        <p className={`mt-4 max-w-md text-sm leading-7 md:text-base ${dark ? 'text-white/90' : 'text-ink-soft'}`}>{text}</p>
        <Link
          href={href}
          className={`mt-7 inline-flex min-h-11 items-center gap-3 border-b pb-1 text-[11px] font-medium uppercase tracking-[0.2em] transition-[gap] hover:gap-5 md:text-xs ${
            dark ? 'border-gold-light text-gold-light' : 'border-gold-deep text-ink'
          }`}
        >
          {ctaLabel} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </Reveal>
  );
}
