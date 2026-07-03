import type { Metadata } from 'next';
import { Suspense } from 'react';

import ShopPageClient from '@/components/shop/ShopPageClient';

export const metadata: Metadata = {
  title: 'Shop Collection | Eifa Couture',
  description:
    'Explore Eifa Couture’s premium handcrafted Lucknowi Chikankari collection.',
};

export default function ShopPage() {
  return (
    <>

      <main>
        <Suspense
          fallback={
            <section className="min-h-screen bg-ivory pt-32">
              <div className="luxury-container">
                <p className="text-xs uppercase tracking-[0.28em] text-gold-dark">
                  Loading collection...
                </p>
              </div>
            </section>
          }
        >
          <ShopPageClient />
        </Suspense>
      </main>

    </>
  );
}