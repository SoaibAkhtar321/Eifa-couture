'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';

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

export default function HeroSection() {
  const [look, setLook] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const timer = window.setInterval(() => setLook((i) => (i + 1) % LOOKS.length), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [reduce]);

  // Scroll-linked motion: progress 0 → 1 while the hero scrolls out of view.
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
        style={off ? undefined : { y: glowY }}
        className="pointer-events-none absolute -right-40 top-10 h-[34rem] w-[34rem] rounded-full bg-gold/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/60 to-transparent"
      />

      <div className="luxury-container relative grid items-center gap-10 pb-14 pt-8 lg:min-h-[calc(100svh-5rem)] lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-20 lg:pt-14">
        {/* Visual: rotating looks with parallax + karigar inset */}
        <motion.div style={off ? undefined : { y: frameY }} className="relative lg:order-2">
          <motion.div
            {...(off
              ? {}
              : {
                  initial: { opacity: 0, scale: 0.96 },
                  animate: { opacity: 1, scale: 1 },
                  transition: { duration: 1.1, ease: EASE },
                })}
            className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] border border-gold/40 bg-maroon-dark shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:aspect-[5/4] lg:aspect-[5/5.2]"
          >
            <motion.div
              style={off ? undefined : { y: imageY, scale: imageScale }}
              className="absolute inset-0 will-change-transform"
            >
              {LOOKS.map((item, i) => (
                <Image
                  key={item.src}
                  src={item.src}
                  alt={item.alt}
                  fill
                  priority={i === 0}
                  sizes="(max-width: 1024px) 92vw, 48vw"
                  className={`object-cover object-[50%_15%] transition-[opacity,transform] duration-[1400ms] ease-out ${
                    look === i ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
                  }`}
                />
              ))}
            </motion.div>

            {/* Soft vignette so the frame feels rich, not flat */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-linear-to-t from-maroon-dark/50 via-transparent to-transparent"
            />

            <div className="absolute right-3 top-3 flex gap-1.5 rounded-full bg-espresso/70 px-2.5 py-1.5 backdrop-blur">
              {LOOKS.map((item, i) => (
                <button
                  key={item.src}
                  type="button"
                  aria-label={`Show look ${i + 1}`}
                  onClick={() => setLook(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    look === i ? 'w-5 bg-gold' : 'w-1.5 bg-ivory/50'
                  }`}
                />
              ))}
            </div>
          </motion.div>

          {/* Karigar inset — the craft behind the brand */}
          <motion.figure
            style={off ? undefined : { y: insetY }}
            className="absolute -bottom-6 left-3 w-[46%] overflow-hidden rounded-2xl border-4 border-espresso bg-ivory shadow-[0_18px_40px_rgba(0,0,0,0.5)] sm:w-[34%] lg:-bottom-8 lg:-left-6 lg:w-[38%]"
          >
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/about/heritage.png"
                alt="A karigar hand-embroidering Chikankari on a wooden hoop"
                fill
                sizes="(max-width: 1024px) 45vw, 20vw"
                className="object-cover"
              />
            </div>
            <figcaption className="px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-maroon sm:text-[11px]">
              Every stitch by hand
            </figcaption>
          </motion.figure>
        </motion.div>

        {/* Story */}
        <motion.div style={off ? undefined : { y: textY, opacity: textOpacity }} className="pt-6 lg:order-1 lg:pt-0">
          <motion.p
            {...fade(0.1)}
            className="flex items-center gap-3 text-[10px] uppercase tracking-[0.32em] text-gold-light sm:text-xs"
          >
            <span className="block h-px w-10 bg-gold" aria-hidden="true" />
            The Chikankari House of Lucknow
          </motion.p>

          <motion.h1
            {...fade(0.25)}
            className="mt-4 font-heading text-[2.35rem] leading-[1.05] text-ivory sm:text-6xl xl:text-[4rem]"
          >
            Lucknow’s heritage,
            <span className="text-gradient-gold block italic">woven in silk.</span>
          </motion.h1>

          <motion.p
            {...fade(0.4)}
            className="mt-5 max-w-xl text-[15px] leading-7 text-ivory/85 sm:text-base sm:leading-8"
          >
            For over two decades our family atelier has worked with Lucknow’s master karigars — hand-embroidering
            Chikankari on pure silk, chanderi and fine cotton. Sarees, kurtas, dupattas and silk accessories, made the
            slow, honest way.
          </motion.p>

          <motion.div {...fade(0.55)} className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/shop?audience=women"
              className="inline-flex min-h-12 items-center rounded-full bg-gold px-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-espresso shadow-[0_10px_30px_rgba(200,165,72,0.35)] transition-colors hover:bg-gold-light"
            >
              Shop Women
            </Link>
            <Link
              href="/shop?audience=men"
              className="inline-flex min-h-12 items-center rounded-full border border-gold/70 px-7 text-[11px] font-medium uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-gold hover:text-espresso"
            >
              Shop Men
            </Link>
            <Link
              href="/shop"
              className="inline-flex min-h-12 items-center px-2 text-[11px] font-medium uppercase tracking-[0.18em] text-gold-light underline-offset-4 hover:underline"
            >
              New arrivals →
            </Link>
          </motion.div>

          <motion.dl
            {...fade(0.7)}
            className="mt-9 grid max-w-xl grid-cols-4 gap-2 border-t border-gold/30 pt-6 sm:gap-6"
          >
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="whitespace-nowrap font-heading text-lg text-gold-light sm:text-3xl">{stat.value}</dd>
                <dd className="mt-1 text-[9px] uppercase leading-tight tracking-[0.12em] text-ivory/80 sm:text-[11px]">
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
