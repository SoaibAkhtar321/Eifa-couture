'use client';

import { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/ui/CartDrawer';

import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '@/lib/mock-data';
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

type SearchSortOption =
  | 'relevance'
  | 'price-low-high'
  | 'price-high-low'
  | 'newest';

type PriceFilter = 'all' | 'under-2000' | '2000-4000' | '4000-7000' | '7000-plus';

const sortOptions: { label: string; value: SearchSortOption }[] = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-low-high' },
  { label: 'Price: High to Low', value: 'price-high-low' },
];

const priceFilterOptions: { label: string; value: PriceFilter }[] = [
  { label: 'All Prices', value: 'all' },
  { label: 'Under ₹2,000', value: 'under-2000' },
  { label: '₹2,000 - ₹4,000', value: '2000-4000' },
  { label: '₹4,000 - ₹7,000', value: '4000-7000' },
  { label: 'Above ₹7,000', value: '7000-plus' },
];

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

/**
 * Relevance score — matches in the product name/tags rank higher than
 * matches that only occur in the longer description or fabric text.
 */
function getRelevanceScore(product: Product, searchText: string): number {
  let score = 0;

  if (product.name.toLowerCase().includes(searchText)) score += 5;
  if (product.tags?.some((tag) => tag.toLowerCase().includes(searchText)))
    score += 4;
  if (product.shortDescription.toLowerCase().includes(searchText)) score += 3;
  if (product.category.toLowerCase().includes(searchText)) score += 2;
  if (product.fabric.toLowerCase().includes(searchText)) score += 2;
  if (product.description.toLowerCase().includes(searchText)) score += 1;
  if (product.isBestSeller) score += 1;

  return score;
}

function productMatchesSearch(product: Product, searchText: string) {
  const searchableText = [
    product.name,
    product.shortDescription,
    product.description,
    product.category,
    product.fabric,
    ...(product.tags ?? []),
  ]
    .join(' ')
    .toLowerCase();

  return product.isActive && searchableText.includes(searchText);
}

function productMatchesPrice(product: Product, priceFilter: PriceFilter) {
  switch (priceFilter) {
    case 'under-2000':
      return product.price < 2000;
    case '2000-4000':
      return product.price >= 2000 && product.price <= 4000;
    case '4000-7000':
      return product.price > 4000 && product.price <= 7000;
    case '7000-plus':
      return product.price > 7000;
    case 'all':
    default:
      return true;
  }
}

function sortProducts(
  products: Product[],
  sortBy: SearchSortOption,
  searchText: string
) {
  const sorted = [...products];

  switch (sortBy) {
    case 'price-low-high':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-high-low':
      return sorted.sort((a, b) => b.price - a.price);
    case 'newest':
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case 'relevance':
    default:
      return sorted.sort(
        (a, b) =>
          getRelevanceScore(b, searchText) - getRelevanceScore(a, searchText)
      );
  }
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

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const handleRecentSearchClick = (term: string) => {
    setQuery(term);
    setRecentSearches(addRecentSearch(term));
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

  const resetFilters = () => {
    setSortBy('relevance');
    setCategoryFilter('all');
    setPriceFilter('all');
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
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && query.trim()) {
                      setRecentSearches(addRecentSearch(query));
                    }
                  }}
                  onBlur={() => {
                    if (query.trim()) {
                      setRecentSearches(addRecentSearch(query));
                    }
                  }}
                  placeholder="Search kurtas, sarees, dupattas, bags..."
                  className="w-full border border-beige bg-white px-5 py-4 text-base text-charcoal outline-none transition-colors focus:border-gold"
                  autoFocus
                />
              </label>
            </div>

            <div className="mt-10">
              {!query.trim() ? (
                <div className="mx-auto max-w-xl">
                  {recentSearches.length > 0 && (
                    <div className="mb-8 border border-beige bg-white px-6 py-7">
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

                  <div className="border border-beige bg-white px-6 py-12 text-center">
                    <h2 className="font-heading text-3xl text-charcoal">
                      Start Searching
                    </h2>

                    <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-charcoal/55">
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

                  {/* Filters & Sorting bar */}
                  <div className="mb-8 border border-beige bg-white p-4 shadow-sm sm:p-5 lg:p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="font-body text-[10px] uppercase tracking-[0.28em] text-gold">
                        Filter &amp; Sort
                      </p>

                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="text-[11px] font-medium uppercase tracking-[0.2em] text-maroon transition-colors hover:text-gold"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {availableCategories.length > 1 && (
                      <div className="mb-4 flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
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

                    <div className="grid gap-4 sm:grid-cols-2">
                      <select
                        value={sortBy}
                        onChange={(event) =>
                          setSortBy(event.target.value as SearchSortOption)
                        }
                        className="h-12 border border-charcoal/15 bg-ivory px-4 text-sm text-charcoal outline-none focus:border-gold"
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
                        className="h-12 border border-charcoal/15 bg-ivory px-4 text-sm text-charcoal outline-none focus:border-gold"
                      >
                        {priceFilterOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

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
          </div>
        </section>
      </main>

      <Footer />
      <CartDrawer />
    </>
  );
}
