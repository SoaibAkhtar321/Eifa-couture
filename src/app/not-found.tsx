import Link from 'next/link';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/ui/CartDrawer';

export default function NotFoundPage() {
  return (
    <>
      <Header />

      <main className="bg-ivory">
        <section className="min-h-[68vh] border-b border-beige bg-gradient-to-b from-cream/70 to-ivory">
          <div className="luxury-container flex min-h-[68vh] items-center justify-center py-16 text-center">
            <div className="max-w-2xl">
              <span className="mb-4 block font-body text-[11px] uppercase tracking-[0.34em] text-gold">
                Page Not Found
              </span>

              <h1 className="font-heading text-7xl leading-none text-maroon sm:text-8xl lg:text-9xl">
                404
              </h1>

              <h2 className="mt-6 font-heading text-4xl leading-tight text-charcoal sm:text-5xl">
                This piece seems to be missing
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-charcoal/58 sm:text-base sm:leading-8">
                The page you are looking for may have been moved, removed, or
                the link may be incorrect. Explore our handcrafted collection
                instead.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/shop" className="btn-luxury btn-luxury-primary">
                  Shop Collection
                </Link>

                <Link href="/" className="btn-luxury btn-luxury-secondary">
                  Back To Home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <CartDrawer />
    </>
  );
}