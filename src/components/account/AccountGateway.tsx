'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

import AccountHeader from './AccountHeader';
import AccountOverview from './AccountOverview';
import AccountQuickActions from './AccountQuickActions';

const accountBenefits = [
  { title: 'Track Orders', description: 'View your order status, delivery updates, and past purchases in one place.' },
  { title: 'Save Wishlist', description: 'Keep your favourite handcrafted pieces saved for later shopping.' },
  { title: 'Faster Checkout', description: 'Save your details for a smoother checkout experience in future.' },
];

export default function AccountGateway() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="border border-beige bg-white p-5 sm:p-7 lg:p-8">
        <p className="text-sm text-charcoal/50">Loading account…</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="space-y-8">
        <AccountHeader user={user} />
        <AccountOverview user={user} />
        <AccountQuickActions />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
      <div className="border border-beige bg-white p-5 sm:p-7 lg:p-8">
        <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.28em] text-gold">Sign In</span>
        <h2 className="font-heading text-3xl text-charcoal">Welcome Back</h2>
        <p className="mt-3 text-sm leading-7 text-charcoal/58">
          Sign in to manage orders, wishlist, and saved details.
        </p>
        <Link href="/login" className="btn-luxury btn-luxury-primary mt-7 w-full">Sign In</Link>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
          <Link href="/track-order" className="text-maroon transition-colors hover:text-gold">
            Track order without login
          </Link>
          <Link href="/contact" className="text-charcoal/50 transition-colors hover:text-maroon">
            Need help?
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <div className="border border-beige bg-cream/60 p-5 sm:p-7 lg:p-8">
          <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.28em] text-gold">New Customer</span>
          <h2 className="font-heading text-3xl text-charcoal">Create An Account</h2>
          <p className="mt-3 text-sm leading-7 text-charcoal/58">
            Create an account to save addresses, wishlist items, and manage your handcrafted Chikankari orders.
          </p>
          <Link href="/register" className="btn-luxury btn-luxury-secondary mt-7 w-full">Register</Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {accountBenefits.map((b) => (
            <article key={b.title} className="border border-beige bg-white p-5 transition-all duration-300 hover:border-gold/50">
              <h3 className="font-heading text-2xl text-charcoal">{b.title}</h3>
              <p className="mt-3 text-sm leading-7 text-charcoal/58">{b.description}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}