import Image from 'next/image';
import Link from 'next/link';

const quickLinks = [
  { label: 'New Arrivals', href: '/shop?collection=new-arrivals' },
  { label: 'Best Sellers', href: '/shop?collection=best-sellers' },
  { label: 'Shop All', href: '/shop' },
];

export default function HeroSection() {
  return (
    <section className="bg-ivory" aria-label="Eifa Couture">
      <div className="mx-auto grid max-w-[1400px] lg:min-h-[640px] lg:grid-cols-2 xl:min-h-[720px]">
        {/* Image — first on mobile, right column on desktop. `object-top`
            keeps the model's face in frame at every aspect ratio. */}
        <div className="relative aspect-[5/4] w-full sm:aspect-[16/10] lg:order-2 lg:aspect-auto">
          <Image
            src="/images/hero/hero-1.png"
            alt="Model wearing a white hand-embroidered Chikankari kurta by Eifa Couture"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-[50%_12%]"
          />
        </div>

        <div className="flex items-center px-6 py-10 sm:px-10 sm:py-14 lg:order-1 lg:px-16 xl:px-24">
          <div className="max-w-xl">
            <p className="flex items-center gap-3 text-[10px] uppercase tracking-[0.32em] text-gold-dark sm:text-xs">
              <span className="block h-px w-10 bg-gold" aria-hidden="true" />
              Lucknow · Est. 1998
            </p>

            <h1 className="mt-5 font-heading text-[2.6rem] leading-[1.02] text-charcoal sm:text-6xl xl:text-7xl">
              Handcrafted Chikankari,
              <span className="block italic text-maroon">made to be treasured.</span>
            </h1>

            <p className="mt-5 max-w-md text-sm leading-7 text-charcoal/65 sm:text-base sm:leading-8">
              Heritage Lucknowi embroidery on sarees, kurtas and silks — for women, men, festive moments
              and everyday elegance.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:flex sm:gap-4">
              <Link
                href="/shop?audience=women"
                className="inline-flex min-h-12 items-center justify-center bg-maroon px-6 text-[11px] font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-charcoal sm:px-9"
              >
                Shop Women
              </Link>
              <Link
                href="/shop?audience=men"
                className="inline-flex min-h-12 items-center justify-center border border-charcoal px-6 text-[11px] font-medium uppercase tracking-[0.18em] text-charcoal transition-colors hover:bg-charcoal hover:text-white sm:px-9"
              >
                Shop Men
              </Link>
            </div>

            <nav aria-label="Quick links" className="mt-7 flex flex-wrap gap-x-6 gap-y-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="border-b border-charcoal/20 pb-0.5 text-[11px] uppercase tracking-[0.16em] text-charcoal/70 transition-colors hover:border-maroon hover:text-maroon"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
}
