'use client';

import { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/ui/CartDrawer';

import { MOCK_PRODUCTS } from '@/lib/mock-data';
import { formatPrice } from '@/lib/utils';

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

function productMatchesSearch(product: Product, searchText: string) {
  const searchableText = [
    product.name,
    product.shortDescription,
    product.description,
    product.category,
    product.fabric,
  ]
    .join(' ')
    .toLowerCase();

  return product.isActive && searchableText.includes(searchText);
}

export default function SearchPage() {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get('q') || '';

    setQuery(initialQuery);
  }, []);

  const filteredProducts = useMemo(() => {
    const searchText = query.trim().toLowerCase();

    if (!searchText) return [];

    return MOCK_PRODUCTS.filter((product) =>
      productMatchesSearch(product, searchText)
    );
  }, [query]);

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

              <span className="text-charcoal/70">Search</span>
            </nav>

            <div className="max-w-2xl">
              <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.3em] text-gold sm:text-xs">
                Find Your Piece
              </span>

              <h1 className="font-heading text-4xl leading-tight text-charcoal sm:text-5xl lg:text-6xl">
                Search Collection
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-charcoal/55 sm:text-base">
                Search handcrafted Chikankari kurtas, sarees, dupattas,
                menswear, bridal pieces, and accessories.
              </p>
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-14 lg:py-20">
          <div className="luxury-container">
            <div className="mx-auto max-w-3xl">
              <label className="block">
                <span className="mb-3 block text-xs uppercase tracking-[0.22em] text-charcoal/55">
                  Search Products
                </span>

                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search kurtas, sarees, dupattas, bags..."
                  className="w-full border border-beige bg-white px-5 py-4 text-base text-charcoal outline-none transition-colors focus:border-gold"
                  autoFocus
                />
              </label>
            </div>

            <div className="mt-10">
              {!query.trim() ? (
                <div className="mx-auto max-w-xl border border-beige bg-white px-6 py-12 text-center">
                  <h2 className="font-heading text-3xl text-charcoal">
                    Start Searching
                  </h2>

                  <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-charcoal/55">
                    Try searching for kurta, saree, dupatta, bridal, men,
                    cotton, georgette, or crochet bags.
                  </p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="mx-auto max-w-xl border border-beige bg-white px-6 py-12 text-center">
                  <h2 className="font-heading text-3xl text-charcoal">
                    No Products Found
                  </h2>

                  <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-charcoal/55">
                    We could not find a product for “{query}”. Try another
                    keyword or explore the full collection.
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
                  <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="font-body text-[10px] uppercase tracking-[0.28em] text-gold sm:text-xs">
                        {filteredProducts.length} Result
                        {filteredProducts.length === 1 ? '' : 's'}
                      </p>

                      <h2 className="mt-2 font-heading text-3xl text-charcoal sm:text-4xl">
                        Search Results
                      </h2>
                    </div>

                    <Link
                      href="/shop"
                      className="font-body text-xs uppercase tracking-[0.2em] text-maroon transition-colors hover:text-gold"
                    >
                      View All Products →
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
                    {filteredProducts.map((product, index) => (
                      <article key={product.id} className="group">
                        <Link
                          href={`/product/${product.slug}`}
                          className="block"
                          aria-label={`View ${product.name}`}
                        >
                          <div className="relative aspect-[3/4] overflow-hidden bg-cream">
                            <Image
                              src={getProductImage(product)}
                              alt={product.name}
                              fill
                              priority={index < 2}
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          </div>

                          <div className="pt-4">
                            <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.24em] text-gold-dark">
                              {product.fabric}
                            </p>

                            <h3 className="font-heading text-lg leading-snug text-charcoal transition-colors duration-300 group-hover:text-maroon sm:text-xl">
                              {product.name}
                            </h3>

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
                        </Link>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <CartDrawer />
    </>
  );
}