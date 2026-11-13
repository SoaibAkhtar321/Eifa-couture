import Image from 'next/image';
import Link from 'next/link';

import Reveal from '@/components/motion/Reveal';

interface ComingSoonPanelProps {
  title: string;
  text: string;
  image: string;
  imageAlt: string;
  href: string;
  ctaLabel: string;
}

/**
 * Shown in an audience section that has no products yet, so the
 * Women / Men / Accessories sections never vanish from the homepage.
 */
export default function ComingSoonPanel({ title, text, image, imageAlt, href, ctaLabel }: ComingSoonPanelProps) {
  return (
    <Reveal>
      <div className="relative isolate overflow-hidden rounded-2xl bg-espresso">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="(max-width: 1024px) 100vw, 1200px"
          className="-z-10 object-cover object-[50%_20%] opacity-60"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-espresso/90 via-espresso/60 to-transparent" aria-hidden="true" />

        <div className="flex min-h-[280px] flex-col justify-center px-6 py-10 md:min-h-[360px] md:px-14">
          <span className="text-[10px] uppercase tracking-[0.3em] text-gold-light md:text-xs">Arriving soon</span>
          <h3 className="mt-3 max-w-lg font-heading text-2xl leading-tight text-white md:text-4xl">{title}</h3>
          <p className="mt-3 max-w-md text-sm leading-7 text-white/90 md:text-base">{text}</p>
          <Link
            href={href}
            className="mt-6 inline-flex min-h-11 w-fit items-center gap-3 border-b border-gold-light pb-1 text-[11px] font-medium uppercase tracking-[0.2em] text-gold-light transition-[gap] hover:gap-5 md:text-xs"
          >
            {ctaLabel} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
