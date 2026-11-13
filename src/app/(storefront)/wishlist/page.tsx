'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';

import Link from 'next/link';


import Reveal from '@/components/motion/Reveal';
import ProductCard from '@/components/product/ProductCard';
import { createClient } from '@/lib/supabase/client';
import { fetchProductsByIds } from '@/lib/data/products';
import { useWishlistStore } from '@/store/wishlist-store';

import type { Product } from '@/types';


const subscribeToHydration = () => () => {};

function useHasHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );
}

export default function WishlistPage() {
  const hasHydrated = useHasHydrated();

  const wishlistItems = useWishlistStore((state) => state.items);


  const [fetchedProducts, setFetchedProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!hasHydrated || wishlistItems.length === 0) return;

    let isMounted = true;
    const supabase = createClient();

    fetchProductsByIds(supabase, wishlistItems).then((products) => {
      if (isMounted) setFetchedProducts(products);
    });

    return () => {
      isMounted = false;
    };
  }, [hasHydrated, wishlistItems]);

  const wishlistProducts = useMemo(() => {
    if (!hasHydrated) return [];

    const wishlistIdSet = new Set(wishlistItems);
    const wishlistOrder = new Map(wishlistItems.map((id, index) => [id, index]));

    return fetchedProducts
      .filter((product) => product.isActive && wishlistIdSet.has(product.id))
      .slice()
      .sort(
        (a, b) => (wishlistOrder.get(a.id) ?? 0) - (wishlistOrder.get(b.id) ?? 0)
      );
  }, [fetchedProducts, hasHydrated, wishlistItems]);

  return (
    <>

      <main className="bg-ivory">
        <section className="border-b border-beige bg-gradient-to-b from-cream/70 to-ivory">
          <div className="luxury-container py-6 sm:py-8 lg:py-12">
            <nav
              aria-label="Breadcrumb"
              className="mb-5 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-ink-muted sm:text-[11px]"
            >
              <Link href="/" className="hover:text-maroon">
                Home
              </Link>

              <span>/</span>

              <span className="text-ink-soft">Wishlist</span>
            </nav>

            <div className="max-w-2xl">
              <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.3em] text-gold sm:text-xs">
                Saved Pieces
              </span>

              <h1 className="font-heading text-4xl leading-tight text-charcoal sm:text-5xl lg:text-6xl">
                Your Wishlist
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-ink-muted sm:text-base">
                Keep your favourite handcrafted Chikankari pieces in one place
                and add them to your bag whenever you are ready.
              </p>
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-14 lg:py-20">
          <div className="luxury-container">
            {!hasHydrated ? (
              <div className="mx-auto max-w-xl border border-beige bg-white px-6 py-12 text-center">
                <h2 className="font-heading text-3xl text-charcoal">
                  Loading Wishlist
                </h2>

                <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-ink-muted">
                  Preparing your saved pieces.
                </p>
              </div>
            ) : wishlistProducts.length === 0 ? (
              <div className="mx-auto max-w-xl border border-beige bg-white px-6 py-12 text-center">
                <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-beige bg-cream text-2xl text-maroon">
                  ♡
                </span>

                <h2 className="font-heading text-3xl text-charcoal">
                  Your wishlist is empty
                </h2>

                <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-ink-muted">
                  Explore the collection and tap the heart icon to save pieces
                  you love.
                </p>

                <Link
                  href="/shop"
                  className="btn-luxury btn-luxury-primary mt-8 inline-flex"
                >
                  Explore Collection
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-7 flex flex-col gap-3 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="font-body text-[10px] uppercase tracking-[0.28em] text-gold sm:text-xs">
                      {wishlistProducts.length} Saved{' '}
                      {wishlistProducts.length === 1 ? 'Item' : 'Items'}
                    </p>

                    <h2 className="mt-2 font-heading text-3xl text-charcoal sm:text-4xl">
                      Saved For Later
                    </h2>
                  </div>

                  <Link
                    href="/shop"
                    className="font-body text-xs uppercase tracking-[0.2em] text-maroon transition-colors hover:text-gold"
                  >
                    Continue Shopping →
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-x-2.5 gap-y-5 sm:gap-x-5 sm:gap-y-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
                  {wishlistProducts.map((product, index) => (
                    <Reveal key={product.id} delay={Math.min(index * 0.06, 0.3)}>
                      <ProductCard product={product} priority={index < 2} />
                    </Reveal>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

    </>
  );
}
