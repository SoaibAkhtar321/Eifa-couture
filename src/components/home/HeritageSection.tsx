export default function HeritageSection() {
  return (
    <section
      className="relative overflow-hidden bg-maroon py-10 text-white md:py-16 lg:py-24"
      aria-labelledby="heritage-heading"
    >
      <div className="texture-grain absolute inset-0" />

      <div className="luxury-container relative z-10">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="mb-4 flex items-center gap-3 md:mb-5">
              <div className="h-px w-8 bg-gold md:w-10" />
              <span className="font-body text-[10px] uppercase tracking-[0.28em] text-gold md:text-xs">
                Our Legacy
              </span>
            </div>

            <h2
              id="heritage-heading"
              className="font-heading text-3xl leading-[1.08] text-white md:text-5xl lg:text-6xl"
            >
              A Heritage of
              <br />
              <span className="text-gold">Artistry</span>
            </h2>

            <div className="my-5 h-px w-14 bg-gold/40 md:my-7 md:w-16" />

            <p className="font-subheading text-lg italic leading-relaxed text-white/80 md:text-xl">
              Since 1998, Eifa Couture has been at the heart of Lucknow&apos;s Chikankari tradition.
            </p>

            <p className="mt-4 font-body text-sm leading-relaxed text-white/60 md:mt-5">
              Chikankari, an embroidery art from the Mughal era, is one of India&apos;s most refined textile traditions. At Eifa Couture, we honour this 400-year legacy.
            </p>

            <p className="mt-3 hidden font-body text-sm leading-relaxed text-white/60 md:block">
              Our atelier works with over 50 skilled karigars across Lucknow, each specializing in specific stitches.
            </p>

            <div className="mt-7 grid grid-cols-3 gap-3 border-t border-white/10 pt-5 md:mt-10 md:gap-6 md:pt-7">
              <div>
                <span className="font-heading text-2xl text-gold md:text-4xl">
                  25+
                </span>
                <p className="mt-1 font-body text-[9px] uppercase tracking-[0.1em] text-white/45 md:text-xs">
                  Years
                </p>
              </div>

              <div>
                <span className="font-heading text-2xl text-gold md:text-4xl">
                  50+
                </span>
                <p className="mt-1 font-body text-[9px] uppercase tracking-[0.1em] text-white/45 md:text-xs">
                  Artisans
                </p>
              </div>

              <div>
                <span className="font-heading text-2xl text-gold md:text-4xl">
                  36
                </span>
                <p className="mt-1 font-body text-[9px] uppercase tracking-[0.1em] text-white/45 md:text-xs">
                  Stitch Types
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden bg-maroon-dark sm:aspect-[16/10] lg:aspect-[4/5]">
              <img
                src="/images/about/heritage.png"
                alt="Artisan handcrafting Chikankari embroidery"
                className="h-full w-full object-cover"
                loading="lazy"
              />

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-maroon-dark/90 to-transparent p-4 md:p-7">
                <blockquote className="font-subheading text-sm italic leading-relaxed text-white/85 md:text-lg">
                  &ldquo;Every thread we weave carries the whisper of a 400-year legacy.&rdquo;
                </blockquote>
              </div>
            </div>

            <div className="absolute -right-4 -top-4 hidden h-full w-full border-2 border-gold/20 lg:block" />
          </div>
        </div>
      </div>
    </section>
  );
}