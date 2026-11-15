import type { Metadata } from 'next';
import { Suspense } from 'react';

import OrderTracker from '@/components/account/OrderTracker';

export const metadata: Metadata = {
  title: 'Track Order',
  description: 'Follow your Eifa Couture order from our Lucknow atelier to your door.',
};

export default function TrackOrderPage() {
  return (
    <main className="bg-ivory">
      <section className="border-b border-beige bg-cream">
        <div className="luxury-container py-8 lg:py-12">
          <span className="block text-[10px] uppercase tracking-[0.3em] text-gold-dark sm:text-xs">Order Updates</span>
          <h1 className="mt-2 font-heading text-4xl text-charcoal sm:text-5xl">Track Your Order</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-ink-soft sm:text-base">
            See where your piece is — from our Lucknow atelier to your doorstep.
          </p>
        </div>
      </section>
      <section className="py-8 sm:py-12">
        <div className="luxury-container">
          <Suspense fallback={<p className="text-sm text-ink-soft">Loading…</p>}>
            <OrderTracker />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
