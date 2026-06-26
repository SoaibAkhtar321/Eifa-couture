'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import ShopProductCard from '@/components/shop/ShopProductCard';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '@/lib/mock-data';
import type { Product, SortOption } from '@/types';

const PRODUCTS_PER_PAGE = 8;

const sortOptions: { label: string; value: SortOption }[] = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-low-high' },
  { label: 'Price: High to Low', value: 'price-high-low' },
  { label: 'Best Sellers', value: 'popularity' },
  { label: 'Name: A to Z', value: 'name-a-z' },
];

function sortProducts(products: Product[], sortBy: SortOption) {
  const sorted = [...products];

  switch (sortBy) {
    case 'price-low-high':
      return sorted.sort((a, b) => a.price - b.price);

    case 'price-high-low':
      return sorted.sort((a, b) => b.price - a.price);

    case 'popularity':
      return sorted.sort((a, b) => Number(b.isBestSeller) - Number(a.isBestSeller));

    case 'name-a-z':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));

    case 'name-z-a':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));

    case 'rating':
    case 'newest':
    default:
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
}

export default function ShopPageClient() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);

  const activeCategories = useMemo(
    () =>
      MOCK_CATEGORIES.filter((category) => category.isActive).sort(
        (a, b) => a.order - b.order
      ),
    []
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    const filtered = MOCK_PRODUCTS.filter((product) => {
      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;

      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.shortDescription.toLowerCase().includes(normalizedSearch) ||
        product.fabric.toLowerCase().includes(normalizedSearch) ||
        product.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch));

      return product.isActive && matchesCategory && matchesSearch;
    });

    return sortProducts(filtered, sortBy);
  }, [searchQuery, selectedCategory, sortBy]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredProducts.length;

  const handleCategoryChange = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    setVisibleCount(PRODUCTS_PER_PAGE);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setVisibleCount(PRODUCTS_PER_PAGE);
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setVisibleCount(PRODUCTS_PER_PAGE);
  };

  return (
    <div className="bg-ivory">
      <section className="relative overflow-hidden bg-cream pt-32 pb-14 sm:pt-36 sm:pb-18 lg:pt-44 lg:pb-24">
        <div className="absolute inset-0 texture-grain" />

        <div className="luxury-container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="max-w-3xl"
          >
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.32em] text-gold-dark">
              The Collection
            </p>

            <h1 className="font-heading text-5xl leading-[0.95] text-charcoal sm:text-6xl lg:text-7xl">
              Shop the Art of
              <span className="block text-gradient-maroon">Chikankari</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-charcoal/65 sm:text-lg">
              Discover handcrafted pieces shaped by Lucknowi heritage, quiet luxury,
              and the patience of master karigars.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-4 border-y border-gold/25 py-5 sm:grid-cols-3">
            {[
              ['Since', '1998'],
              ['Craft', 'Hand Embroidered'],
              ['Origin', 'Lucknow'],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[10px] uppercase tracking-[0.28em] text-charcoal/45">
                  {label}
                </p>
                <p className="mt-1 font-subheading text-2xl text-maroon">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="luxury-container">
          <div className="mb-8 flex flex-col gap-5 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold-dark">
                Curated Catalogue
              </p>

              <h2 className="mt-3 font-heading text-3xl text-charcoal sm:text-4xl">
                {filteredProducts.length} handcrafted pieces
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_220px] lg:w-[560px]">
              <label className="relative block">
                <span className="sr-only">Search products</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder="Search kurtas, sarees, dupattas..."
                  className="h-12 w-full border border-charcoal/15 bg-white px-4 text-sm text-charcoal outline-none transition-colors duration-300 placeholder:text-charcoal/35 focus:border-gold"
                />
              </label>

              <label className="relative block">
                <span className="sr-only">Sort products</span>
                <select
                  value={sortBy}
                  onChange={(event) => handleSortChange(event.target.value as SortOption)}
                  className="h-12 w-full appearance-none border border-charcoal/15 bg-white px-4 text-sm text-charcoal outline-none transition-colors duration-300 focus:border-gold"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-charcoal/50">
                  ↓
                </span>
              </label>
            </div>
          </div>

          <div className="mb-8 flex gap-2 overflow-x-auto pb-2 lg:hidden">
            <button
              type="button"
              onClick={() => handleCategoryChange('all')}
              className={`shrink-0 border px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors duration-300 ${
                selectedCategory === 'all'
                  ? 'border-maroon bg-maroon text-white'
                  : 'border-charcoal/15 bg-white text-charcoal hover:border-gold'
              }`}
            >
              All
            </button>

            {activeCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => handleCategoryChange(category.slug)}
                className={`shrink-0 border px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors duration-300 ${
                  selectedCategory === category.slug
                    ? 'border-maroon bg-maroon text-white'
                    : 'border-charcoal/15 bg-white text-charcoal hover:border-gold'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
            <aside className="hidden lg:block">
              <div className="sticky top-28 border border-beige bg-white p-6">
                <div className="mb-6 border-b border-beige pb-5">
                  <p className="text-xs font-medium uppercase tracking-[0.26em] text-gold-dark">
                    Refine
                  </p>
                  <h3 className="mt-2 font-heading text-2xl text-charcoal">
                    Categories
                  </h3>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('all')}
                    className={`flex w-full items-center justify-between px-3 py-3 text-left text-sm transition-colors duration-300 ${
                      selectedCategory === 'all'
                        ? 'bg-cream text-maroon'
                        : 'text-charcoal/70 hover:bg-cream hover:text-maroon'
                    }`}
                  >
                    <span>All Collections</span>
                    <span>{MOCK_PRODUCTS.filter((product) => product.isActive).length}</span>
                  </button>

                  {activeCategories.map((category) => {
                    const categoryCount = MOCK_PRODUCTS.filter(
                      (product) =>
                        product.isActive && product.category === category.slug
                    ).length;

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleCategoryChange(category.slug)}
                        className={`flex w-full items-center justify-between px-3 py-3 text-left text-sm transition-colors duration-300 ${
                          selectedCategory === category.slug
                            ? 'bg-cream text-maroon'
                            : 'text-charcoal/70 hover:bg-cream hover:text-maroon'
                        }`}
                      >
                        <span>{category.name}</span>
                        <span>{categoryCount}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 border-t border-beige pt-6">
                  <p className="font-subheading text-xl text-maroon">
                    Crafted slowly, worn beautifully.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-charcoal/60">
                    Each product celebrates hand embroidery, breathable fabrics, and
                    heritage-inspired silhouettes.
                  </p>
                </div>
              </div>
            </aside>

            <div>
              {visibleProducts.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4">
                    {visibleProducts.map((product, index) => (
                      <ShopProductCard
                        key={product.id}
                        product={product}
                        index={index}
                      />
                    ))}
                  </div>

                  {canLoadMore && (
                    <div className="mt-14 flex justify-center">
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleCount((current) => current + PRODUCTS_PER_PAGE)
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
                  <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold-dark">
                    No pieces found
                  </p>

                  <h3 className="mt-3 font-heading text-3xl text-charcoal">
                    Try a different search
                  </h3>

                  <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-charcoal/60">
                    We could not find a piece matching your current filters. Explore
                    all collections or search by fabric, category, or embroidery style.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchQuery('');
                      setSortBy('newest');
                      setVisibleCount(PRODUCTS_PER_PAGE);
                    }}
                    className="btn-luxury btn-luxury-primary mt-8"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}