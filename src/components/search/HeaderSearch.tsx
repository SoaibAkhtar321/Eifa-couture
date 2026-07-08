'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { createClient } from '@/lib/supabase/client';
import { fetchActiveCategories } from '@/lib/data/categories';
import { fetchActiveProducts } from '@/lib/data/products';
import {
  POPULAR_SEARCHES,
  getSearchSuggestions,
  productMatchesSearch,
  rankProducts,
  type CollectionDef,
} from '@/lib/search';
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
} from '@/lib/search-history';
import { formatPrice, highlightSegments } from '@/lib/utils';
import { useUIStore } from '@/store/ui-store';

import type { Category, Product } from '@/types';

const PRODUCT_LIMIT = 5;
const DEBOUNCE_DELAY = 140;

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

type AutocompleteItem =
  | { id: string; type: 'product'; product: Product }
  | { id: string; type: 'category'; category: Category }
  | { id: string; type: 'collection'; collection: CollectionDef }
  | { id: string; type: 'fabric'; value: string }
  | { id: string; type: 'recent'; value: string }
  | { id: string; type: 'popular'; value: string }
  | { id: string; type: 'view-all'; value: string };

function getProductImage(product: Product) {
  const image = product.images?.[0];
  if (!image || image.includes('picsum.photos')) {
    return CATEGORY_FALLBACK_IMAGES[product.category] || DEFAULT_PRODUCT_IMAGE;
  }
  return image;
}

function useDebouncedValue(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
}

function getUniqueTerms(primary: string[], secondary: string[]) {
  const seen = new Set<string>();

  return [...primary, ...secondary].filter((term) => {
    const key = term.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

function SuggestionIcon({ type }: { type: AutocompleteItem['type'] }) {
  if (type === 'recent') {
    return (
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
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    );
  }

  if (type === 'category') {
    return (
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
      >
        <rect x="4" y="4" width="7" height="7" />
        <rect x="13" y="4" width="7" height="7" />
        <rect x="4" y="13" width="7" height="7" />
        <rect x="13" y="13" width="7" height="7" />
      </svg>
    );
  }

  if (type === 'collection') {
    return (
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
      >
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h16" />
      </svg>
    );
  }

  if (type === 'fabric') {
    return (
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
      >
        <path d="M6 3h12l2 6-8 12L4 9l2-6Z" />
        <path d="M4 9h16" />
      </svg>
    );
  }

  return (
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
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function HeaderSearch() {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isOpen = useUIStore((state) => state.isSearchOpen);
  const openSearch = useUIStore((state) => state.openSearch);
  const closeSearchStore = useUIStore((state) => state.closeSearch);

  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_DELAY);
  const searchText = debouncedQuery.trim();

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    Promise.all([fetchActiveProducts(supabase), fetchActiveCategories(supabase)]).then(
      ([liveProducts, liveCategories]) => {
        if (!isMounted) return;
        setProducts(liveProducts);
        setCategories(liveCategories);
      }
    );

    return () => {
      isMounted = false;
    };
  }, []);

  const suggestions = useMemo(() => {
    if (!searchText) {
      return { products: [], categories: [], collections: [], fabrics: [] };
    }

    const baseSuggestions = getSearchSuggestions(
      searchText,
      products,
      categories,
      PRODUCT_LIMIT
    );

    return {
      ...baseSuggestions,
      products: rankProducts(
        baseSuggestions.products.filter((product) =>
          productMatchesSearch(product, searchText)
        ),
        searchText
      ).slice(0, PRODUCT_LIMIT),
    };
  }, [categories, products, searchText]);

  const emptyStateTerms = useMemo(
    () => getUniqueTerms(recentSearches, POPULAR_SEARCHES),
    [recentSearches]
  );

  const activeItems = useMemo<AutocompleteItem[]>(() => {
    if (!searchText) {
      return emptyStateTerms.map((term) => ({
        id: `term-${term.toLowerCase()}`,
        type: recentSearches.some(
          (recent) => recent.toLowerCase() === term.toLowerCase()
        )
          ? 'recent'
          : 'popular',
        value: term,
      }));
    }

    return [
      ...suggestions.products.map((product) => ({
        id: `product-${product.id}`,
        type: 'product' as const,
        product,
      })),
      ...suggestions.categories.map((category) => ({
        id: `category-${category.slug}`,
        type: 'category' as const,
        category,
      })),
      ...suggestions.collections.map((collection) => ({
        id: `collection-${collection.slug}`,
        type: 'collection' as const,
        collection,
      })),
      ...suggestions.fabrics.map((fabric) => ({
        id: `fabric-${fabric.toLowerCase()}`,
        type: 'fabric' as const,
        value: fabric,
      })),
      { id: 'view-all', type: 'view-all' as const, value: searchText },
    ];
  }, [emptyStateTerms, recentSearches, searchText, suggestions]);

  const hasQueryResults =
    suggestions.products.length > 0 ||
    suggestions.categories.length > 0 ||
    suggestions.collections.length > 0 ||
    suggestions.fabrics.length > 0;

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (!searchRef.current) return;
      if (!searchRef.current.contains(event.target as Node)) {
        closeSearchStore();
      }
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSearchStore();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closeSearchStore]);

  useBodyScrollLock(isOpen);

  const closeSearch = () => {
    closeSearchStore();
    setQuery('');
    setHighlightedIndex(-1);
  };

  const saveRecentTerm = (term: string) => {
    setRecentSearches(addRecentSearch(term));
  };

  const runSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;

    saveRecentTerm(trimmed);
    closeSearch();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const goToProduct = (product: Product) => {
    saveRecentTerm(query.trim() || product.name);
    closeSearch();
    router.push(`/product/${product.slug}`);
  };

  const goToCategory = (category: Category) => {
    saveRecentTerm(category.name);
    closeSearch();
    router.push(`/shop?category=${category.slug}`);
  };

  const goToCollection = (collection: CollectionDef) => {
    saveRecentTerm(collection.name);
    closeSearch();
    router.push(`/shop?collection=${collection.slug}`);
  };

  const selectItem = (item: AutocompleteItem) => {
    if (item.type === 'product') {
      goToProduct(item.product);
      return;
    }
    if (item.type === 'category') {
      goToCategory(item.category);
      return;
    }
    if (item.type === 'collection') {
      goToCollection(item.collection);
      return;
    }

    runSearch(item.value);
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const handleRemoveRecent = (
    term: string,
    event: ReactKeyboardEvent<HTMLElement> | ReactMouseEvent<HTMLElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setRecentSearches(removeRecentSearch(term));
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeSearch();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((current) =>
        current < activeItems.length - 1 ? current + 1 : 0
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((current) =>
        current > 0 ? current - 1 : activeItems.length - 1
      );
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();

      if (highlightedIndex >= 0 && activeItems[highlightedIndex]) {
        selectItem(activeItems[highlightedIndex]);
        return;
      }

      runSearch(query);
    }
  };

  const renderSimpleItem = (item: AutocompleteItem, index: number) => {
    if (item.type === 'product') return null;

    const label =
      item.type === 'category'
        ? item.category.name
        : item.type === 'collection'
          ? item.collection.name
          : item.value;

    const meta =
      item.type === 'category'
        ? 'Category'
        : item.type === 'collection'
          ? 'Collection'
          : item.type === 'fabric'
            ? 'Fabric'
            : item.type === 'recent'
              ? 'Recent Search'
              : item.type === 'popular'
                ? 'Popular Search'
                : 'Search';

    return (
      <button
        key={item.id}
        id={`header-search-result-${index}`}
        type="button"
        role="option"
        aria-selected={highlightedIndex === index}
        onClick={() => selectItem(item)}
        onMouseEnter={() => setHighlightedIndex(index)}
        className={`group flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
          highlightedIndex === index ? 'bg-cream/70' : 'hover:bg-cream/60'
        }`}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="shrink-0 text-charcoal/35">
            <SuggestionIcon type={item.type} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm text-charcoal">
              <HighlightedText text={label} query={searchText || query} />
            </span>
            <span className="mt-0.5 block text-[10px] uppercase tracking-[0.18em] text-charcoal/35">
              {meta}
            </span>
          </span>
        </span>

        {item.type === 'recent' && (
          <span
            role="button"
            tabIndex={0}
            onClick={(event) => handleRemoveRecent(item.value, event)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                handleRemoveRecent(item.value, event);
              }
            }}
            className="shrink-0 text-lg leading-none text-charcoal/25 opacity-100 transition-colors hover:text-maroon sm:opacity-0 sm:group-hover:opacity-100"
            aria-label={`Remove ${item.value} from recent searches`}
          >
            x
          </span>
        )}
      </button>
    );
  };

  const renderProductItem = (item: AutocompleteItem, index: number) => {
    if (item.type !== 'product') return null;

    return (
      <button
        key={item.id}
        id={`header-search-result-${index}`}
        type="button"
        role="option"
        aria-selected={highlightedIndex === index}
        onClick={() => selectItem(item)}
        onMouseEnter={() => setHighlightedIndex(index)}
        className={`flex w-full gap-4 p-4 text-left transition-colors cursor-pointer ${
          highlightedIndex === index ? 'bg-cream/70' : 'hover:bg-cream/60'
        }`}
      >
        <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-cream">
          <Image
            src={getProductImage(item.product)}
            alt={item.product.name}
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold">
            {item.product.fabric}
          </p>
          <h3 className="mt-1 line-clamp-1 font-heading text-xl text-charcoal">
            <HighlightedText text={item.product.name} query={searchText} />
          </h3>
          <p className="mt-1 line-clamp-1 text-xs text-charcoal/50">
            {item.product.shortDescription}
          </p>
          <p className="mt-2 text-sm font-medium text-maroon">
            {formatPrice(item.product.price)}
          </p>
        </div>
      </button>
    );
  };

  return (
    <div ref={searchRef} className="relative z-(--z-dropdown)">
      <button
        type="button"
        onClick={() => {
          if (isOpen) {
            closeSearch();
          } else {
            setRecentSearches(getRecentSearches());
            openSearch();
            window.requestAnimationFrame(() => inputRef.current?.focus());
          }
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed inset-0 z-(--z-fullscreen) flex flex-col bg-ivory sm:inset-x-auto sm:inset-y-auto sm:left-auto sm:right-6 sm:top-[98px] sm:z-(--z-dropdown) sm:h-auto sm:w-[460px] sm:border sm:border-beige sm:bg-white sm:shadow-[0_18px_55px_rgba(0,0,0,0.16)] lg:right-10 lg:top-[104px]"
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
                  aria-expanded={activeItems.length > 0}
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
                    onClick={() => {
                      setQuery('');
                      setHighlightedIndex(-1);
                    }}
                    className="text-xl leading-none text-charcoal/35 hover:text-maroon cursor-pointer"
                    aria-label="Clear search"
                  >
                    x
                  </button>
                )}
              </div>

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
            className="flex-1 overflow-y-auto overscroll-y-contain sm:max-h-[520px] sm:flex-none"
          >
            {!searchText ? (
              <div className="p-5">
                {recentSearches.length > 0 && (
                  <div className="mb-5 flex items-center justify-between">
                    <p className="font-body text-[10px] uppercase tracking-[0.26em] text-gold">
                      Recent & Popular
                    </p>
                    <button
                      type="button"
                      onClick={handleClearRecent}
                      className="font-body text-[10px] uppercase tracking-[0.16em] text-charcoal/40 hover:text-maroon"
                    >
                      Clear Recent
                    </button>
                  </div>
                )}

                <div className="divide-y divide-beige">
                  {activeItems.map((item, index) =>
                    item.type === 'product'
                      ? renderProductItem(item, index)
                      : renderSimpleItem(item, index)
                  )}
                </div>
              </div>
            ) : hasQueryResults ? (
              <div className="divide-y divide-beige">
                {suggestions.products.length > 0 && (
                  <div>
                    <p className="px-4 pt-4 font-body text-[10px] uppercase tracking-[0.26em] text-gold">
                      Products
                    </p>
                    {activeItems.map((item, index) =>
                      item.type === 'product' ? renderProductItem(item, index) : null
                    )}
                  </div>
                )}

                {suggestions.categories.length > 0 && (
                  <div>
                    <p className="px-4 pt-4 font-body text-[10px] uppercase tracking-[0.26em] text-gold">
                      Categories
                    </p>
                    {activeItems.map((item, index) =>
                      item.type === 'category'
                        ? renderSimpleItem(item, index)
                        : null
                    )}
                  </div>
                )}

                {suggestions.collections.length > 0 && (
                  <div>
                    <p className="px-4 pt-4 font-body text-[10px] uppercase tracking-[0.26em] text-gold">
                      Collections
                    </p>
                    {activeItems.map((item, index) =>
                      item.type === 'collection'
                        ? renderSimpleItem(item, index)
                        : null
                    )}
                  </div>
                )}

                {suggestions.fabrics.length > 0 && (
                  <div>
                    <p className="px-4 pt-4 font-body text-[10px] uppercase tracking-[0.26em] text-gold">
                      Fabrics
                    </p>
                    {activeItems.map((item, index) =>
                      item.type === 'fabric' ? renderSimpleItem(item, index) : null
                    )}
                  </div>
                )}

                <div className="p-4">
                  {activeItems.map((item, index) =>
                    item.type === 'view-all' ? renderSimpleItem(item, index) : null
                  )}
                </div>
              </div>
            ) : (
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
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}