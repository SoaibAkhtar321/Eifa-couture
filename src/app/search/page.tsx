'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';


import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '@/lib/mock-data';
import {
  PRICE_FILTER_OPTIONS,
  SORT_OPTIONS,
  productMatchesPrice,
  productMatchesSearch,
  sortProducts,
  type PriceFilter,
  type SearchSortOption,
} from '@/lib/search';
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
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

// This page only offers the subset of the shared sort list that makes
// sense for search results (no name-a-z / popularity here) — the labels
// themselves still come from lib/search.ts so they can't drift from the
// shop page's copy.
const SEARCH_SORT_VALUES: SearchSortOption[] = [
  'relevance',
  'newest',
  'price-low-high',
  'price-high-low',
];
const sortOptions = SORT_OPTIONS.filter((option) =>
  SEARCH_SORT_VALUES.includes(option.value)
);

const priceFilterOptions = PRICE_FILTER_OPTIONS;

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

function chipClass(isActive: boolean) {
  return `shrink-0 border px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors duration-300 ${
    isActive
      ? 'border-maroon bg-maroon text-white'
      : 'border-charcoal/15 bg-white text-charcoal hover:border-gold hover:text-maroon'
  }`;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SearchSortOption>('relevance');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get('q') || '';

    setQuery(initialQuery);

    if (initialQuery.trim()) {
      setRecentSearches(addRecentSearch(initialQuery));
    } else {
      setRecentSearches(getRecentSearches());
    }
  }, []);

  // Close the sort popover on outside click / Escape.
  useEffect(() => {
    if (!isSortMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!sortMenuRef.current) return;
      if (!sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSortMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isSortMenuOpen]);

  // Lock background scroll while the mobile filter sheet is open.
  useBodyScrollLock(isFilterSheetOpen);

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const handleRecentSearchClick = (term: string) => {
    setQuery(term);
    setRecentSearches(addRecentSearch(term));
  };

  const submitQuery = () => {
    if (query.trim()) {
      setRecentSearches(addRecentSearch(query));
    }
  };

  const searchText = query.trim().toLowerCase();

  const searchMatchedProducts = useMemo(() => {
    if (!searchText) return [];

    return MOCK_PRODUCTS.filter((product) =>
      productMatchesSearch(product, searchText)
    );
  }, [searchText]);

  const availableCategories = useMemo(() => {
    const categorySlugs = new Set(
      searchMatchedProducts.map((product) => product.category)
    );

    return MOCK_CATEGORIES.filter(
      (category) => category.isActive && categorySlugs.has(category.slug)
    ).sort((a, b) => a.order - b.order);
  }, [searchMatchedProducts]);

  // If the query changes and the selected category no longer appears in the
  // results, treat the filter as "all" without needing an extra render pass.
  const effectiveCategoryFilter = availableCategories.some(
    (category) => category.slug === categoryFilter
  )
    ? categoryFilter
    : 'all';

  const filteredProducts = useMemo(() => {
    const filtered = searchMatchedProducts.filter((product) => {
      const matchesCategory =
        effectiveCategoryFilter === 'all' ||
        product.category === effectiveCategoryFilter;
      const matchesPrice = productMatchesPrice(product, priceFilter);

      return matchesCategory && matchesPrice;
    });

    return sortProducts(filtered, sortBy, searchText);
  }, [
    searchMatchedProducts,
    effectiveCategoryFilter,
    priceFilter,
    sortBy,
    searchText,
  ]);

  const hasActiveFilters =
    sortBy !== 'relevance' ||
    effectiveCategoryFilter !== 'all' ||
    priceFilter !== 'all';

  const activeFilterCount =
    (effectiveCategoryFilter !== 'all' ? 1 : 0) + (priceFilter !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setSortBy('relevance');
    setCategoryFilter('all');
    setPriceFilter('all');
  };

  const currentSortLabel =
    sortOptions.find((option) => option.value === sortBy)?.label ?? 'Relevance';

  const hasResults = query.trim().length > 0 && filteredProducts.length > 0;

  return (
    <>

      <main className="bg-ivory">
        {/* Compact search bar — replaces the old hero + separate input */}
        <section className="border-b border-beige bg-white">
          <div className="luxury-container py-4 sm:py-5">
            <nav
              aria-label="Breadcrumb"
              className="mb-3 hidden items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-charcoal/40 sm:flex"
            >
              <Link href="/" className="hover:text-maroon">
                Home
              </Link>
              <span>/</span>
              <span className="text-charcoal/65">Search</span>
            </nav>

            <label className="relative block">
              <span className="sr-only">Search products</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/35"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>

              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') submitQuery();
                }}
                onBlur={submitQuery}
                placeholder="Search kurtas, sarees, dupattas, bags..."
                className="h-12 w-full border border-beige bg-ivory pl-11 pr-4 text-sm text-charcoal outline-none transition-colors focus:border-gold sm:h-13"
                autoFocus={!query}
              />
            </label>
          </div>
        </section>

        <section className="py-6 sm:py-8">
          <div className="luxury-container">
            {!query.trim() ? (
              /* Empty state: recent + popular — no big hero, straight to content */
              <div className="mx-auto max-w-xl">
                {recentSearches.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <p className="font-body text-[10px] uppercase tracking-[0.28em] text-gold">
                        Recent Searches
                      </p>

                      <button
                        type="button"
                        onClick={handleClearRecent}
                        className="text-[11px] font-medium uppercase tracking-[0.18em] text-charcoal/40 transition-colors hover:text-maroon"
                      >
                        Clear
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {recentSearches.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => handleRecentSearchClick(term)}
                          className="border border-beige bg-cream px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-charcoal/60 transition-colors hover:border-maroon hover:text-maroon"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border border-beige bg-white px-6 py-10 text-center">
                  <h2 className="font-heading text-2xl text-charcoal">
                    Start Searching
                  </h2>

                  <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-charcoal/55">
                    Try searching for kurta, saree, dupatta, bridal, men,
                    cotton, georgette, or crochet bags.
                  </p>
                </div>
              </div>
            ) : searchMatchedProducts.length === 0 ? (
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
                {/* Result count + compact Sort / Filter row — Amazon/Myntra pattern */}
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="font-body text-xs uppercase tracking-[0.18em] text-charcoal/55">
                    <span className="font-medium text-charcoal">
                      {filteredProducts.length}
                    </span>{' '}
                    Result{filteredProducts.length === 1 ? '' : 's'}
                  </p>

                  <div className="flex items-center gap-2 lg:hidden">
                    {/* Sort — small popover */}
                    <div className="relative" ref={sortMenuRef}>
                      <button
                        type="button"
                        onClick={() => setIsSortMenuOpen((open) => !open)}
                        className="flex items-center gap-1.5 border border-beige bg-white px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-charcoal"
                        aria-expanded={isSortMenuOpen}
                      >
                        Sort
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      <AnimatePresence>
                        {isSortMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full z-(--z-dropdown) mt-2 w-52 border border-beige bg-white shadow-[0_12px_35px_rgba(0,0,0,0.12)]"
                          >
                            {sortOptions.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                  setSortBy(option.value);
                                  setIsSortMenuOpen(false);
                                }}
                                className={`block w-full px-4 py-2.5 text-left text-xs uppercase tracking-[0.1em] transition-colors ${
                                  sortBy === option.value
                                    ? 'bg-cream text-maroon'
                                    : 'text-charcoal/70 hover:bg-cream/60'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Filter — bottom sheet trigger */}
                    <button
                      type="button"
                      onClick={() => setIsFilterSheetOpen(true)}
                      className="flex items-center gap-1.5 border border-beige bg-white px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-charcoal"
                    >
                      <svg
                        stroke="currentColor"
                        fill="none"
                        strokeWidth="1.6"
                        viewBox="0 0 24 24"
                        width="13"
                        height="13"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
                        />
                      </svg>
                      Filter
                      {activeFilterCount > 0 && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-maroon text-[9px] text-white">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Desktop: inline sort select + clear-all, chips live in the row below */}
                  <div className="hidden items-center gap-3 lg:flex">
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="text-[11px] font-medium uppercase tracking-[0.18em] text-maroon transition-colors hover:text-gold"
                      >
                        Clear All
                      </button>
                    )}

                    <select
                      value={sortBy}
                      onChange={(event) =>
                        setSortBy(event.target.value as SearchSortOption)
                      }
                      className="h-10 border border-beige bg-white px-3 text-xs uppercase tracking-[0.08em] text-charcoal outline-none focus:border-gold"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          Sort: {option.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={priceFilter}
                      onChange={(event) =>
                        setPriceFilter(event.target.value as PriceFilter)
                      }
                      className="h-10 border border-beige bg-white px-3 text-xs uppercase tracking-[0.08em] text-charcoal outline-none focus:border-gold"
                    >
                      {priceFilterOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Category chips — single slim row, no card wrapper */}
                {availableCategories.length > 1 && (
                  <div className="mb-6 flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setCategoryFilter('all')}
                      className={chipClass(effectiveCategoryFilter === 'all')}
                    >
                      All Categories
                    </button>

                    {availableCategories.map((category) => (
                      <button
                        key={category.slug}
                        type="button"
                        onClick={() => setCategoryFilter(category.slug)}
                        className={chipClass(
                          effectiveCategoryFilter === category.slug
                        )}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                )}

                {filteredProducts.length === 0 ? (
                  <div className="border border-beige bg-white px-6 py-16 text-center">
                    <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">
                      No pieces found
                    </p>

                    <h3 className="mt-3 font-heading text-4xl text-charcoal">
                      Try different filters
                    </h3>

                    <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-charcoal/60">
                      No results match the current filters for “{query}”.
                      Clear filters to see all matching pieces.
                    </p>

                    <button
                      type="button"
                      onClick={resetFilters}
                      className="btn-luxury btn-luxury-primary mt-8"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
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
                              <HighlightedText text={product.name} query={query} />
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
                )}
              </>
            )}
          </div>
        </section>
      </main>

      {/* Mobile filter bottom sheet — same pattern/z-index as the shop page */}
      <AnimatePresence>
        {isFilterSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsFilterSheetOpen(false)}
              className="fixed inset-0 z-(--z-backdrop) bg-charcoal/40 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-(--z-drawer) max-h-[80vh] overflow-y-auto overscroll-y-contain rounded-t-2xl border-t border-beige bg-white p-6 shadow-2xl lg:hidden"
            >
              <div className="mb-5 flex items-center justify-between border-b border-beige pb-4">
                <h4 className="font-heading text-xl text-charcoal">Sort &amp; Filter</h4>
                <button
                  onClick={() => setIsFilterSheetOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-beige text-charcoal/50 hover:text-maroon"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6">
                <p className="mb-3 font-body text-[10px] uppercase tracking-[0.28em] text-gold">
                  Sort By
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSortBy(option.value)}
                      className={chipClass(sortBy === option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <p className="mb-3 font-body text-[10px] uppercase tracking-[0.28em] text-gold">
                  Category
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('all')}
                    className={chipClass(effectiveCategoryFilter === 'all')}
                  >
                    All Categories
                  </button>
                  {availableCategories.map((category) => (
                    <button
                      key={category.slug}
                      type="button"
                      onClick={() => setCategoryFilter(category.slug)}
                      className={chipClass(
                        effectiveCategoryFilter === category.slug
                      )}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <p className="mb-3 font-body text-[10px] uppercase tracking-[0.28em] text-gold">
                  Price
                </p>
                <div className="flex flex-wrap gap-2">
                  {priceFilterOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPriceFilter(option.value)}
                      className={chipClass(priceFilter === option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mb-3 w-full py-3 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-maroon hover:text-gold"
                >
                  Clear All
                </button>
              )}

              <button
                onClick={() => setIsFilterSheetOpen(false)}
                className="w-full bg-maroon py-4 text-xs font-medium uppercase tracking-[0.16em] text-white transition-colors hover:bg-gold"
              >
                Show {hasResults ? filteredProducts.length : ''} Result
                {filteredProducts.length === 1 ? '' : 's'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </>
  );
}