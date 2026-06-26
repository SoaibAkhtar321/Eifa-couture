import Image from 'next/image';
import Link from 'next/link';

const heroQuickLinks = [
  {
    label: 'New',
    href: '/shop?collection=new-arrivals',
  },
  {
    label: 'Best Sellers',
    href: '/shop?collection=best-sellers',
  },
  {
    label: 'Sarees',
    href: '/shop?category=sarees',
  },
  {
    label: 'Dupattas',
    href: '/shop?category=dupattas',
  },
];

export default function HeroSection() {
  return (
    <section
      className="relative min-h-[640px] overflow-hidden bg-charcoal sm:min-h-[720px] lg:min-h-[820px]"
      aria-label="Eifa Couture hero banner"
    >
      <div className="absolute inset-0">
        <Image
          src="/images/hero/hero-1.png"
          alt="Luxury handcrafted Chikankari fashion from Eifa Couture"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-charcoal/30 via-maroon/45 to-charcoal/85" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(26,26,26,0.22)_58%,rgba(26,26,26,0.72)_100%)]" />

      <div className="absolute left-0 right-0 top-0 z-10 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />

      <div className="relative z-10 flex min-h-[640px] items-center justify-center px-5 py-14 text-center sm:min-h-[720px] sm:px-8 lg:min-h-[820px]">
        <div className="mx-auto max-w-4xl">
          <div className="mb-5 flex items-center justify-center gap-3 sm:mb-7 sm:gap-4">
            <span className="block h-px w-10 bg-gold/70 sm:w-16 md:w-20" />

            <span className="font-body text-[10px] uppercase tracking-[0.32em] text-gold sm:text-xs sm:tracking-[0.36em]">
              Est. 1998
            </span>

            <span className="block h-px w-10 bg-gold/70 sm:w-16 md:w-20" />
          </div>

          <h1 className="font-heading text-[2.85rem] font-semibold leading-[0.92] tracking-wide text-white sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl">
            <span className="block">EIFA</span>
            <span className="mt-1 block sm:mt-2">COUTURE</span>
          </h1>

          <div className="my-5 flex items-center justify-center gap-3 sm:my-7">
            <span className="block h-px w-12 bg-gold/50 sm:w-20 md:w-24" />

            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              className="shrink-0 text-gold sm:h-4 sm:w-4"
              aria-hidden="true"
            >
              <path
                d="M8 0L9.79 6.21L16 8L9.79 9.79L8 16L6.21 9.79L0 8L6.21 6.21L8 0Z"
                fill="currentColor"
                opacity="0.72"
              />
            </svg>

            <span className="block h-px w-12 bg-gold/50 sm:w-20 md:w-24" />
          </div>

          <p className="mx-auto max-w-2xl font-subheading text-lg italic leading-relaxed tracking-wide text-white/90 sm:text-xl md:text-2xl lg:text-3xl">
            Luxury Handcrafted Chikankari Since 1998
          </p>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-white/68 sm:mt-5 sm:max-w-xl sm:text-base sm:leading-8">
            Heritage Lucknowi embroidery shaped into refined pieces for women,
            men, festive moments, and everyday elegance.
          </p>

          <div className="mx-auto mt-8 grid max-w-sm grid-cols-2 gap-3 sm:mt-10 sm:flex sm:max-w-none sm:justify-center sm:gap-4">
            <Link
              href="/shop?category=womens-kurtas"
              className="inline-flex min-h-12 items-center justify-center border border-white bg-white px-5 py-3 font-body text-[11px] font-medium uppercase tracking-[0.18em] text-charcoal transition-all duration-300 hover:border-gold hover:bg-gold sm:px-8"
            >
              Shop Women
            </Link>

            <Link
              href="/shop?category=mens-kurtas"
              className="inline-flex min-h-12 items-center justify-center border border-white/65 bg-white/5 px-5 py-3 font-body text-[11px] font-medium uppercase tracking-[0.18em] text-white backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-charcoal sm:px-8"
            >
              Shop Men
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:mt-7">
            {heroQuickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-white/78 backdrop-blur-sm transition-all duration-300 hover:border-gold hover:text-gold sm:px-4"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
    </section>
  );
}