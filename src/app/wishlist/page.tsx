'use client';

import { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/ui/CartDrawer';

import { MOCK_PRODUCTS } from '@/lib/mock-data';
import { formatPrice } from '@/lib/utils';

import { useCartStore } from '@/store/cart-store';
import { useUIStore } from '@/store/ui-store';
import { useWishlistStore } from '@/store/wishlist-store';

import type { Product } from '@/types';

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  'womens-kurtas': '/images/categories/kurtas.png',
  'mens-kurtas': '/images/categories/men-kurtas.png',
  anarkalis: '/images/categories/anarkali.png',
  dupattas: '/images/categories/dupattas.png',
  sarees: '/images/categories/sarees.png',
  'palazzo-sets': '/images/categories/palazzo.png',
  'bridal-collection': '/images/categories/bridal.png',
  accessories: '/images/categories/dupattas.png',
  'crochet-bags': '/images/categories/dupattas.png',
};

const DEFAULT_PRODUCT_IMAGE = '/images/categories/kurtas.png';

function getProductImage(product: Product) {
  const image = product.images?.[0];

  if (!image || image.includes('picsum.photos')) {
    return CATEGORY_FALLBACK_IMAGES[product.category] || DEFAULT_PRODUCT_IMAGE;
  }

  return image;
}

export default function WishlistPage() {
  const [hasMounted, setHasMounted] = useState(false);

  const wishlistItems = useWishlistStore((state) => state.items);
  const removeWishlistItem = useWishlistStore((state) => state.removeItem);

  const addItem = useCartStore((state) => state.addItem);
  const openCart = useUIStore((state) => state.openCart);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const wishlistProducts = useMemo(() => {
    if (!hasMounted) return [];

    return wishlistItems
      .map((productId) =>
        MOCK_PRODUCTS.find(
          (product) => product.id === productId && product.isActive
        )
      )
      .filter((product): product is Product => Boolean(product));
  }, [hasMounted, wishlistItems]);

  const handleAddToCart = (product: Product) => {
    const defaultSize = product.sizes[0];
    const defaultColor = product.colors[0]?.name;

    if (!defaultSize || !defaultColor) return;

    addItem(product, defaultSize, defaultColor, 1);
    openCart();
  };

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

              <span className="text-charcoal/70">Wishlist</span>
            </nav>

            <div className="max-w-2xl">
              <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.3em] text-gold sm:text-xs">
                Saved Pieces
              </span>

              <h1 className="font-heading text-4xl leading-tight text-charcoal sm:text-5xl lg:text-6xl">
                Your Wishlist
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-charcoal/55 sm:text-base">
                Keep your favourite handcrafted Chikankari pieces in one place
                and add them to your bag whenever you are ready.
              </p>
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-14 lg:py-20">
          <div className="luxury-container">
            {!hasMounted ? (
              <div className="mx-auto max-w-xl border border-beige bg-white px-6 py-12 text-center">
                <h2 className="font-heading text-3xl text-charcoal">
                  Loading Wishlist
                </h2>

                <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-charcoal/55">
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

                <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-charcoal/55">
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

                <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
                  {wishlistProducts.map((product, index) => {
                    const productImage = getProductImage(product);

                    return (
                      <article key={product.id} className="group">
                        <div className="relative overflow-hidden bg-cream">
                          <Link
                            href={`/product/${product.slug}`}
                            aria-label={`View ${product.name}`}
                            className="block"
                          >
                            <div className="relative aspect-[3/4] overflow-hidden">
                              <Image
                                src={productImage}
                                alt={product.name}
                                fill
                                priority={index < 2}
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                            </div>
                          </Link>

                          <button
                            type="button"
                            onClick={() => removeWishlistItem(product.id)}
                            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-ivory/95 text-sm text-maroon shadow-sm transition-all duration-300 hover:bg-maroon hover:text-white"
                            aria-label={`Remove ${product.name} from wishlist`}
                          >
                            ♥
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            className="absolute inset-x-3 bottom-3 bg-charcoal px-4 py-3 text-[10px] font-medium uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-maroon sm:inset-x-4 sm:bottom-4 sm:text-[11px]"
                          >
                            Add To Bag
                          </button>
                        </div>

                        <div className="pt-4">
                          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.24em] text-gold-dark">
                            {product.fabric}
                          </p>

                          <Link href={`/product/${product.slug}`}>
                            <h3 className="font-heading text-lg leading-snug text-charcoal transition-colors duration-300 hover:text-maroon sm:text-xl">
                              {product.name}
                            </h3>
                          </Link>

                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-charcoal/60">
                            {product.shortDescription}
                          </p>

                          <div className="mt-3 flex items-center gap-3">
                            <span className="text-sm font-medium text-charcoal">
                              {formatPrice(product.price)}
                            </span>

                            {product.compareAtPrice && (
                              <span className="text-xs text-charcoal/40 line-through">
                                {formatPrice(product.compareAtPrice)}
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
      <CartDrawer />
    </>
  );
}