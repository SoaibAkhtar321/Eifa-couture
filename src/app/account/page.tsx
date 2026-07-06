import type { Metadata } from 'next';
import Link from 'next/link';

import AccountAuthPanel from '@/components/auth/AccountAuthPanel';

export const metadata: Metadata = {
  title: 'My Account | Eifa Couture',
  description:
    'Access your Eifa Couture account for orders, wishlist, saved details, and handcrafted Chikankari shopping support.',
};

export default function AccountPage() {
  return (
    <>

      <main className="bg-ivory">
        <section className="border-b border-beige bg-gradient-to-b from-cream/70 to-ivory">
          <div className="luxury-container py-6 sm:py-8 lg:py-12">
            <nav
              aria-label="Breadcrumb"
              className="mb-5 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-charcoal/45 sm:text-[11px]"
            >
              <Link href="/" className="hover:text-maroon">
                Home
              </Link>

              <span>/</span>

              <span className="text-charcoal/70">Account</span>
            </nav>

            <div className="max-w-2xl">
              <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.3em] text-gold sm:text-xs">
                Customer Account
              </span>

              <h1 className="font-heading text-4xl leading-tight text-charcoal sm:text-5xl lg:text-6xl">
                My Account
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-charcoal/55 sm:text-base">
                Sign in to manage orders, wishlist, saved details, and future
                Eifa Couture purchases.
              </p>
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-14 lg:py-20">
          <div className="luxury-container">
            <AccountAuthPanel />
          </div>
        </section>

        <section className="bg-maroon py-12 text-center text-white sm:py-16">
          <div className="luxury-container">
            <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.3em] text-gold sm:text-xs">
              Continue Shopping
            </span>

            <h2 className="mx-auto max-w-2xl font-heading text-4xl leading-tight sm:text-5xl">
              Discover New Handcrafted Pieces
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/65 sm:text-base sm:leading-8">
              Explore premium Lucknowi Chikankari pieces for women, men,
              accessories, and festive occasions.
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

    </>
  );
}