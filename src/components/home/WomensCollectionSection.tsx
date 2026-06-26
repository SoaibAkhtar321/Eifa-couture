import Link from 'next/link';

export default function WomensCollectionSection() {
  return (
    <section className="bg-ivory py-10 md:py-16 lg:py-24" aria-labelledby="womens-heading">
      <div className="luxury-container">
        <div className="grid grid-cols-1 overflow-hidden bg-white lg:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden bg-beige sm:aspect-[16/10] lg:aspect-auto lg:min-h-[620px]">
            <img
              src="/images/collections/women.png"
              alt="Women&apos;s Chikankari Collection"
              className="h-full w-full object-cover"
              loading="lazy"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/25 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-ivory/10" />
            <div className="absolute left-4 top-4 h-12 w-12 border-l-2 border-t-2 border-gold/50 md:left-8 md:top-8 md:h-16 md:w-16" />
          </div>

          <div className="flex items-center px-5 py-8 md:px-10 md:py-12 lg:px-16 xl:px-20">
            <div className="w-full max-w-xl">
              <div className="mb-4 flex items-center gap-3 md:mb-5">
                <div className="h-px w-8 bg-gold md:w-10" />
                <span className="font-body text-[10px] uppercase tracking-[0.28em] text-gold md:text-xs">
                  For Her
                </span>
              </div>

              <h2
                id="womens-heading"
                className="font-heading text-3xl leading-[1.08] text-charcoal md:text-5xl lg:text-6xl"
              >
                The Women&apos;s
                <br />
                <span className="text-gradient-gold">Collection</span>
              </h2>

              <div className="my-5 h-px w-14 bg-gold/40 md:my-7 md:w-16" />

              <p className="font-subheading text-lg italic leading-relaxed text-charcoal/70 md:text-xl">
                From ethereal kurtas to opulent bridal ensembles — every piece is a canvas of Lucknowi artistry.
              </p>

              <p className="mt-4 font-body text-sm leading-relaxed text-charcoal/55 md:mt-5">
                Each garment is crafted with meticulous hand-embroidery, ensuring every stitch carries the soul of our master karigars.
              </p>

              <div className="mt-6 md:mt-8">
                <Link
                  href="/shop/womens-kurtas"
                  className="btn-luxury btn-luxury-primary px-6 py-3 text-[11px] md:px-10 md:py-4 md:text-sm"
                >
                  Explore Women&apos;s Edit
                </Link>
              </div>

              <div className="mt-7 grid grid-cols-3 gap-3 border-t border-beige pt-5 md:mt-10 md:gap-6 md:pt-7">
                <div>
                  <span className="font-heading text-2xl text-gradient-gold md:text-3xl">
                    200+
                  </span>
                  <p className="mt-1 font-body text-[9px] uppercase tracking-[0.1em] text-charcoal/50 md:text-xs">
                    Designs
                  </p>
                </div>

                <div>
                  <span className="font-heading text-2xl text-gradient-gold md:text-3xl">
                    12
                  </span>
                  <p className="mt-1 font-body text-[9px] uppercase tracking-[0.1em] text-charcoal/50 md:text-xs">
                    Categories
                  </p>
                </div>

                <div>
                  <span className="font-heading text-2xl text-gradient-gold md:text-3xl">
                    50+
                  </span>
                  <p className="mt-1 font-body text-[9px] uppercase tracking-[0.1em] text-charcoal/50 md:text-xs">
                    Artisans
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}