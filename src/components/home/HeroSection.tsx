'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

type Slide = {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  accent: string;
  text: string;
  cta: string;
  href: string;
  panel: string;
  light: boolean;
  focus: string; // object-position so faces are never cropped
};

const SLIDES: Slide[] = [
  {
    image: '/images/hero/hero-1.png',
    alt: 'Model wearing a white hand-embroidered Chikankari kurta',
    eyebrow: 'Lucknow · Est. 1998',
    title: 'Handcrafted Chikankari,',
    accent: 'made to be treasured.',
    text: 'Heritage Lucknowi embroidery on sarees, kurtas and silks.',
    cta: 'Shop Women',
    href: '/shop?audience=women',
    panel: 'bg-ivory',
    light: false,
    focus: 'object-[50%_15%]',
  },
  {
    image: '/images/hero/hero-2.png',
    alt: 'Model in an ivory and gold Chikankari anarkali with dupatta',
    eyebrow: 'Festive Edit',
    title: 'Ivory & gold',
    accent: 'for the season of celebrations.',
    text: 'Anarkalis and kurta sets with zari-touched Chikankari.',
    cta: 'Shop New Arrivals',
    href: '/shop?collection=new-arrivals',
    panel: 'bg-[#6B1A2E]',
    light: true,
    focus: 'object-[50%_15%]',
  },
  {
    image: '/images/collections/men.png',
    alt: 'Model in an ivory Chikankari kurta',
    eyebrow: 'For Him',
    title: 'Quiet elegance,',
    accent: 'stitched by hand.',
    text: 'Chikankari kurtas in cotton lawn, silk and chanderi.',
    cta: 'Shop Men',
    href: '/shop?audience=men',
    panel: 'bg-[#2B2B2B]',
    light: true,
    focus: 'object-[50%_20%]',
  },
  {
    image: '/images/categories/dupattas.png',
    alt: 'Hand-embroidered silk dupattas and accessories',
    eyebrow: 'Silk Accessories',
    title: 'Silk bags & dupattas,',
    accent: 'the finishing touch.',
    text: 'Potlis, crochet clutches and embroidered stoles.',
    cta: 'Shop Accessories',
    href: '/shop?category=bags-accessories',
    panel: 'bg-[#E9D9BD]',
    light: false,
    focus: 'object-center',
  },
];

const AUTOPLAY_MS = 5000;

export default function HeroSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.children[index] as HTMLElement | undefined;
    if (slide) track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: 'smooth' });
  }, []);

  // Track which slide is in view (works for swipe, arrows and autoplay).
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { root: track, threshold: 0.6 }
    );
    Array.from(track.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (paused) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const timer = window.setTimeout(() => goTo((active + 1) % SLIDES.length), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [active, paused, goTo]);

  return (
    <section
      className="relative bg-ivory pb-4 pt-3 lg:pb-0 lg:pt-0"
      aria-roledescription="carousel"
      aria-label="Eifa Couture highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 [scrollbar-width:none] lg:gap-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {SLIDES.map((slide, i) => (
          <article
            key={slide.image}
            data-index={i}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${SLIDES.length}`}
            className="relative w-[88%] shrink-0 snap-center overflow-hidden rounded-2xl lg:grid lg:w-full lg:grid-cols-2 lg:rounded-none"
          >
            {/* Image */}
            <div className="relative aspect-[4/5] lg:order-2 lg:aspect-auto lg:min-h-[640px] xl:min-h-[700px]">
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                priority={i === 0}
                sizes="(max-width: 1024px) 88vw, 50vw"
                className={`object-cover ${slide.focus} transition-transform duration-[6s] ease-out ${
                  active === i ? 'scale-105' : 'scale-100'
                }`}
              />
            </div>

            {/* Mobile caption: frosted card over the image */}
            <div className="absolute inset-x-3 bottom-3 rounded-xl bg-charcoal/50 px-4 py-3 text-white backdrop-blur-md lg:hidden">
              <p className="text-[10px] uppercase tracking-[0.26em] text-gold-light">{slide.eyebrow}</p>
              <p className="mt-1 font-heading text-lg leading-snug">
                {slide.title} <span className="italic text-gold-light">{slide.accent}</span>
              </p>
              <Link
                href={slide.href}
                className="mt-2.5 inline-flex min-h-9 items-center rounded-full bg-white px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-charcoal"
              >
                {slide.cta}
              </Link>
            </div>

            {/* Desktop text panel */}
            <div
              className={`hidden items-center px-16 xl:px-24 lg:order-1 lg:flex ${slide.panel} ${
                slide.light ? 'text-white' : 'text-charcoal'
              }`}
            >
              <div
                className={`max-w-xl transition-all duration-700 ${
                  active === i ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
                }`}
              >
                <p className={`flex items-center gap-3 text-xs uppercase tracking-[0.32em] ${slide.light ? 'text-gold-light' : 'text-gold-dark'}`}>
                  <span className="block h-px w-10 bg-current" aria-hidden="true" />
                  {slide.eyebrow}
                </p>
                <h1 className={`mt-6 font-heading text-6xl leading-[1.04] xl:text-7xl ${slide.light ? 'text-white' : 'text-charcoal'}`}>
                  {slide.title}
                  <span className={`block italic ${slide.light ? 'text-gold-light' : 'text-maroon'}`}>{slide.accent}</span>
                </h1>
                <p className={`mt-6 max-w-md text-base leading-8 ${slide.light ? 'text-white/85' : 'text-charcoal/80'}`}>
                  {slide.text}
                </p>
                <Link
                  href={slide.href}
                  className={`mt-9 inline-flex min-h-12 items-center px-9 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors ${
                    slide.light
                      ? 'bg-white text-charcoal hover:bg-gold'
                      : 'bg-maroon text-white hover:bg-charcoal'
                  }`}
                >
                  {slide.cta}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Dots */}
      <div className="mt-3 flex justify-center gap-2 lg:absolute lg:bottom-8 lg:left-16 lg:mt-0 xl:left-24">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.image}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={active === i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              active === i ? 'w-7 bg-maroon lg:bg-gold' : 'w-1.5 bg-charcoal/25 lg:bg-gold/40'
            }`}
          />
        ))}
      </div>

      {/* Desktop arrows */}
      <div className="absolute bottom-6 right-8 hidden gap-2 lg:flex">
        {[
          { label: 'Previous slide', dir: -1, d: 'M15 18l-6-6 6-6' },
          { label: 'Next slide', dir: 1, d: 'M9 18l6-6-6-6' },
        ].map((arrow) => (
          <button
            key={arrow.label}
            type="button"
            aria-label={arrow.label}
            onClick={() => goTo((active + arrow.dir + SLIDES.length) % SLIDES.length)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-md transition-colors hover:bg-maroon hover:text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={arrow.d} />
            </svg>
          </button>
        ))}
      </div>
    </section>
  );
}
