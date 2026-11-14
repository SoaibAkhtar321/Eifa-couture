'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';

import { useIsDesktop } from '@/hooks/useMediaQuery';
import type { DbBanner } from '@/types/database';

/** Banner fields the hero reads (text and links managed in Admin → Banners). */
export type HeroBanner = Pick<DbBanner, 'title' | 'subtitle' | 'link_url' | 'cta_label'>;

const AUDIENCE_TILES = [
  { key: 'women', href: '/women', label: 'For Women', sub: 'Sarees & suits', image: '/images/collections/women.png' },
  { key: 'men', href: '/men', label: 'For Men', sub: 'Kurtas', image: '/images/collections/men.png' },
  { key: 'accessories', href: '/accessories', label: 'Accessories', sub: 'Bags & dupattas', image: '/images/categories/dupattas.png' },
] as const;

/** Admin-set panel images (Admin → Homepage); a missing one keeps the default above. */
export type HeroPanelImages = Partial<Record<'women' | 'men' | 'accessories', string | null>>;

const LOOKS = [
  { src: '/images/hero/hero-1.png', alt: 'Model in a white hand-embroidered Chikankari kurta' },
  { src: '/images/hero/hero-2.png', alt: 'Model in an ivory and gold Chikankari anarkali' },
  { src: '/images/collections/women.png', alt: 'Model in a maroon silk Chikankari anarkali' },
  { src: '/images/collections/men.png', alt: 'Model in an ivory Chikankari kurta for men' },
];

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

const ROTATE_MS = 4500;
const EASE = [0.22, 1, 0.36, 1] as const;

export default function HeroSection({
  banner = null,
  panelImages = {},
}: {
  banner?: HeroBanner | null;
  panelImages?: HeroPanelImages;
}) {
  // `maxSeen`: only mount the looks already shown (plus the next one) so a
  // phone downloads 1–2 hero images up front instead of all four.
  const [{ look, maxSeen }, setSlide] = useState({ look: 0, maxSeen: 0 });
  const showLook = (index: number) =>
    setSlide((s) => ({ look: index, maxSeen: Math.max(s.maxSeen, index) }));
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (reduce) return;
    const timer = window.setInterval(
      () =>
        setSlide((s) => {
          const next = (s.look + 1) % LOOKS.length;
          return { look: next, maxSeen: Math.max(s.maxSeen, next) };
        }),
      ROTATE_MS
    );
    return () => window.clearInterval(timer);
  }, [reduce]);

  // Scroll-linked parallax is a desktop flourish. On phones the headline
  // sits on top of the image, so both must stay locked together.
  const parallax = !reduce && isDesktop;

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });

  const imageY = useTransform(progress, [0, 1], ['0%', '12%']);
  const imageScale = useTransform(progress, [0, 1], [1, 1.12]);
  const frameY = useTransform(progress, [0, 1], [0, -40]);
  const insetY = useTransform(progress, [0, 1], [0, -90]);
  const textY = useTransform(progress, [0, 1], [0, -70]);
  const textOpacity = useTransform(progress, [0, 0.7], [1, 0]);
  const glowY = useTransform(progress, [0, 1], [0, 120]);
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
      className="surface-dark relative overflow-hidden"
    >
      {/* Decorative gold glow that drifts as you scroll */}
      <motion.div
        aria-hidden="true"
        style={parallax ? { y: glowY } : undefined}
        className="pointer-events-none absolute -right-40 top-10 hidden h-[34rem] w-[34rem] rounded-full bg-gold/15 blur-3xl lg:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/60 to-transparent"
      />

      {/*
        Mobile: image and headline share ONE grid cell, so the headline +
        button sit on the lower part of the photo (app-style hero) instead
        of stacking a tall image above a wall of text.
        Desktop (lg): the original two-column layout.
      */}
      <div className="relative mx-auto grid w-full max-w-[1400px] items-center px-3 pb-4 pt-3 sm:px-6 lg:min-h-[calc(100svh-5rem)] lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10 lg:px-12 lg:pb-20 lg:pt-14 xl:px-16">
        {/* Visual: rotating looks with parallax + karigar inset */}
        <motion.div
          style={parallax ? { y: frameY } : undefined}
          className="relative col-start-1 row-start-1 sm:col-auto sm:row-auto lg:order-2"
        >
          <motion.div
            {...(off
              ? {}
              : {
                  initial: { opacity: 0, scale: 0.97 },
                  animate: { opacity: 1, scale: 1 },
                  transition: { duration: 0.9, ease: EASE },
                })}
            className="relative aspect-[4/5] max-h-[72svh] w-full overflow-hidden rounded-2xl border border-gold/40 bg-maroon-dark shadow-[0_20px_50px_rgba(0,0,0,0.4)] sm:aspect-[5/4] sm:max-h-none lg:aspect-[5/5.2] lg:rounded-[1.75rem] lg:shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
          >
            <motion.div
              style={parallax ? { y: imageY, scale: imageScale } : undefined}
              className="absolute inset-0 will-change-transform"
            >
              {LOOKS.map((item, i) =>
                i <= maxSeen + 1 ? (
                  <Image
                    key={item.src}
                    src={item.src}
                    alt={item.alt}
                    fill
                    priority={i === 0}
                    sizes="(max-width: 640px) 96vw, (max-width: 1024px) 92vw, 48vw"
                    className={`object-cover object-[50%_12%] transition-[opacity,transform] duration-[1400ms] ease-out ${
                      look === i ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
                    }`}
                  />
                ) : null
              )}
            </motion.div>

            {/* Gradient: strong at the bottom on phones so the headline is readable */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-linear-to-t from-maroon-dark/95 via-maroon-dark/35 via-45% to-transparent sm:from-maroon-dark/50 sm:via-transparent sm:via-100%"
            />

            <div className="absolute right-3 top-3 flex gap-1.5 rounded-full bg-espresso/70 px-2.5 py-1.5 backdrop-blur">
              {LOOKS.map((item, i) => (
                <button
                  key={item.src}
                  type="button"
                  aria-label={`Show look ${i + 1}`}
                  onClick={() => showLook(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    look === i ? 'w-5 bg-gold' : 'w-1.5 bg-ivory/50'
                  }`}
                />
              ))}
            </div>
          </motion.div>

          {/* Karigar inset — the craft behind the brand (tablet/desktop only) */}
          <motion.figure
            style={parallax ? { y: insetY } : undefined}
            className="absolute -bottom-6 left-3 hidden w-[34%] overflow-hidden rounded-2xl border-4 border-espresso bg-ivory shadow-[0_18px_40px_rgba(0,0,0,0.5)] sm:block lg:-bottom-8 lg:-left-6 lg:w-[38%]"
          >
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/about/heritage.png"
                alt="A karigar hand-embroidering Chikankari on a wooden hoop"
                fill
                sizes="(max-width: 1024px) 34vw, 20vw"
                className="object-cover"
              />
            </div>
            <figcaption className="px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-maroon sm:text-[11px]">
              Every stitch by hand
            </figcaption>
          </motion.figure>
        </motion.div>

        {/* Story — overlays the bottom of the photo on phones */}
        <motion.div
          style={parallax ? { y: textY, opacity: textOpacity } : undefined}
          className="relative z-10 col-start-1 row-start-1 self-end p-5 pb-6 sm:col-auto sm:row-auto sm:self-auto sm:p-0 sm:pt-12 lg:order-1 lg:self-center lg:pt-0"
        >
          <motion.p
            {...fade(0.1)}
            className="flex items-center gap-2.5 text-[10px] uppercase tracking-[0.28em] text-gold-light sm:text-xs lg:gap-3 lg:tracking-[0.32em]"
          >
            <span className="block h-px w-6 bg-gold lg:w-10" aria-hidden="true" />
            The Chikankari House of Lucknow
          </motion.p>

          <motion.h1
            {...fade(0.2)}
            className="mt-2.5 font-heading text-[1.85rem] leading-[1.08] text-ivory sm:text-5xl lg:mt-4 lg:text-6xl xl:text-[4rem]"
          >
            {banner?.title ? (
              banner.title
            ) : (
              <>
                Lucknow’s heritage,
                <span className="text-gradient-gold block italic">woven in silk.</span>
              </>
            )}
          </motion.h1>

          {/* Long story copy is for tablet/desktop; phones get headline + button */}
          <motion.p
            {...fade(0.3)}
            className="mt-5 hidden max-w-xl text-base leading-8 text-ivory/85 sm:block"
          >
            {banner?.subtitle ||
              'For over two decades our family atelier has worked with Lucknow’s master karigars — hand-embroidering Chikankari on pure silk, chanderi and fine cotton. Sarees, kurtas, dupattas and silk accessories, made the slow, honest way.'}
          </motion.p>

          <motion.div {...fade(0.4)} className="mt-4 lg:mt-7">
            <Link
              href={banner?.link_url || '/shop?collection=new-arrivals'}
              className="inline-flex min-h-11 items-center rounded-full bg-gold px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-espresso shadow-[0_10px_30px_rgba(200,165,72,0.35)] transition-colors hover:bg-gold-light lg:min-h-12 lg:px-7"
            >
              {banner?.cta_label || 'Shop New Arrivals'}
            </Link>

            {/* Desktop: Shop-by tiles (phones use the chip row below the image) */}
            <div className="hidden lg:block">
              <p className="mt-6 text-[11px] uppercase tracking-[0.26em] text-gold-light">Shop by</p>
              <ul className="mt-3 grid max-w-xl grid-cols-3 gap-3">
                {AUDIENCE_TILES.map((tile) => (
                  <li key={tile.href}>
                    <Link
                      href={tile.href}
                      className="group flex min-h-14 flex-row items-center overflow-hidden rounded-xl border border-gold/40 bg-espresso/60 backdrop-blur transition-colors hover:border-gold hover:bg-espresso"
                    >
                      <span className="relative block h-14 w-14 shrink-0 overflow-hidden">
                        <Image
                          src={panelImages[tile.key]?.trim() || tile.image}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-cover object-[50%_20%] transition-transform duration-500 group-hover:scale-110"
                        />
                      </span>
                      <span className="px-3 py-2">
                        <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-ivory">
                          {tile.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-tight text-ivory/80">{tile.sub}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.dl
            {...fade(0.6)}
            className="mt-9 hidden max-w-xl grid-cols-4 gap-6 border-t border-gold/30 pt-6 sm:grid"
          >
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="whitespace-nowrap font-heading text-2xl text-gold-light lg:text-3xl">{stat.value}</dd>
                <dd className="mt-1 text-[11px] uppercase leading-tight tracking-[0.12em] text-ivory/80">
                  {stat.label}
                </dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>
      </div>

      {/* Phones: one swipeable row of quick links instead of stacked tiles */}
      <nav aria-label="Shop by audience" className="px-3 pb-4 sm:px-6 lg:hidden">
        <ul className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {AUDIENCE_TILES.map((tile) => (
            <li key={tile.href} className="min-w-0 flex-1">
              <Link
                href={tile.href}
                className="flex min-h-11 items-center gap-2 rounded-full border border-gold/40 bg-espresso/60 py-1 pl-1 pr-3 transition-colors active:bg-espresso"
              >
                <span className="relative block h-9 w-9 shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={panelImages[tile.key]?.trim() || tile.image}
                    alt=""
                    fill
                    sizes="36px"
                    className="object-cover object-[50%_20%]"
                  />
                </span>
                <span className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-ivory">
                  {tile.key === 'accessories' ? 'Bags' : tile.label.replace('For ', '')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Scroll cue */}
      <motion.div
        aria-hidden="true"
        style={parallax ? { opacity: cueOpacity } : undefined}
        className="pointer-events-none absolute bottom-16 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gold-light lg:flex"
      >
        Scroll
        <span className="relative block h-10 w-px overflow-hidden bg-gold/30">
          <span className="absolute inset-x-0 top-0 h-4 animate-[eifa-scroll-cue_1.8s_ease-in-out_infinite] bg-gold motion-reduce:animate-none" />
        </span>
      </motion.div>

      {/* Moving heritage ribbon */}
      <div className="relative overflow-hidden border-y border-gold/30 bg-espresso py-2 text-ivory sm:py-3" aria-hidden="true">
        <div className="flex w-max animate-[eifa-marquee_32s_linear_infinite] gap-10 whitespace-nowrap motion-reduce:animate-none">
          {[...MARQUEE, ...MARQUEE].map((text, i) => (
            <span key={i} className="flex items-center gap-10 font-subheading text-sm italic tracking-wide sm:text-lg">
              {text}
              <span className="text-gold-light">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
