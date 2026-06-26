import Link from 'next/link';

export default function HeroSection() {
  return (
    <section
      className="relative min-h-[calc(100svh-96px)] overflow-hidden bg-charcoal md:min-h-[720px] lg:min-h-[820px]"
      aria-label="Hero banner"
    >
      <div className="absolute inset-0">
        <img
          src="/images/hero/hero-1.png"
          alt="Luxury Chikankari fashion from Eifa Couture"
          className="h-full w-full object-cover object-center"
          loading="eager"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-charcoal/35 via-maroon/45 to-charcoal/80" />

      <div className="absolute left-0 right-0 top-0 z-10 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />

      <div className="relative z-10 flex min-h-[calc(100svh-96px)] items-center justify-center px-5 py-16 text-center md:min-h-[720px] md:px-8 lg:min-h-[820px]">
        <div className="mx-auto max-w-4xl">
          <div className="mb-5 flex items-center justify-center gap-3 md:mb-8 md:gap-4">
            <span className="block h-px w-10 bg-gold/70 md:w-20" />
            <span className="font-body text-[10px] uppercase tracking-[0.3em] text-gold md:text-xs md:tracking-[0.35em]">
              Est. 1998
            </span>
            <span className="block h-px w-10 bg-gold/70 md:w-20" />
          </div>

          <h1 className="font-heading text-[3rem] font-semibold leading-[0.92] tracking-wide text-white sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl">
            <span className="block">EIFA</span>
            <span className="mt-1 block md:mt-2">COUTURE</span>
          </h1>

          <div className="my-5 flex items-center justify-center gap-3 md:my-8">
            <span className="block h-px w-12 bg-gold/50 md:w-24" />
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              className="shrink-0 text-gold md:h-4 md:w-4"
              aria-hidden="true"
            >
              <path
                d="M8 0L9.79 6.21L16 8L9.79 9.79L8 16L6.21 9.79L0 8L6.21 6.21L8 0Z"
                fill="currentColor"
                opacity="0.7"
              />
            </svg>
            <span className="block h-px w-12 bg-gold/50 md:w-24" />
          </div>

          <p className="mx-auto max-w-2xl font-subheading text-lg italic leading-relaxed tracking-wide text-white/90 sm:text-xl md:text-2xl lg:text-3xl">
            Luxury Handcrafted Chikankari Since 1998
          </p>

          <div className="mt-8 md:mt-12">
            <Link
              href="/shop"
              className="inline-flex min-h-11 items-center justify-center gap-3 border border-white/65 bg-white/5 px-7 py-3 font-body text-[11px] uppercase tracking-[0.18em] text-white backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-charcoal md:px-10 md:py-4 md:text-sm"
            >
              Explore Collection
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
    </section>
  );
}