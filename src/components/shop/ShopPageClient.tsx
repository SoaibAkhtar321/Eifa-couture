'use client';

import { useLayoutEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import ShopProductCard from '@/components/shop/ShopProductCard';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import {
  PRICE_FILTER_OPTIONS,
  SORT_OPTIONS,
  productMatchesPrice,
  productMatchesSearch,
  sortProducts,
  type PriceFilter,
} from '@/lib/search';
import type { Category, Product, SortOption } from '@/types';

const PRODUCTS_PER_PAGE = 8;

type CollectionFilter = 'all' | 'new-arrivals' | 'best-sellers';

type AvailabilityFilter = 'all' | 'in-stock';

type VisibleCountState = {
  filterKey: string;
  count: number;
};

type FilterInputsProps = {
  searchQuery: string;
  sortBy: SortOption;
  selectedSize: string;
  selectedFabric: string;
  selectedPrice: PriceFilter;
  availability: AvailabilityFilter;
  availableSizes: string[];
  availableFabrics: string[];
  onSearchQueryChange: (value: string) => void;
  onSortByChange: (value: SortOption) => void;
  onSelectedSizeChange: (value: string) => void;
  onSelectedFabricChange: (value: string) => void;
  onSelectedPriceChange: (value: PriceFilter) => void;
  onAvailabilityChange: (value: AvailabilityFilter) => void;
};

// The shop page browses a catalogue rather than search results, so it
// excludes 'relevance' from the shared sort list — everything else
// (labels included) comes straight from lib/search.ts.
const sortOptions = SORT_OPTIONS.filter(
  (option): option is { label: string; value: SortOption } =>
    option.value !== 'relevance'
);

const priceFilterOptions = PRICE_FILTER_OPTIONS;

function getCollectionFromUrl(value: string | null): CollectionFilter {
  if (value === 'new-arrivals' || value === 'best-sellers') {
    return value;
  }
  return 'all';
}

function getCategoryBySlug(categories: Category[], slug: string) {
  return categories.find((category) => category.slug === slug);
}

function isProductInStock(product: Product) {
  return Object.values(product.stock).some((quantity) => quantity > 0);
}

function getPageTitle(
  categories: Category[],
  categorySlug: string,
  collection: CollectionFilter
) {
  if (collection === 'new-arrivals') return 'New Arrivals';
  if (collection === 'best-sellers') return 'Best Sellers';

  if (categorySlug !== 'all') {
    const activeCategory = getCategoryBySlug(categories, categorySlug);
    return activeCategory?.name ?? 'The Collection';
  }
  return 'The Collection';
}

function getPageDescription(
  categories: Category[],
  categorySlug: string,
  collection: CollectionFilter
) {
  if (collection === 'new-arrivals') {
    return 'Explore the newest handcrafted Chikankari pieces from Eifa Couture.';
  }
  if (collection === 'best-sellers') {
    return 'Discover the most loved handcrafted pieces chosen by our customers.';
  }
  if (categorySlug !== 'all') {
    const activeCategory = getCategoryBySlug(categories, categorySlug);
    return (
      activeCategory?.description ??
      'Discover handcrafted pieces shaped by Lucknowi heritage and quiet luxury.'
    );
  }
  return 'Discover handcrafted pieces shaped by Lucknowi heritage, quiet luxury, and the patience of master karigars.';
}

function chipClass(isActive: boolean) {
  return `shrink-0 border px-4 py-3 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors duration-300 ${
    isActive
      ? 'border-maroon bg-maroon text-white'
      : 'border-charcoal/15 bg-white text-charcoal hover:border-gold hover:text-maroon'
  }`;
}

function FilterInputs({
  searchQuery,
  sortBy,
  selectedSize,
  selectedFabric,
  selectedPrice,
  availability,
  availableSizes,
  availableFabrics,
  onSearchQueryChange,
  onSortByChange,
  onSelectedSizeChange,
  onSelectedFabricChange,
  onSelectedPriceChange,
  onAvailabilityChange,
}: FilterInputsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <input
        type="search"
        value={searchQuery}
        onChange={(event) => onSearchQueryChange(event.target.value)}
        placeholder="Search products..."
        className="h-12 border border-charcoal/15 bg-ivory px-4 text-sm text-charcoal outline-none transition-colors placeholder:text-charcoal/35 focus:border-gold sm:col-span-2 lg:col-span-1 xl:col-span-2"
      />

      <select
        value={sortBy}
        onChange={(event) => onSortByChange(event.target.value as SortOption)}
        className="h-12 border border-charcoal/15 bg-ivory px-4 text-sm text-charcoal outline-none focus:border-gold"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            Sort: {option.label}
          </option>
        ))}
      </select>

      <select
        value={selectedSize}
        onChange={(event) => onSelectedSizeChange(event.target.value)}
        className="h-12 border border-charcoal/15 bg-ivory px-4 text-sm text-charcoal outline-none focus:border-gold"
      >
        <option value="all">All Sizes</option>
        {availableSizes.map((size) => (
          <option key={size} value={size}>
            Size {size}
          </option>
        ))}
      </select>

      <select
        value={selectedFabric}
        onChange={(event) => onSelectedFabricChange(event.target.value)}
        className="h-12 border border-charcoal/15 bg-ivory px-4 text-sm text-charcoal outline-none focus:border-gold"
      >
        <option value="all">All Fabrics</option>
        {availableFabrics.map((fabric) => (
          <option key={fabric} value={fabric}>
            {fabric}
          </option>
        ))}
      </select>

      <select
        value={selectedPrice}
        onChange={(event) =>
          onSelectedPriceChange(event.target.value as PriceFilter)
        }
        className="h-12 border border-charcoal/15 bg-ivory px-4 text-sm text-charcoal outline-none focus:border-gold"
      >
        {priceFilterOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        value={availability}
        onChange={(event) =>
          onAvailabilityChange(event.target.value as AvailabilityFilter)
        }
        className="h-12 border border-charcoal/15 bg-ivory px-4 text-sm text-charcoal outline-none focus:border-gold"
      >
        <option value="all">All Availability</option>
        <option value="in-stock">In Stock Only</option>
      </select>
    </div>
  );
}

type ShopPageClientProps = {
  categories: Category[];
  products: Product[];
};

export default function ShopPageClient({ categories, products }: ShopPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawCategoryFromUrl = searchParams.get('category') ?? 'all';
  const collectionFromUrl = getCollectionFromUrl(searchParams.get('collection'));

  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSize, setSelectedSize] = useState('all');
  const [selectedFabric, setSelectedFabric] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState<PriceFilter>('all');
  const [availability, setAvailability] = useState<AvailabilityFilter>('all');
  
  // Mobile controls for bottom-sheet overlay
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  useBodyScrollLock(isMobileFiltersOpen);

  const activeCategories = useMemo(
    () =>
      categories
        .filter((category) => category.isActive)
        .slice()
        .sort((a, b) => a.order - b.order),
    [categories]
  );

  const activeCategorySlugs = useMemo(
    () => new Set(activeCategories.map((category) => category.slug)),
    [activeCategories]
  );

  const categoryFromUrl = useMemo(() => {
    if (rawCategoryFromUrl === 'all') return 'all';
    return activeCategorySlugs.has(rawCategoryFromUrl)
      ? rawCategoryFromUrl
      : 'all';
  }, [activeCategorySlugs, rawCategoryFromUrl]);

  const effectiveCategory =
    collectionFromUrl === 'all' ? categoryFromUrl : 'all';

  const activeProducts = useMemo(
    () => products.filter((product) => product.isActive),
    [products]
  );

  const availableSizes = useMemo(() => {
    return Array.from(
      new Set(activeProducts.flatMap((product) => product.sizes))
    ).sort();
  }, [activeProducts]);

  const availableFabrics = useMemo(() => {
    return Array.from(
      new Set(activeProducts.map((product) => product.fabric).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [activeProducts]);

  const pageTitle = getPageTitle(activeCategories, effectiveCategory, collectionFromUrl);
  const pageDescription = getPageDescription(
    activeCategories,
    effectiveCategory,
    collectionFromUrl
  );

  const filteredProducts = useMemo(() => {
    const filtered = activeProducts.filter((product) => {
      const matchesCategory =
        effectiveCategory === 'all' || product.category === effectiveCategory;

      const matchesCollection =
        collectionFromUrl === 'all' ||
        (collectionFromUrl === 'new-arrivals' && product.isNewArrival) ||
        (collectionFromUrl === 'best-sellers' && product.isBestSeller);

      const matchesSearch = productMatchesSearch(product, searchQuery);
      const matchesSize =
        selectedSize === 'all' || product.sizes.includes(selectedSize);
      const matchesFabric =
        selectedFabric === 'all' || product.fabric === selectedFabric;
      const matchesPrice = productMatchesPrice(product, selectedPrice);
      const matchesAvailability =
        availability === 'all' || isProductInStock(product);

      return (
        matchesCategory &&
        matchesCollection &&
        matchesSearch &&
        matchesSize &&
        matchesFabric &&
        matchesPrice &&
        matchesAvailability
      );
    });

    return sortProducts(filtered, sortBy);
  }, [
    activeProducts,
    availability,
    collectionFromUrl,
    effectiveCategory,
    searchQuery,
    selectedFabric,
    selectedPrice,
    selectedSize,
    sortBy,
  ]);

  const filterKey = [
    collectionFromUrl,
    effectiveCategory,
    searchQuery,
    selectedSize,
    selectedFabric,
    selectedPrice,
    availability,
    sortBy,
  ].join('|');
  const [visibleCountState, setVisibleCountState] =
    useState<VisibleCountState>({
      filterKey,
      count: PRODUCTS_PER_PAGE,
    });
  const visibleCount =
    visibleCountState.filterKey === filterKey
      ? visibleCountState.count
      : PRODUCTS_PER_PAGE;
  const visibleProducts = filteredProducts.slice(0, visibleCount);
  
  useLayoutEffect(() => {
    const shouldRestore = sessionStorage.getItem('eifa-restore-shop-scroll');
    const savedScrollY = sessionStorage.getItem('eifa-shop-scroll-y');

    if (shouldRestore !== 'true' || !savedScrollY) return;

    const scrollY = Number(savedScrollY);
    if (Number.isNaN(scrollY)) return;

    const html = document.documentElement;
    const previousScrollBehavior = html.style.scrollBehavior;

    html.style.scrollBehavior = 'auto';

    const restoreScroll = () => {
      window.scrollTo({
        top: scrollY,
        left: 0,
        behavior: 'auto',
      });
    };

    restoreScroll();

    const frame = window.requestAnimationFrame(restoreScroll);

    const timeout = window.setTimeout(() => {
      restoreScroll();
      sessionStorage.removeItem('eifa-restore-shop-scroll');
      sessionStorage.removeItem('eifa-shop-scroll-y');
      html.style.scrollBehavior = previousScrollBehavior;
    }, 120);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      html.style.scrollBehavior = previousScrollBehavior;
    };
  }, []);

  const canLoadMore = visibleCount < filteredProducts.length;
  const isAllActive = effectiveCategory === 'all' && collectionFromUrl === 'all';

  const hasActiveFilters =
    !isAllActive ||
    searchQuery.trim().length > 0 ||
    sortBy !== 'newest' ||
    selectedSize !== 'all' ||
    selectedFabric !== 'all' ||
    selectedPrice !== 'all' ||
    availability !== 'all';

  const updateShopUrl = (params: {
    category?: string;
    collection?: CollectionFilter;
  }) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (params.category !== undefined) {
      if (params.category === 'all') {
        nextParams.delete('category');
      } else {
        nextParams.set('category', params.category);
      }
      nextParams.delete('collection');
    }

    if (params.collection !== undefined) {
      if (params.collection === 'all') {
        nextParams.delete('collection');
      } else {
        nextParams.set('collection', params.collection);
      }
      nextParams.delete('category');
    }

    const queryString = nextParams.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  };

  const handleCategoryChange = (categorySlug: string) => {
    updateShopUrl({ category: categorySlug });
  };

  const handleCollectionChange = (collection: CollectionFilter) => {
    updateShopUrl({ collection });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSortBy('newest');
    setSelectedSize('all');
    setSelectedFabric('all');
    setSelectedPrice('all');
    setAvailability('all');
    router.push(pathname, { scroll: false });
  };

  return (
    <main className="bg-ivory relative z-10">
      <section className="border-b border-beige bg-gradient-to-b from-cream/70 to-ivory">
        <div className="luxury-container py-12 sm:py-16 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="max-w-3xl"
          >
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.34em] text-gold">
              Curated Catalogue
            </p>
            <h1 className="font-heading text-4xl font-medium leading-tight text-charcoal sm:text-5xl lg:text-6xl">
              {pageTitle}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-charcoal/60 sm:text-base sm:leading-8">
              {pageDescription}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="luxury-container py-8 sm:py-10 lg:py-14">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">
              Products
            </p>
            <h2 className="mt-2 font-heading text-3xl text-charcoal sm:text-4xl">
              {filteredProducts.length}{' '}
              {filteredProducts.length === 1 ? 'piece' : 'handcrafted pieces'}
            </h2>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="w-fit text-xs font-medium uppercase tracking-[0.22em] text-maroon transition-colors hover:text-gold"
            >
              Clear All Filters
            </button>
          )}
        </div>

        {/* Filters & Sorting container */}
        <div className="mb-8 border border-beige bg-white p-4 shadow-sm sm:p-5 lg:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="font-body text-[10px] uppercase tracking-[0.28em] text-gold">
                Filters & Sorting
              </p>
              <h3 className="mt-1 font-heading text-3xl text-charcoal">
                Refine Products
              </h3>
            </div>
            {/* Mobile Bottom-Sheet Trigger Button */}
            <button
              onClick={() => setIsMobileFiltersOpen(true)}
              className="lg:hidden border border-beige bg-cream px-4 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-charcoal flex items-center gap-2"
            >
              <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" width="14" height="14" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              Refine/Sort
            </button>
          </div>

          <div className="mb-5 flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => handleCategoryChange('all')}
              className={chipClass(isAllActive)}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => handleCollectionChange('new-arrivals')}
              className={chipClass(collectionFromUrl === 'new-arrivals')}
            >
              New Arrivals
            </button>
            <button
              type="button"
              onClick={() => handleCollectionChange('best-sellers')}
              className={chipClass(collectionFromUrl === 'best-sellers')}
            >
              Best Sellers
            </button>

            {activeCategories.map((category) => {
              const isCategoryActive =
                effectiveCategory === category.slug &&
                collectionFromUrl === 'all';

              return (
                <button
                  key={category.slug}
                  type="button"
                  onClick={() => handleCategoryChange(category.slug)}
                  className={chipClass(isCategoryActive)}
                >
                  {category.name}
                </button>
              );
            })}
          </div>

          {/* Desktop Select Filters Panel */}
          <div className="hidden lg:block">
            <FilterInputs
              searchQuery={searchQuery}
              sortBy={sortBy}
              selectedSize={selectedSize}
              selectedFabric={selectedFabric}
              selectedPrice={selectedPrice}
              availability={availability}
              availableSizes={availableSizes}
              availableFabrics={availableFabrics}
              onSearchQueryChange={setSearchQuery}
              onSortByChange={setSortBy}
              onSelectedSizeChange={setSelectedSize}
              onSelectedFabricChange={setSelectedFabric}
              onSelectedPriceChange={setSelectedPrice}
              onAvailabilityChange={setAvailability}
            />
          </div>
        </div>

        {/* Products Display Grid */}
        {visibleProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:gap-x-6 xl:grid-cols-4">
              {visibleProducts.map((product, index) => (
                <ShopProductCard
                  key={product.id}
                  product={product}
                  index={index}
                />
              ))}
            </div>

            {canLoadMore && (
              <div className="mt-12 flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCountState((current) => ({
                      filterKey,
                      count:
                        current.filterKey === filterKey
                          ? current.count + PRODUCTS_PER_PAGE
                          : PRODUCTS_PER_PAGE * 2,
                    }))
                  }
                  className="btn-luxury btn-luxury-secondary"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="border border-beige bg-white px-6 py-16 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">
              No pieces found
            </p>
            <h3 className="mt-3 font-heading text-4xl text-charcoal">
              Try a different search
            </h3>
            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-charcoal/60">
              We could not find a piece matching your current filters. Explore
              all collections or search by fabric, category, or embroidery style.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="btn-luxury btn-luxury-primary mt-8"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* Responsive Filter Bottom-sheet Drawer for Mobile devices */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileFiltersOpen(false)}
              className="fixed inset-0 bg-charcoal/40 z-(--z-backdrop) backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-(--z-drawer) rounded-t-2xl border-t border-beige bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto overscroll-y-contain"
            >
              <div className="flex items-center justify-between mb-5 border-b border-beige pb-4">
                <h4 className="font-heading text-xl text-charcoal">Refine & Sort</h4>
                <button 
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-charcoal/50 hover:text-maroon rounded-full border border-beige"
                >
                  ✕
                </button>
              </div>
              <div className="mb-6">
                <FilterInputs
                  searchQuery={searchQuery}
                  sortBy={sortBy}
                  selectedSize={selectedSize}
                  selectedFabric={selectedFabric}
                  selectedPrice={selectedPrice}
                  availability={availability}
                  availableSizes={availableSizes}
                  availableFabrics={availableFabrics}
                  onSearchQueryChange={setSearchQuery}
                  onSortByChange={setSortBy}
                  onSelectedSizeChange={setSelectedSize}
                  onSelectedFabricChange={setSelectedFabric}
                  onSelectedPriceChange={setSelectedPrice}
                  onAvailabilityChange={setAvailability}
                />
              </div>
              <button 
                onClick={() => setIsMobileFiltersOpen(false)}
                className="w-full py-4 bg-maroon text-white font-medium tracking-[0.16em] uppercase text-xs hover:bg-gold transition-colors"
              >
                Apply Filters
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
