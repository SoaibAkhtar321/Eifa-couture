/* ============================================
   EIFA COUTURE — Shop filters (pure, client + server safe)
   ============================================
   The URL is the single source of truth for the shop page. This file
   parses it into a typed `ShopFilters` object (server side, before
   querying Supabase) and turns a `ShopFilters` back into a query string
   (client side, when a shopper changes a filter).
   ============================================ */

import { isAudience, type Audience } from '@/lib/catalog';
import type { PriceFilter } from '@/lib/search';

export const SHOP_PAGE_SIZE = 12;
export const SHOP_MAX_LIMIT = 96;

export type ShopSort = 'newest' | 'price-low-high' | 'price-high-low';
export type ShopCollection = 'new-arrivals' | 'best-sellers' | 'featured';

export const SHOP_SORT_OPTIONS: { label: string; value: ShopSort }[] = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-low-high' },
  { label: 'Price: High to Low', value: 'price-high-low' },
];

export const SHOP_COLLECTIONS: { label: string; value: ShopCollection }[] = [
  { label: 'New Arrivals', value: 'new-arrivals' },
  { label: 'Best Sellers', value: 'best-sellers' },
  { label: 'Featured', value: 'featured' },
];

export interface ShopFilters {
  audience: Audience | null;
  category: string | null;
  collection: ShopCollection | null;
  q: string;
  sizes: string[];
  colors: string[];
  fabrics: string[];
  price: PriceFilter;
  inStock: boolean;
  sort: ShopSort;
  limit: number;
}

export const DEFAULT_SHOP_FILTERS: ShopFilters = {
  audience: null,
  category: null,
  collection: null,
  q: '',
  sizes: [],
  colors: [],
  fabrics: [],
  price: 'all',
  inStock: false,
  sort: 'newest',
  limit: SHOP_PAGE_SIZE,
};

type RawParams = Record<string, string | string[] | undefined>;

const PRICE_VALUES: PriceFilter[] = ['all', 'under-2000', '2000-4000', '4000-7000', '7000-plus'];
const SORT_VALUES: ShopSort[] = ['newest', 'price-low-high', 'price-high-low'];
const COLLECTION_VALUES: ShopCollection[] = ['new-arrivals', 'best-sellers', 'featured'];

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

function list(value: string | string[] | undefined): string[] {
  const unique = new Set(
    first(value)
      .split(',')
      .map((item) => item.trim().slice(0, 40))
      .filter(Boolean)
  );
  return Array.from(unique).slice(0, 12);
}

/** Never trusts the URL: unknown or malformed values fall back to defaults. */
export function parseShopFilters(params: RawParams): ShopFilters {
  const audience = first(params.audience);
  const collection = first(params.collection) as ShopCollection;
  const price = first(params.price) as PriceFilter;
  const sort = first(params.sort) as ShopSort;
  const category = first(params.category).trim().slice(0, 80);
  const limit = Math.floor(Number(first(params.limit)));

  return {
    audience: isAudience(audience) ? audience : null,
    category: category || null,
    collection: COLLECTION_VALUES.includes(collection) ? collection : null,
    q: first(params.q).trim().slice(0, 80),
    sizes: list(params.size),
    colors: list(params.color),
    fabrics: list(params.fabric),
    price: PRICE_VALUES.includes(price) ? price : 'all',
    inStock: first(params.stock) === 'in',
    sort: SORT_VALUES.includes(sort) ? sort : 'newest',
    limit:
      Number.isFinite(limit) && limit > SHOP_PAGE_SIZE
        ? Math.min(Math.ceil(limit / SHOP_PAGE_SIZE) * SHOP_PAGE_SIZE, SHOP_MAX_LIMIT)
        : SHOP_PAGE_SIZE,
  };
}

/** Query string for a filter set; defaults are omitted to keep URLs clean. */
export function shopFiltersToQuery(filters: ShopFilters): string {
  const params = new URLSearchParams();
  if (filters.audience) params.set('audience', filters.audience);
  if (filters.collection) params.set('collection', filters.collection);
  if (filters.category) params.set('category', filters.category);
  if (filters.q) params.set('q', filters.q);
  if (filters.sizes.length) params.set('size', filters.sizes.join(','));
  if (filters.colors.length) params.set('color', filters.colors.join(','));
  if (filters.fabrics.length) params.set('fabric', filters.fabrics.join(','));
  if (filters.price !== 'all') params.set('price', filters.price);
  if (filters.inStock) params.set('stock', 'in');
  if (filters.sort !== 'newest') params.set('sort', filters.sort);
  if (filters.limit > SHOP_PAGE_SIZE) params.set('limit', String(filters.limit));
  return params.toString();
}

/** Bounds for a price band, mirroring the labels in lib/search.ts. */
export function getPriceBounds(price: PriceFilter): {
  gte?: number;
  gt?: number;
  lte?: number;
  lt?: number;
} {
  switch (price) {
    case 'under-2000':
      return { lt: 2000 };
    case '2000-4000':
      return { gte: 2000, lte: 4000 };
    case '4000-7000':
      return { gt: 4000, lte: 7000 };
    case '7000-plus':
      return { gt: 7000 };
    default:
      return {};
  }
}

/** True when any filter other than sort/limit is active. */
export function hasActiveShopFilters(filters: ShopFilters): boolean {
  return (
    !!filters.audience ||
    !!filters.category ||
    !!filters.collection ||
    !!filters.q ||
    filters.sizes.length > 0 ||
    filters.colors.length > 0 ||
    filters.fabrics.length > 0 ||
    filters.price !== 'all' ||
    filters.inStock
  );
}
