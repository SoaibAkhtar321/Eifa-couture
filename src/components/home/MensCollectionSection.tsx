import Link from 'next/link';

export default function MensCollectionSection() {
  const fabrics = ['Cotton Lawn', 'Pure Silk', 'Chanderi', 'Linen Blend'];

  return (
    <section
      className="bg-charcoal py-10 text-white md:py-16 lg:py-24"
      aria-labelledby="mens-heading"
    >
      <div className="luxury-container">
        <div className="grid grid-cols-1 overflow-hidden bg-charcoal lg:grid-cols-2">
          <div className="order-2 flex items-center px-5 py-8 md:px-10 md:py-12 lg:order-1 lg:px-16 xl:px-20">
            <div className="w-full max-w-xl">
              <div className="mb-4 flex items-center gap-3 md:mb-5">
                <div className="h-px w-8 bg-gold md:w-10" />

                <span className="font-body text-[10px] uppercase tracking-[0.28em] text-gold md:text-xs">
                  For Him
                </span>
              </div>

              <h2
                id="mens-heading"
                className="font-heading text-3xl leading-[1.08] text-white md:text-5xl lg:text-6xl"
              >
                The Men&apos;s
                <br />
                <span className="text-gradient-gold">Collection</span>
              </h2>

              <div className="my-5 h-px w-14 bg-gold/40 md:my-7 md:w-16" />

              <p className="max-w-md font-subheading text-lg italic leading-relaxed text-white/75 md:text-xl">
                Refined silhouettes for the modern gentleman, crafted in premium
                fabrics with timeless Lucknowi embroidery.
              </p>

              <p className="mt-4 max-w-md font-body text-sm leading-relaxed text-white/50 md:mt-5">
                From crisp whites for summer to festive kurtas for special
                occasions, every piece is designed for understated elegance.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row md:mt-8">
                <Link
                  href="/shop?category=mens-kurtas"
                  className="btn-luxury bg-gold px-6 py-3 text-center text-[11px] text-charcoal hover:bg-gold-dark md:px-10 md:py-4 md:text-sm"
                >
                  Shop Men&apos;s Kurtas
                </Link>

                <Link
                  href="/shop"
                  className="btn-luxury border border-white/20 bg-transparent px-6 py-3 text-center text-[11px] text-white hover:border-gold hover:text-gold md:px-10 md:py-4 md:text-sm"
                >
                  View All
                </Link>
              </div>

              <div className="mt-7 border-t border-white/10 pt-5 md:mt-10 md:pt-7">
                <p className="font-body text-[10px] uppercase tracking-[0.24em] text-white/35 md:text-xs">
                  Available Fabrics
                </p>

                <div className="mt-4 flex flex-wrap gap-2 md:gap-3">
                  {fabrics.map((fabric) => (
                    <span
                      key={fabric}
                      className="border border-white/15 px-3 py-1.5 font-body text-[9px] uppercase tracking-[0.14em] text-white/55 md:px-4 md:py-2 md:text-[11px]"
                    >
                      {fabric}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="relative order-1 aspect-[4/5] overflow-hidden bg-charcoal sm:aspect-[16/10] lg:order-2 lg:aspect-auto lg:min-h-[620px]">
            <img
              src="/images/collections/men.png"
              alt="Men's Chikankari Kurta Collection"
              className="h-full w-full object-cover object-top"
              loading="lazy"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/25 to-transparent lg:bg-gradient-to-l lg:from-transparent lg:to-charcoal/30" />

            <div className="absolute bottom-4 right-4 h-12 w-12 border-b-2 border-r-2 border-gold/50 md:bottom-8 md:right-8 md:h-16 md:w-16" />
          </div>
        </div>
      </div>
    </section>
  );
}