'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

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

export default function HeroSection() {
  const [look, setLook] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setLook((i) => (i + 1) % LOOKS.length), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section aria-label="Eifa Couture — Lucknow Chikankari & silk" className="bg-ivory">
      <div className="luxury-container grid items-center gap-8 pb-8 pt-4 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:pb-16 lg:pt-12">
        {/* Visual: rotating looks + karigar inset */}
        <div className="relative lg:order-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-beige sm:aspect-[5/4] lg:aspect-[5/5.2]">
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

            <div className="absolute right-3 top-3 flex gap-1.5 rounded-full bg-white/80 px-2.5 py-1.5 backdrop-blur">
              {LOOKS.map((item, i) => (
                <button
                  key={item.src}
                  type="button"
                  aria-label={`Show look ${i + 1}`}
                  onClick={() => setLook(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${look === i ? 'w-5 bg-maroon' : 'w-1.5 bg-charcoal/30'}`}
                />
              ))}
            </div>
          </div>

          {/* Karigar inset — the craft behind the brand */}
          <figure className="absolute -bottom-6 left-3 w-[46%] overflow-hidden rounded-2xl border-4 border-ivory bg-white shadow-[0_18px_40px_rgba(43,43,43,0.18)] sm:w-[34%] lg:-bottom-8 lg:-left-10 lg:w-[42%]">
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
          </figure>
        </div>

        {/* Story */}
        <div className="pt-4 lg:order-1 lg:pt-0">
          <p className="flex items-center gap-3 text-[10px] uppercase tracking-[0.32em] text-gold-dark sm:text-xs">
            <span className="block h-px w-10 bg-gold" aria-hidden="true" />
            The Chikankari House of Lucknow
          </p>

          <h1 className="mt-4 font-heading text-[2.35rem] leading-[1.05] text-charcoal sm:text-6xl xl:text-[4rem]">
            Lucknow’s heritage,
            <span className="block italic text-maroon">woven in silk.</span>
          </h1>

          <p className="mt-5 max-w-lg text-[15px] leading-7 text-charcoal/80 sm:text-base sm:leading-8">
            For over two decades our family atelier has worked with Lucknow’s master karigars — hand-embroidering
            Chikankari on pure silk, chanderi and fine cotton. Sarees, kurtas, dupattas and silk accessories, made the
            slow, honest way.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/shop?audience=women"
              className="inline-flex min-h-12 items-center rounded-full bg-maroon px-7 text-[11px] font-medium uppercase tracking-[0.18em] text-white shadow-[0_10px_24px_rgba(107,26,46,0.25)] transition-colors hover:bg-charcoal"
            >
              Shop Women
            </Link>
            <Link
              href="/shop?audience=men"
              className="inline-flex min-h-12 items-center rounded-full border border-charcoal/80 px-7 text-[11px] font-medium uppercase tracking-[0.18em] text-charcoal transition-colors hover:bg-charcoal hover:text-white"
            >
              Shop Men
            </Link>
            <Link
              href="/about"
              className="inline-flex min-h-12 items-center px-2 text-[11px] font-medium uppercase tracking-[0.18em] text-maroon underline-offset-4 hover:underline"
            >
              Our story →
            </Link>
          </div>

          <dl className="mt-8 grid grid-cols-4 gap-2 border-t border-beige pt-6 sm:gap-6">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="whitespace-nowrap font-heading text-lg text-maroon sm:text-3xl">{stat.value}</dd>
                <dd className="mt-1 text-[9px] uppercase leading-tight tracking-[0.12em] text-charcoal/70 sm:text-[11px]">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Moving heritage ribbon */}
      <div className="overflow-hidden border-y border-gold/30 bg-maroon py-3 text-white" aria-hidden="true">
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
