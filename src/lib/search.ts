/* ============================================
   EIFA COUTURE — Shared Search Engine
   Single source of truth for every search-driven
   surface in the app (HeaderSearch, /search,
   ShopPageClient). No component should implement
   its own matching, scoring, sorting, or filter
   option lists — import them from here instead.
   ============================================ */

import type { Category, Product, SortOption } from '@/types';

// ── Types ──

/**
 * Sort options across the app. 'relevance' only makes sense when there's
 * an active search query — it's the default for the /search page, and
 * unavailable on the shop page (which sorts a browsed catalogue, not
 * search results).
 */
export type SearchSortOption = 'relevance' | SortOption;

export type PriceFilter =
  | 'all'
  | 'under-2000'
  | '2000-4000'
  | '4000-7000'
  | '7000-plus';

/** A curated product collection driven by boolean product flags rather
 * than a category slug (e.g. "New Arrivals", "Best Sellers"). */
export interface CollectionDef {
  slug: 'new-arrivals' | 'best-sellers';
  name: string;
  matches: (product: Product) => boolean;
}

export type SuggestionType = 'product' | 'category' | 'collection' | 'fabric';

export interface SearchSuggestions {
  products: Product[];
  categories: Category[];
  collections: CollectionDef[];
  fabrics: string[];
}

// ── Shared option lists ──
// Each surface picks the subset of values it needs (see `.filter(...)`
// at the call site) instead of declaring its own literal array with
// its own copy of the labels.

export const SORT_OPTIONS: { label: string; value: SearchSortOption }[] = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-low-high' },
  { label: 'Price: High to Low', value: 'price-high-low' },
  { label: 'Best Sellers', value: 'popularity' },
  { label: 'Name: A to Z', value: 'name-a-z' },
];

export const PRICE_FILTER_OPTIONS: { label: string; value: PriceFilter }[] = [
  { label: 'All Prices', value: 'all' },
  { label: 'Under ₹2,000', value: 'under-2000' },
  { label: '₹2,000 - ₹4,000', value: '2000-4000' },
  { label: '₹4,000 - ₹7,000', value: '4000-7000' },
  { label: 'Above ₹7,000', value: '7000-plus' },
];

export const COLLECTIONS: CollectionDef[] = [
  { slug: 'new-arrivals', name: 'New Arrivals', matches: (p) => p.isNewArrival },
  { slug: 'best-sellers', name: 'Best Sellers', matches: (p) => p.isBestSeller },
];

export const POPULAR_SEARCHES = ['Kurta', 'Saree', 'Dupatta', 'Men', 'Bridal', 'Bags'];

// ── Field weights for relevance scoring ──
// Higher weight = stronger signal that the query is "about" that product.
// Name matches outrank a fabric mention buried in the long description.

const FIELD_WEIGHTS = {
  name: 5,
  exactNameBonus: 4,
  tags: 4,
  shortDescription: 3,
  category: 2,
  subcategory: 2,
  fabric: 2,
  description: 1,
  bestSellerBonus: 1,
} as const;

function normalizeQuery(rawQuery: string): string {
  return rawQuery.trim().toLowerCase();
}

/** All text fields a query can match against, lowercased once per call. */
function getSearchableFields(product: Product) {
  return {
    name: product.name.toLowerCase(),
    shortDescription: product.shortDescription.toLowerCase(),
    description: product.description.toLowerCase(),
    category: product.category.toLowerCase(),
    subcategory: (product.subcategory ?? '').toLowerCase(),
    fabric: product.fabric.toLowerCase(),
    tags: (product.tags ?? []).join(' ').toLowerCase(),
  };
}

// ── Matching ──

/**
 * Does this product match the query at all? Used as the filter predicate
 * before ranking/sorting. Inactive products never match.
 */
export function productMatchesSearch(product: Product, rawQuery: string): boolean {
  if (!product.isActive) return false;

  const query = normalizeQuery(rawQuery);
  if (!query) return true;

  const fields = getSearchableFields(product);
  return Object.values(fields).some((field) => field.includes(query));
}

export function productMatchesPrice(product: Product, priceFilter: PriceFilter): boolean {
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

// ── Relevance ──

/**
 * Relevance score for a product against a query. Name matches (and exact
 * name matches especially) dominate, so "white chikankari kurta" always
 * surfaces the kurta named for it before a dupatta that merely mentions
 * "white" in its long description.
 */
export function getRelevanceScore(product: Product, rawQuery: string): number {
  const query = normalizeQuery(rawQuery);
  if (!query) return 0;

  const fields = getSearchableFields(product);
  let score = 0;

  if (fields.name.includes(query)) {
    score += FIELD_WEIGHTS.name;
    if (fields.name === query) score += FIELD_WEIGHTS.exactNameBonus;
  }
  if (fields.tags.includes(query)) score += FIELD_WEIGHTS.tags;
  if (fields.shortDescription.includes(query)) score += FIELD_WEIGHTS.shortDescription;
  if (fields.category.includes(query)) score += FIELD_WEIGHTS.category;
  if (fields.subcategory.includes(query)) score += FIELD_WEIGHTS.subcategory;
  if (fields.fabric.includes(query)) score += FIELD_WEIGHTS.fabric;
  if (fields.description.includes(query)) score += FIELD_WEIGHTS.description;
  if (product.isBestSeller) score += FIELD_WEIGHTS.bestSellerBonus;

  return score;
}

/** Sort matched products by relevance score, highest first. */
export function rankProducts(products: Product[], rawQuery: string): Product[] {
  const query = normalizeQuery(rawQuery);
  if (!query) return products;

  return [...products].sort(
    (a, b) => getRelevanceScore(b, query) - getRelevanceScore(a, query)
  );
}

// ── Sorting ──

/**
 * Sort products by the given option. `rawQuery` is only used for the
 * 'relevance' case — pass '' on surfaces (like the shop page) that never
 * use relevance sorting.
 */
export function sortProducts(
  products: Product[],
  sortBy: SearchSortOption,
  rawQuery = ''
): Product[] {
  const sorted = [...products];

  switch (sortBy) {
    case 'relevance':
      return rankProducts(sorted, rawQuery);
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
      // No rating field on Product yet — fall back to newest until the
      // data model grows one (tracked in the product-schema roadmap item).
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case 'newest':
    default:
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
}

// ── Suggestions (autocomplete) ──

/**
 * Build ranked autocomplete suggestions for a non-empty query: best
 * matching products, categories, collections, and fabrics. Caller decides
 * how to render/cap these; `limit` only bounds the product list since
 * that's the section that can realistically be long.
 */
export function getSearchSuggestions(
  rawQuery: string,
  products: Product[],
  categories: Category[],
  limit = 6
): SearchSuggestions {
  const query = normalizeQuery(rawQuery);

  if (!query) {
    return { products: [], categories: [], collections: [], fabrics: [] };
  }

  const activeProducts = products.filter((product) => product.isActive);

  const matchedProducts = rankProducts(
    activeProducts.filter((product) => productMatchesSearch(product, query)),
    query
  ).slice(0, limit);

  const matchedCategories = categories
    .filter(
      (category) =>
        category.isActive &&
        (category.name.toLowerCase().includes(query) ||
          category.slug.toLowerCase().includes(query))
    )
    .slice(0, 4);

  const matchedCollections = COLLECTIONS.filter((collection) =>
    collection.name.toLowerCase().includes(query)
  );

  const fabricSet = new Set(
    activeProducts.map((product) => product.fabric).filter(Boolean)
  );
  const matchedFabrics = Array.from(fabricSet)
    .filter((fabric) => fabric.toLowerCase().includes(query))
    .slice(0, 4);

  return {
    products: matchedProducts,
    categories: matchedCategories,
    collections: matchedCollections,
    fabrics: matchedFabrics,
  };
}