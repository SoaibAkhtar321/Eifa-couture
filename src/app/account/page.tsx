import type { Metadata } from 'next';
import Link from 'next/link';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/ui/CartDrawer';

export const metadata: Metadata = {
  title: 'My Account | Eifa Couture',
  description:
    'Access your Eifa Couture account for orders, wishlist, saved details, and handcrafted Chikankari shopping support.',
};

const accountBenefits = [
  {
    title: 'Track Orders',
    description:
      'View your order status, delivery updates, and past purchases in one place.',
  },
  {
    title: 'Save Wishlist',
    description:
      'Keep your favourite handcrafted pieces saved for later shopping.',
  },
  {
    title: 'Faster Checkout',
    description:
      'Save your details for a smoother checkout experience in future.',
  },
];

export default function AccountPage() {
  return (
    <>
      <Header />

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
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
              <div className="border border-beige bg-white p-5 sm:p-7 lg:p-8">
                <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.28em] text-gold">
                  Sign In
                </span>

                <h2 className="font-heading text-3xl text-charcoal">
                  Welcome Back
                </h2>

                <p className="mt-3 text-sm leading-7 text-charcoal/58">
                  Account login is ready for UI/demo. Later, we can connect it
                  with Firebase Auth, email login, OTP, or Google Sign-In.
                </p>

                <form className="mt-7 space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">
                      Email Address
                    </span>

                    <input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      className="w-full border border-beige bg-ivory px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-gold"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">
                      Password
                    </span>

                    <input
                      type="password"
                      name="password"
                      placeholder="Enter password"
                      className="w-full border border-beige bg-ivory px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-gold"
                    />
                  </label>

                  <button
                    type="button"
                    className="btn-luxury btn-luxury-primary w-full"
                  >
                    Sign In Coming Soon
                  </button>
                </form>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <Link
                    href="/track-order"
                    className="text-maroon transition-colors hover:text-gold"
                  >
                    Track order without login
                  </Link>

                  <Link
                    href="/contact"
                    className="text-charcoal/50 transition-colors hover:text-maroon"
                  >
                    Need help?
                  </Link>
                </div>
              </div>

              <div className="space-y-6">
                <div className="border border-beige bg-cream/60 p-5 sm:p-7 lg:p-8">
                  <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.28em] text-gold">
                    New Customer
                  </span>

                  <h2 className="font-heading text-3xl text-charcoal">
                    Create An Account
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-charcoal/58">
                    Create an account later to save addresses, wishlist items,
                    and manage your handcrafted Chikankari orders.
                  </p>

                  <button
                    type="button"
                    className="btn-luxury btn-luxury-secondary mt-7 w-full"
                  >
                    Register Coming Soon
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  {accountBenefits.map((benefit) => (
                    <article
                      key={benefit.title}
                      className="border border-beige bg-white p-5 transition-all duration-300 hover:border-gold/50"
                    >
                      <h3 className="font-heading text-2xl text-charcoal">
                        {benefit.title}
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-charcoal/58">
                        {benefit.description}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
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

      <Footer />
      <CartDrawer />
    </>
  );
}