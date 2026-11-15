'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useLayoutEffect, useState, useTransition } from 'react';

import ProductCard from '@/components/product/ProductCard';
import ShopFilterPanel from '@/components/shop/ShopFilterPanel';
import { ShopGridSkeleton } from '@/components/shop/ShopGridSkeleton';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { AUDIENCE_LABELS } from '@/lib/catalog';
import type { ShopFacets } from '@/lib/data/shop';
import { PRICE_FILTER_OPTIONS } from '@/lib/search';
import {
  DEFAULT_SHOP_FILTERS,
  SHOP_COLLECTIONS,
  SHOP_PAGE_SIZE,
  SHOP_SORT_OPTIONS,
  hasActiveShopFilters,
  shopFiltersToQuery,
  type ShopFilters,
  type ShopSort,
} from '@/lib/shop-filters';
import type { Category, Product } from '@/types';

interface Props {
  categories: Category[];
  products: Product[];
  total: number;
  filters: ShopFilters;
  facets: ShopFacets;
}

const STICKY_TOP = 'top-[65px] sm:top-[79px] lg:top-[101px]';

function getTitle(filters: ShopFilters, categories: Category[]): string {
  const category = categories.find((c) => c.slug === filters.category);
  if (category) return category.name;
  const collection = SHOP_COLLECTIONS.find((c) => c.value === filters.collection);
  if (collection) return collection.label;
  if (filters.audience) return AUDIENCE_LABELS[filters.audience];
  return 'The Collection';
}

function SortSelect({ value, onChange, className = '' }: { value: ShopSort; onChange: (v: ShopSort) => void; className?: string }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as ShopSort)}
      aria-label="Sort products"
      className={`input-luxury min-h-11 ${className}`}
    >
      {SHOP_SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          Sort: {option.label}
        </option>
      ))}
    </select>
  );
}

export default function ShopPageClient({ categories, products, total, filters, facets }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<ShopFilters>(filters);
  useBodyScrollLock(sheetOpen);

  // Search box: submitted with Enter / the button, never on every key.
  const [qDraft, setQDraft] = useState(filters.q);
  const [seenQ, setSeenQ] = useState(filters.q);
  if (seenQ !== filters.q) {
    setSeenQ(filters.q);
    setQDraft(filters.q);
  }

  const navigate = (next: ShopFilters) => {
    const query = shopFiltersToQuery(next);
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  const openSheet = () => {
    setDraft(filters);
    setSheetOpen(true);
  };
  const applySheet = () => {
    setSheetOpen(false);
    navigate({ ...draft, sort: filters.sort, q: filters.q, limit: SHOP_PAGE_SIZE });
  };
  const resetAll = () => {
    setSheetOpen(false);
    setQDraft('');
    navigate({ ...DEFAULT_SHOP_FILTERS, sort: filters.sort });
  };

  // Restores scroll position after returning from a product page.
  useLayoutEffect(() => {
    const shouldRestore = sessionStorage.getItem('eifa-restore-shop-scroll');
    const savedScrollY = sessionStorage.getItem('eifa-shop-scroll-y');
    if (shouldRestore !== 'true' || !savedScrollY) return;
    const scrollY = Number(savedScrollY);
    if (Number.isNaN(scrollY)) return;

    const html = document.documentElement;
    const previous = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    const restore = () => window.scrollTo({ top: scrollY, left: 0, behavior: 'auto' });
    restore();
    const frame = window.requestAnimationFrame(restore);
    const timeout = window.setTimeout(() => {
      restore();
      sessionStorage.removeItem('eifa-restore-shop-scroll');
      sessionStorage.removeItem('eifa-shop-scroll-y');
      html.style.scrollBehavior = previous;
    }, 120);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      html.style.scrollBehavior = previous;
    };
  }, []);

  const hasFilters = hasActiveShopFilters(filters);
  const canLoadMore = products.length < total && filters.limit < 96;

  // Removable chips for every active filter.
  const chips: { key: string; label: string; next: ShopFilters }[] = [];
  const base = { ...filters, limit: SHOP_PAGE_SIZE };
  if (filters.audience) chips.push({ key: 'aud', label: AUDIENCE_LABELS[filters.audience], next: { ...base, audience: null, category: null } });
  const activeCategory = categories.find((c) => c.slug === filters.category);
  if (activeCategory) chips.push({ key: 'cat', label: activeCategory.name, next: { ...base, category: null } });
  const activeCollection = SHOP_COLLECTIONS.find((c) => c.value === filters.collection);
  if (activeCollection) chips.push({ key: 'col', label: activeCollection.label, next: { ...base, collection: null } });
  if (filters.price !== 'all') {
    const label = PRICE_FILTER_OPTIONS.find((o) => o.value === filters.price)?.label ?? filters.price;
    chips.push({ key: 'price', label, next: { ...base, price: 'all' } });
  }
  filters.sizes.forEach((s) => chips.push({ key: `s-${s}`, label: `Size ${s}`, next: { ...base, sizes: filters.sizes.filter((x) => x !== s) } }));
  filters.colors.forEach((c) => chips.push({ key: `c-${c}`, label: c, next: { ...base, colors: filters.colors.filter((x) => x !== c) } }));
  filters.fabrics.forEach((f) => chips.push({ key: `f-${f}`, label: f, next: { ...base, fabrics: filters.fabrics.filter((x) => x !== f) } }));
  if (filters.inStock) chips.push({ key: 'stock', label: 'In stock', next: { ...base, inStock: false } });
  if (filters.q) chips.push({ key: 'q', label: `“${filters.q}”`, next: { ...base, q: '' } });

  const activeCount = chips.length;

  return (
    <main className="relative z-10 bg-ivory">
      <section className="border-b border-beige bg-gradient-to-b from-cream/70 to-ivory">
        <div className="luxury-container py-10 sm:py-14 lg:py-16">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.34em] text-gold-deep">Curated Catalogue</p>
          <h1 className="font-heading text-4xl font-medium leading-tight text-ink sm:text-5xl lg:text-6xl">
            {getTitle(filters, categories)}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-soft sm:text-base">
            Discover handcrafted pieces shaped by Lucknowi heritage, quiet luxury, and the patience of master karigars.
          </p>
        </div>
      </section>

      {/* Sticky Sort / Filter bar (mobile + tablet) */}
      <div className={`sticky ${STICKY_TOP} z-20 border-b border-beige bg-ivory/95 backdrop-blur lg:hidden`}>
        <div className="luxury-container flex items-center gap-3 py-2">
          <button
            type="button"
            onClick={openSheet}
            className="tap-feedback flex min-h-11 flex-1 items-center justify-center gap-2 border border-ink-soft/40 bg-white px-4 text-xs font-semibold uppercase tracking-[0.18em] text-ink"
          >
            Filter{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
          <SortSelect value={filters.sort} onChange={(sort) => navigate({ ...filters, sort, limit: SHOP_PAGE_SIZE })} className="flex-1" />
        </div>
      </div>

      <section className="luxury-container py-8 lg:py-12">
        <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10">
          {/* Desktop sticky sidebar */}
          <aside className={`hidden lg:block`} aria-label="Filters">
            <div className={`sticky ${STICKY_TOP} max-h-[calc(100vh-7rem)] overflow-y-auto pr-3`}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-2xl text-ink">Filters</h2>
                {hasFilters && (
                  <button type="button" onClick={resetAll} className="min-h-11 text-xs font-semibold uppercase tracking-[0.18em] text-maroon underline-offset-4 hover:underline">
                    Reset all
                  </button>
                )}
              </div>
              <ShopFilterPanel value={filters} onChange={navigate} categories={categories} facets={facets} />
            </div>
          </aside>

          <div>
            {/* Toolbar: search, count, sort */}
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <form
                role="search"
                onSubmit={(event) => {
                  event.preventDefault();
                  navigate({ ...filters, q: qDraft.trim(), limit: SHOP_PAGE_SIZE });
                }}
                className="flex w-full max-w-md gap-2"
              >
                <input
                  type="search"
                  value={qDraft}
                  onChange={(event) => setQDraft(event.target.value)}
                  placeholder="Search this collection"
                  aria-label="Search this collection"
                  maxLength={80}
                  className="input-luxury min-h-11 flex-1"
                />
                <button type="submit" className="min-h-11 bg-maroon px-5 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-ink">
                  Search
                </button>
              </form>

              <div className="flex items-center justify-between gap-4 lg:justify-end">
                <p className="text-sm text-ink-soft" aria-live="polite">
                  {total} {total === 1 ? 'piece' : 'pieces'}
                </p>
                <SortSelect
                  value={filters.sort}
                  onChange={(sort) => navigate({ ...filters, sort, limit: SHOP_PAGE_SIZE })}
                  className="hidden lg:block"
                />
              </div>
            </div>

            {chips.length > 0 && (
              <ul className="mb-6 flex flex-wrap gap-2" aria-label="Active filters">
                {chips.map((chip) => (
                  <li key={chip.key}>
                    <button
                      type="button"
                      onClick={() => navigate(chip.next)}
                      aria-label={`Remove filter ${chip.label}`}
                      className="tap-feedback inline-flex min-h-11 items-center gap-2 rounded-full border border-gold-deep/60 bg-white px-4 text-xs font-medium text-ink hover:border-maroon"
                    >
                      {chip.label} <span aria-hidden="true">✕</span>
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" onClick={resetAll} className="min-h-11 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-maroon underline-offset-4 hover:underline">
                    Clear all
                  </button>
                </li>
              </ul>
            )}

            <div aria-busy={isPending}>
              {isPending ? (
                <ShopGridSkeleton count={Math.min(Math.max(products.length, 4), 8)} />
              ) : products.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-3.5 sm:gap-x-5 sm:gap-y-8 md:grid-cols-3 xl:grid-cols-4">
                    {products.map((product, index) => (
                      <ProductCard key={product.id} product={product} priority={index < 2} saveShopScroll />
                    ))}
                  </div>
                  {canLoadMore && (
                    <div className="mt-12 flex flex-col items-center gap-3">
                      <p className="text-sm text-ink-soft">
                        Showing {products.length} of {total}
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate({ ...filters, limit: filters.limit + SHOP_PAGE_SIZE })}
                        className="btn-luxury btn-luxury-secondary"
                      >
                        Load More
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="border border-beige bg-white px-5 py-14 text-center sm:px-6">
                  <p className="font-heading text-2xl text-ink sm:text-3xl">
                    {hasFilters ? 'No pieces match these filters' : 'No pieces are listed yet'}
                  </p>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-ink-soft">
                    {hasFilters
                      ? 'Try removing a filter or searching with different words.'
                      : 'Products added in the admin will appear here.'}
                  </p>
                  {hasFilters && (
                    <button type="button" onClick={resetAll} className="btn-luxury btn-luxury-primary mt-7">
                      Reset all filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile filter bottom sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSheetOpen(false)}
              className="fixed inset-0 z-(--z-backdrop) bg-espresso/60 backdrop-blur-sm"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className="fixed inset-x-0 bottom-0 z-(--z-drawer) flex max-h-[88vh] flex-col rounded-t-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-beige px-5 py-3">
                <h2 className="font-heading text-xl text-ink">Filters</h2>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  aria-label="Close filters"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-beige text-ink hover:border-maroon"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-y-contain px-5 py-4">
                <ShopFilterPanel value={draft} onChange={setDraft} categories={categories} facets={facets} />
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-beige bg-white px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={resetAll}
                  className="min-h-12 border border-ink-soft/50 text-xs font-semibold uppercase tracking-[0.18em] text-ink"
                >
                  Reset all
                </button>
                <button
                  type="button"
                  onClick={applySheet}
                  className="min-h-12 bg-maroon text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-ink"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
