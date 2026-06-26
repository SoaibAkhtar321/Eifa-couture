import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/ui/CartDrawer';

export const metadata: Metadata = {
  title: 'Our Story | Eifa Couture',
  description:
    'Discover the story of Eifa Couture, a premium Lucknowi Chikankari fashion house preserving handcrafted elegance since 1998.',
};

const values = [
  {
    title: 'Handcrafted Detail',
    description:
      'Every piece is shaped with patient hand embroidery, refined finishing, and attention to fabric movement.',
  },
  {
    title: 'Lucknowi Craft',
    description:
      'Our work is rooted in the elegance of traditional Chikankari, reimagined for modern wardrobes.',
  },
  {
    title: 'Premium Fabrics',
    description:
      'We select fabrics that feel graceful, breathable, and occasion-ready — from cottons to silks and organza.',
  },
];

const timeline = [
  {
    year: '1998',
    title: 'The Beginning',
    description:
      'Eifa Couture began with a love for authentic Lucknowi Chikankari and handcrafted ethnic wear.',
  },
  {
    year: '2008',
    title: 'Refined Collections',
    description:
      'The brand expanded into curated silhouettes for festive, bridal, and everyday luxury dressing.',
  },
  {
    year: 'Today',
    title: 'Heritage For Modern India',
    description:
      'Eifa continues to bring Lucknowi embroidery into premium pieces for women and men.',
  },
];

export default function AboutPage() {
  return (
    <>
      <Header />

      <main className="bg-ivory">
        <section className="relative overflow-hidden border-b border-beige bg-charcoal text-white">
          <div className="absolute inset-0">
            <Image
              src="/images/hero/hero-1.png"
              alt="Eifa Couture Lucknowi Chikankari heritage"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center opacity-45"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-b from-charcoal/50 via-maroon/55 to-charcoal/90" />

          <div className="luxury-container relative z-10 py-20 text-center sm:py-24 lg:py-32">
            <span className="mb-4 block font-body text-[10px] uppercase tracking-[0.34em] text-gold sm:text-xs">
              Our Story
            </span>

            <h1 className="mx-auto max-w-4xl font-heading text-5xl leading-[0.95] text-white sm:text-6xl lg:text-8xl">
              Heritage In Every Stitch
            </h1>

            <div className="divider-gold mx-auto mt-6 w-24" />

            <p className="mx-auto mt-7 max-w-2xl font-subheading text-lg italic leading-8 text-white/80 sm:text-2xl sm:leading-10">
              Since 1998, Eifa Couture has celebrated the quiet luxury of
              Lucknowi Chikankari through handcrafted pieces made with patience,
              precision, and grace.
            </p>
          </div>
        </section>

        <section className="py-12 sm:py-16 lg:py-24">
          <div className="luxury-container">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <div>
                <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.3em] text-gold sm:text-xs">
                  Eifa Couture
                </span>

                <h2 className="font-heading text-4xl leading-tight text-charcoal sm:text-5xl lg:text-6xl">
                  A House Of
                  <br />
                  <span className="text-gradient-gold">Lucknowi Elegance</span>
                </h2>
              </div>

              <div className="space-y-5 text-sm leading-8 text-charcoal/62 sm:text-base sm:leading-9">
                <p>
                  Eifa Couture is built around the belief that handcrafted
                  clothing should feel personal, graceful, and timeless. Our
                  collections bring together traditional Chikankari embroidery
                  and refined silhouettes for women, men, festive moments, and
                  everyday elegance.
                </p>

                <p>
                  From delicate kurtas and sarees to bridal-inspired pieces and
                  menswear, every design is created to carry the softness of
                  Lucknowi craft while feeling relevant for today&apos;s wardrobe.
                </p>

                <p>
                  The goal is simple: to preserve the artistry of hand embroidery
                  while giving customers a premium shopping experience rooted in
                  trust, quality, and beauty.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-cream py-12 sm:py-16 lg:py-24">
          <div className="luxury-container">
            <div className="mb-9 text-center sm:mb-12">
              <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.3em] text-gold sm:text-xs">
                What We Stand For
              </span>

              <h2 className="font-heading text-4xl text-charcoal sm:text-5xl">
                The Eifa Promise
              </h2>

              <div className="divider-gold mx-auto mt-5 w-24" />
            </div>

            <div className="grid gap-4 md:grid-cols-3 md:gap-5">
              {values.map((value) => (
                <article
                  key={value.title}
                  className="border border-beige bg-white p-6 text-center transition-all duration-300 hover:border-gold/50 sm:p-8"
                >
                  <h3 className="font-heading text-2xl text-charcoal">
                    {value.title}
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-charcoal/58">
                    {value.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 lg:py-24">
          <div className="luxury-container">
            <div className="grid gap-10 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-16">
              <div>
                <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.3em] text-gold sm:text-xs">
                  Since 1998
                </span>

                <h2 className="font-heading text-4xl leading-tight text-charcoal sm:text-5xl">
                  Our Journey
                </h2>

                <p className="mt-5 text-sm leading-7 text-charcoal/58 sm:text-base sm:leading-8">
                  A slow, careful journey from traditional craft to premium
                  contemporary Chikankari.
                </p>
              </div>

              <div className="space-y-4">
                {timeline.map((item) => (
                  <article
                    key={item.year}
                    className="grid gap-4 border border-beige bg-white p-5 sm:grid-cols-[110px_minmax(0,1fr)] sm:p-6"
                  >
                    <span className="font-heading text-3xl text-gradient-gold">
                      {item.year}
                    </span>

                    <div>
                      <h3 className="font-heading text-2xl text-charcoal">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-sm leading-7 text-charcoal/58">
                        {item.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-maroon py-12 text-center text-white sm:py-16">
          <div className="luxury-container">
            <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.3em] text-gold sm:text-xs">
              Explore The Collection
            </span>

            <h2 className="mx-auto max-w-2xl font-heading text-4xl leading-tight sm:text-5xl">
              Discover Handcrafted Chikankari Made For Modern Elegance
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/65 sm:text-base sm:leading-8">
              Browse women&apos;s kurtas, men&apos;s kurtas, sarees, dupattas,
              festive pieces, and more.
            </p>

            <Link
              href="/shop"
              className="btn-luxury mt-8 inline-flex border border-gold bg-gold px-8 py-4 text-charcoal hover:bg-white"
            >
              Shop Collection
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <CartDrawer />
    </>
  );
}