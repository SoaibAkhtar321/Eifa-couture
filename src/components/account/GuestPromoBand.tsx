'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function GuestPromoBand() {
  const { isAuthenticated, loading } = useAuth();

  if (loading || isAuthenticated) return null;

  return (
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
  );
}