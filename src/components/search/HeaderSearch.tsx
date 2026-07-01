'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

import { MOCK_PRODUCTS } from '@/lib/mock-data';
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
} from '@/lib/search-history';
import { formatPrice, highlightSegments } from '@/lib/utils';

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

const POPULAR_SEARCHES = ['Kurta', 'Saree', 'Dupatta', 'Men', 'Bridal', 'Bags'];

function getProductImage(product: Product) {
  const image = product.images?.[0];
  if (!image || image.includes('picsum.photos')) {
    return CATEGORY_FALLBACK_IMAGES[product.category] || DEFAULT_PRODUCT_IMAGE;
  }
  return image;
}

/** Renders text with the matching portion of `query` visually highlighted. */
function HighlightedText({ text, query }: { text: string; query: string }) {
  const segments = highlightSegments(text, query);

  return (
    <>
      {segments.map((segment, index) =>
        segment.match ? (
          <mark
            key={index}
            className="bg-gold/25 text-maroon font-medium not-italic"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </>
  );
}

export default function HeaderSearch() {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

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

  // Highlight index resets whenever the query changes — handled inline in
  // the input's onChange handler below (not via effect) to avoid an extra
  // render pass.

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

  // Lock background scroll while the search overlay is open (matters most
  // for the mobile full-screen takeover).
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const closeSearch = () => {
    setIsOpen(false);
    setQuery('');
    setHighlightedIndex(-1);
  };

  const runSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;

    setRecentSearches(addRecentSearch(trimmed));
    setIsOpen(false);
    setQuery('');
    setHighlightedIndex(-1);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const goToProduct = (product: Product) => {
    addRecentSearch(query.trim() || product.name);
    setIsOpen(false);
    setQuery('');
    setHighlightedIndex(-1);
    router.push(`/product/${product.slug}`);
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const handleRemoveRecent = (term: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setRecentSearches(removeRecentSearch(term));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!filteredProducts.length) {
      if (event.key === 'Enter') {
        event.preventDefault();
        runSearch(query);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((current) =>
        current < filteredProducts.length - 1 ? current + 1 : current
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((current) => (current > -1 ? current - 1 : -1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (highlightedIndex >= 0 && filteredProducts[highlightedIndex]) {
        goToProduct(filteredProducts[highlightedIndex]);
      } else {
        runSearch(query);
      }
    }
  };

  return (
    <div ref={searchRef} className="relative z-[140]">
      <button
        type="button"
        onClick={() => {
          setIsOpen((current) => {
            const next = !current;
            if (next) {
              setRecentSearches(getRecentSearches());
            }
            return next;
          });
        }}
        className="flex h-10 w-10 items-center justify-center text-charcoal/55 transition-colors duration-300 hover:text-maroon sm:h-11 sm:w-11"
        aria-label="Toggle search"
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
        <div
          className="fixed inset-0 z-[150] flex flex-col bg-ivory sm:inset-x-auto sm:inset-y-auto sm:left-auto sm:right-6 sm:top-[98px] sm:z-[140] sm:h-auto sm:w-[430px] sm:border sm:border-beige sm:bg-white sm:shadow-[0_18px_55px_rgba(0,0,0,0.16)] lg:right-10 lg:top-[104px]"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <div className="border-b border-beige p-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-1 items-center gap-3 border border-beige bg-ivory px-4 py-3 sm:bg-ivory">
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

                <label htmlFor="header-search-input" className="sr-only">
                  Search products
                </label>
                <input
                  ref={inputRef}
                  id="header-search-input"
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setHighlightedIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search kurtas, sarees, bags..."
                  className="w-full bg-transparent text-sm text-charcoal outline-none placeholder:text-charcoal/35"
                  autoFocus
                  role="combobox"
                  aria-expanded={filteredProducts.length > 0}
                  aria-controls="header-search-results"
                  aria-activedescendant={
                    highlightedIndex >= 0
                      ? `header-search-result-${highlightedIndex}`
                      : undefined
                  }
                />

                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="text-xl leading-none text-charcoal/35 hover:text-maroon cursor-pointer"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Cancel button — always available, primary affordance on mobile full-screen takeover */}
              <button
                type="button"
                onClick={closeSearch}
                className="shrink-0 font-body text-[11px] uppercase tracking-[0.16em] text-charcoal/55 hover:text-maroon"
              >
                Cancel
              </button>
            </div>
          </div>

          <div
            id="header-search-results"
            role="listbox"
            className="flex-1 overflow-y-auto sm:max-h-[420px] sm:flex-none"
          >
            {!query.trim() ? (
              <div className="p-5">
                {recentSearches.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <p className="font-body text-[10px] uppercase tracking-[0.26em] text-gold">
                        Recent Searches
                      </p>
                      <button
                        type="button"
                        onClick={handleClearRecent}
                        className="font-body text-[10px] uppercase tracking-[0.16em] text-charcoal/40 hover:text-maroon"
                      >
                        Clear
                      </button>
                    </div>

                    <div className="mt-4 flex flex-col gap-1">
                      {recentSearches.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => runSearch(term)}
                          className="group flex items-center justify-between gap-3 rounded-sm px-2 py-2 text-left text-sm text-charcoal/75 transition-colors hover:bg-cream/60 hover:text-maroon cursor-pointer"
                        >
                          <span className="flex items-center gap-3">
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.55"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                              className="shrink-0 text-charcoal/30"
                            >
                              <circle cx="12" cy="12" r="9" />
                              <path d="M12 7v5l3 3" />
                            </svg>
                            {term}
                          </span>

                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(event) => handleRemoveRecent(term, event)}
                            className="shrink-0 text-base leading-none text-charcoal/25 opacity-0 transition-opacity hover:text-maroon group-hover:opacity-100"
                            aria-label={`Remove ${term} from recent searches`}
                          >
                            ×
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <p className="font-body text-[10px] uppercase tracking-[0.26em] text-gold">
                  Popular Searches
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => runSearch(term)}
                      className="border border-beige bg-cream px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-charcoal/60 transition-colors hover:border-maroon hover:text-maroon cursor-pointer"
                    >
                      {term}
                    </button>
                  ))}
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
                {filteredProducts.map((product, index) => (
                  <button
                    key={product.id}
                    id={`header-search-result-${index}`}
                    type="button"
                    role="option"
                    aria-selected={highlightedIndex === index}
                    onClick={() => goToProduct(product)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`flex w-full gap-4 p-4 text-left transition-colors cursor-pointer ${
                      highlightedIndex === index ? 'bg-cream/70' : 'hover:bg-cream/60'
                    }`}
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
                        <HighlightedText text={product.name} query={query} />
                      </h3>
                      <p className="mt-1 line-clamp-1 text-xs text-charcoal/50">
                        {product.shortDescription}
                      </p>
                      <p className="mt-2 text-sm font-medium text-maroon">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                  </button>
                ))}

                <div className="p-4">
                  <button
                    type="button"
                    onClick={() => runSearch(query)}
                    className="block w-full border border-beige bg-ivory px-4 py-3 text-center text-[11px] uppercase tracking-[0.2em] text-charcoal/60 transition-colors hover:border-maroon hover:text-maroon cursor-pointer"
                  >
                    View all results
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
