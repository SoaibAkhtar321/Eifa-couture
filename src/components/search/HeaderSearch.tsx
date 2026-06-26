'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

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

export default function HeaderSearch() {
  const searchRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filteredProducts = useMemo(() => {
    const searchText = query.trim().toLowerCase();

    if (!searchText) return [];

    return MOCK_PRODUCTS.filter((product) => {
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
    }).slice(0, 6);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!searchRef.current) return;

      if (!searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const closeSearch = () => {
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={searchRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-10 w-10 items-center justify-center text-charcoal/55 transition-colors duration-300 hover:text-maroon sm:h-11 sm:w-11"
        aria-label="Search"
        aria-expanded={isOpen}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.55"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-x-4 top-[92px] z-[140] border border-beige bg-white shadow-[0_18px_55px_rgba(0,0,0,0.16)] sm:left-auto sm:right-6 sm:top-[98px] sm:w-[430px] lg:right-10 lg:top-[104px]">
          <div className="border-b border-beige p-4">
            <div className="flex items-center gap-3 border border-beige bg-ivory px-4 py-3">
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.55"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="shrink-0 text-charcoal/40"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>

              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search kurtas, sarees, bags..."
                className="w-full bg-transparent text-sm text-charcoal outline-none placeholder:text-charcoal/35"
                autoFocus
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-xl leading-none text-charcoal/35 hover:text-maroon"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {!query.trim() ? (
              <div className="p-5">
                <p className="font-body text-[10px] uppercase tracking-[0.26em] text-gold">
                  Popular Searches
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {['Kurta', 'Saree', 'Dupatta', 'Men', 'Bridal', 'Bags'].map(
                    (term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setQuery(term)}
                        className="border border-beige bg-cream px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-charcoal/60 transition-colors hover:border-maroon hover:text-maroon"
                      >
                        {term}
                      </button>
                    )
                  )}
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-6 text-center">
                <h3 className="font-heading text-2xl text-charcoal">
                  No products found
                </h3>

                <p className="mt-2 text-sm leading-6 text-charcoal/55">
                  Try searching kurta, saree, dupatta, bridal, men, or bags.
                </p>

                <Link
                  href="/shop"
                  onClick={closeSearch}
                  className="btn-luxury btn-luxury-secondary mt-5 inline-flex"
                >
                  View Collection
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-beige">
                {filteredProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    onClick={closeSearch}
                    className="flex gap-4 p-4 transition-colors hover:bg-cream/60"
                  >
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-cream">
                      <Image
                        src={getProductImage(product)}
                        alt={product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-gold">
                        {product.fabric}
                      </p>

                      <h3 className="mt-1 line-clamp-1 font-heading text-xl text-charcoal">
                        {product.name}
                      </h3>

                      <p className="mt-1 line-clamp-1 text-xs text-charcoal/50">
                        {product.shortDescription}
                      </p>

                      <p className="mt-2 text-sm font-medium text-maroon">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                  </Link>
                ))}

                <div className="p-4">
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}`}
                    onClick={() => setIsOpen(false)}
                    className="block border border-beige bg-ivory px-4 py-3 text-center text-[11px] uppercase tracking-[0.2em] text-charcoal/60 transition-colors hover:border-maroon hover:text-maroon"
                  >
                    View all results
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}