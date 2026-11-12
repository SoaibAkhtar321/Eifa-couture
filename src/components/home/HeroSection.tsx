'use client';

import { getImageProps } from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';

import type { DbBanner } from '@/types/database';

/** The banner fields the hero reads (managed in Admin → Banners). */
export type HeroBanner = Pick<
  DbBanner,
  | 'title'
  | 'subtitle'
  | 'image_url'
  | 'mobile_image_url'
  | 'video_url'
  | 'link_url'
  | 'cta_label'
  | 'secondary_cta_label'
  | 'secondary_link_url'
>;

// Safe defaults, used whenever there is no active banner or a field is empty.
const DEFAULTS = {
  headline: ['Lucknow’s heritage,', 'woven in silk.'],
  tagline:
    'Hand-embroidered Chikankari sarees, kurtas, dupattas and silk accessories — made by our family atelier’s master karigars since 1998.',
  image: '/images/hero/hero-1.png',
  primary: { label: 'Shop New Arrivals', href: '/shop?collection=new-arrivals' },
  secondary: { label: 'Explore Collections', href: '/shop' },
};

const STATS = [
  { value: '1998', label: 'Family atelier' },
  { value: '50+', label: 'Master karigars' },
  { value: '36', label: 'Hand stitches' },
  { value: 'All India', label: 'Delivery' },
];

const MARQUEE = [
  'Hand-embroidered in Lucknow',
  'Pure silk & fine cotton',
  'Since 1998',
  'Sarees · Kurtas · Dupattas',
  'Silk bags & potlis',
  'Made by master karigars',
];

const EASE = [0.22, 1, 0.36, 1] as const;

function CtaLink({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} className={className} rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default function HeroSection({ banner = null }: { banner?: HeroBanner | null }) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [videoReady, setVideoReady] = useState(false);

  // "Line one | line two" — text after "|" gets the gold italic treatment.
  const headline = banner?.title?.trim()
    ? banner.title.split('|').map((line) => line.trim()).filter(Boolean).slice(0, 2)
    : DEFAULTS.headline;
  const tagline = banner?.subtitle?.trim() || DEFAULTS.tagline;
  const primary = {
    label: banner?.cta_label?.trim() || DEFAULTS.primary.label,
    href: banner?.link_url?.trim() || DEFAULTS.primary.href,
  };
  const secondary = {
    label: banner?.secondary_cta_label?.trim() || DEFAULTS.secondary.label,
    href: banner?.secondary_link_url?.trim() || DEFAULTS.secondary.href,
  };
  const desktopSrc = banner?.image_url || DEFAULTS.image;
  const mobileSrc = banner?.mobile_image_url || desktopSrc;
  const videoSrc = banner?.video_url || null;

  // Art-directed background: a portrait image on phones, landscape from 768px.
  const bgProps = (src: string) =>
    getImageProps({
      src,
      alt: '',
      fill: true,
      priority: true,
      sizes: '100vw',
      quality: 75,
      className: 'object-cover object-[50%_20%]',
    }).props;
  const desktopBg = bgProps(desktopSrc);
  const mobileBg = bgProps(mobileSrc);

  // Scroll-linked motion: progress 0 → 1 while the hero scrolls out of view.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });
  const bgY = useTransform(progress, [0, 1], ['0%', '8%']);
  const bgScale = useTransform(progress, [0, 1], [1.08, 1.2]);
  const textY = useTransform(progress, [0, 1], [0, -70]);
  const textOpacity = useTransform(progress, [0, 0.7], [1, 0]);
  const cueOpacity = useTransform(progress, [0, 0.12], [1, 0]);

  const off = !!reduce;
  const fade = (delay: number) =>
    off
      ? {}
      : {
          initial: { opacity: 0, y: 28 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.9, delay, ease: EASE },
        };

  return (
    <section
      ref={sectionRef}
      aria-label="Eifa Couture — Lucknow Chikankari & silk"
      className="surface-dark relative isolate flex min-h-[calc(100svh-5rem)] flex-col overflow-hidden"
    >
      {/* Background image (+ optional video) with parallax */}
      <motion.div
        aria-hidden="true"
        style={off ? { scale: 1.08 } : { y: bgY, scale: bgScale }}
        className="absolute inset-0 -z-10 will-change-transform"
      >
        <picture>
          <source media="(min-width: 768px)" srcSet={desktopBg.srcSet} sizes={desktopBg.sizes} />
          <img {...mobileBg} alt="" />
        </picture>
        {videoSrc && reduce === false && (
          <video
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onCanPlay={() => setVideoReady(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              videoReady ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </motion.div>

      {/* Dark overlay: keeps ivory text at AA contrast on any photo */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-espresso/70" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-t from-espresso via-espresso/30 to-espresso/40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/60 to-transparent"
      />

      <div className="luxury-container relative flex flex-1 items-center py-14 sm:py-20 lg:py-24">
        <motion.div style={off ? undefined : { y: textY, opacity: textOpacity }} className="max-w-2xl">
          <motion.p
            {...fade(0.1)}
            className="flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-gold-light sm:text-xs"
          >
            <span className="block h-px w-10 bg-gold" aria-hidden="true" />
            The Chikankari House of Lucknow
          </motion.p>

          <motion.h1
            {...fade(0.25)}
            className="mt-4 font-heading text-[2.35rem] leading-[1.05] text-ivory sm:text-6xl xl:text-7xl"
          >
            {headline[0]}
            {headline[1] && <span className="text-gradient-gold block italic">{headline[1]}</span>}
          </motion.h1>

          <motion.p {...fade(0.4)} className="mt-5 max-w-xl text-[15px] leading-7 text-ivory/90 sm:text-lg sm:leading-8">
            {tagline}
          </motion.p>

          <motion.div {...fade(0.55)} className="mt-8 flex flex-wrap gap-3">
            <CtaLink
              href={primary.href}
              className="inline-flex min-h-12 items-center rounded-full bg-gold px-7 text-[12px] font-semibold uppercase tracking-[0.16em] text-espresso shadow-[0_10px_30px_rgba(200,165,72,0.35)] transition-colors hover:bg-gold-light"
            >
              {primary.label}
            </CtaLink>
            <CtaLink
              href={secondary.href}
              className="inline-flex min-h-12 items-center rounded-full border border-gold/70 px-7 text-[12px] font-medium uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-gold hover:text-espresso"
            >
              {secondary.label}
            </CtaLink>
          </motion.div>

          <motion.dl
            {...fade(0.7)}
            className="mt-10 grid max-w-xl grid-cols-4 gap-2 border-t border-gold/30 pt-6 sm:gap-6"
          >
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="whitespace-nowrap font-heading text-lg text-gold-light sm:text-3xl">{stat.value}</dd>
                <dd className="mt-1 text-[10px] uppercase leading-tight tracking-[0.12em] text-ivory/85 sm:text-[11px]">
                  {stat.label}
                </dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        aria-hidden="true"
        style={off ? undefined : { opacity: cueOpacity }}
        className="pointer-events-none absolute bottom-16 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gold-light lg:flex"
      >
        Scroll
        <span className="relative block h-10 w-px overflow-hidden bg-gold/30">
          <span className="absolute inset-x-0 top-0 h-4 animate-[eifa-scroll-cue_1.8s_ease-in-out_infinite] bg-gold motion-reduce:animate-none" />
        </span>
      </motion.div>

      {/* Moving heritage ribbon */}
      <div className="relative overflow-hidden border-y border-gold/30 bg-espresso py-3 text-ivory" aria-hidden="true">
        <div className="flex w-max animate-[eifa-marquee_32s_linear_infinite] gap-10 whitespace-nowrap motion-reduce:animate-none">
          {[...MARQUEE, ...MARQUEE].map((text, i) => (
            <span key={i} className="flex items-center gap-10 font-subheading text-base italic tracking-wide sm:text-lg">
              {text}
              <span className="text-gold-light">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
