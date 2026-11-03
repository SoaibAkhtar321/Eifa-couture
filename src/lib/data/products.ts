/* ============================================
   EIFA COUTURE — Product Data Access
   ============================================
   Shared Supabase query layer for `products` + related tables
   (product_images, product_variants, inventory, categories, fabrics).

   Mirrors the addresses.ts convention: thin query functions kept out
   of components, mapped onto the existing UI-facing `Product` /
   `Category` shape (types/index.ts) so no consumer needs a prop-shape
   change. Every function takes a SupabaseClient so it works from both
   Server Components (lib/supabase/server) and Client Components
   (lib/supabase/client) without duplicating query logic.
   ============================================ */

import { getCategoryPlaceholder } from '@/lib/utils';
import type { SupabaseClient } from '@supabase/supabase-js';

import { SIZES } from '@/lib/constants';
import type { Product, ProductColor, ProductVariant } from '@/types';
import type {
  DbInventory,
  DbProduct,
  DbProductImage,
  DbProductVariant,
} from '@/types/database';


const SIZE_ORDER = new Map(SIZES.map((size, index) => [size, index]));

function sortSizes(sizes: string[]): string[] {
  return Array.from(new Set(sizes)).sort((a, b) => {
    const orderA = SIZE_ORDER.get(a as (typeof SIZES)[number]);
    const orderB = SIZE_ORDER.get(b as (typeof SIZES)[number]);
    if (orderA === undefined && orderB === undefined) return a.localeCompare(b);
    if (orderA === undefined) return 1;
    if (orderB === undefined) return -1;
    return orderA - orderB;
  });
}

/** Row shape returned by the shared product select below. */
export type ProductRow = DbProduct & {
  categories: { slug: string } | null;
  fabrics: { name: string; care: string[] } | null;
  product_images: DbProductImage[];
  product_variants: (DbProductVariant & { inventory: DbInventory | null })[];
};

// Every product fetch pulls the same joined shape — kept as one
// constant so the catalog list, detail page, and related-products
// query can never drift out of sync with each other.
export const PRODUCT_SELECT = `
  *,
  categories ( slug ),
  fabrics ( name, care ),
  product_images ( id, url, alt_text, sort_order, is_primary, variant_id ),
  product_variants (
    id, size, color_name, color_hex, price_override, is_active, is_default_variant,
    inventory ( quantity, reserved )
  )
`;

export function mapProductRow(row: ProductRow): Product {
  // Product-level gallery only (variant_id is null) — the fallback
  // shown when the selected color has no images of its own, and the
  // only gallery for simple products. Variant-scoped images are
  // handled separately below and exposed via `imagesByColor`.
  const images = (row.product_images ?? [])
    .filter((image) => !image.variant_id)
    .slice()
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return a.sort_order - b.sort_order;
    })
    .map((image) => image.url);

  const categorySlug = row.categories?.slug ?? 'uncategorized';
  const activeVariants = (row.product_variants ?? []).filter((v) => v.is_active);
  const activeVariantById = new Map(activeVariants.map((v) => [v.id, v]));

  // Variant-scoped images (variant_id set), grouped by that variant's
  // color — a color's gallery is whatever was uploaded against any one
  // of its size variants (in practice always the same "owner" variant,
  // since the admin UI uploads per color, not per size). Images whose
  // variant_id points at an inactive/missing variant are skipped, same
  // as the product-level gallery already skips deleted images.
  const imagesByColorMap = new Map<string, DbProductImage[]>();
  for (const image of row.product_images ?? []) {
    if (!image.variant_id) continue;
    const owningVariant = activeVariantById.get(image.variant_id);
    if (!owningVariant) continue;
    const bucket = imagesByColorMap.get(owningVariant.color_name) ?? [];
    bucket.push(image);
    imagesByColorMap.set(owningVariant.color_name, bucket);
  }

  const imagesByColor: Record<string, string[]> = {};
  for (const [colorName, colorImages] of imagesByColorMap) {
    imagesByColor[colorName] = colorImages
      .slice()
      .sort((a, b) => {
        if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
        return a.sort_order - b.sort_order;
      })
      .map((image) => image.url);
  }

  const colorMap = new Map<string, ProductColor>();
  const stock: Record<string, number> = {};
  const variants: ProductVariant[] = [];

  for (const variant of activeVariants) {
    if (!colorMap.has(variant.color_name)) {
      colorMap.set(variant.color_name, {
        name: variant.color_name,
        hex: variant.color_hex ?? '#CCCCCC',
      });
    }

    const inventoryRow = variant.inventory;
    const available = inventoryRow
      ? Math.max(inventoryRow.quantity - inventoryRow.reserved, 0)
      : 0;

    stock[`${variant.size}-${variant.color_name}`] = available;

    // Resolved price: an explicit per-variant override always wins;
    // variants without one fall back to the product's base price. This
    // resolved value — never row.price directly — is what every
    // pricing-aware consumer (cards, product page, cart) should read.
    const resolvedPrice = variant.price_override ?? row.price;

    variants.push({
      id: variant.id,
      size: variant.size,
      colorName: variant.color_name,
      price: resolvedPrice,
      stock: available,
    });
  }

  const variantPrices = variants.map((v) => v.price);
  const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : row.price;
  const maxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : row.price;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    shortDescription: row.short_description,
    price: row.price,
    compareAtPrice: row.compare_at_price,
    images: images.length > 0 ? images : [getCategoryPlaceholder(categorySlug)],
    imagesByColor,
    category: categorySlug,
    subcategory: '',
    sizes: sortSizes(activeVariants.map((v) => v.size)),
    colors: Array.from(colorMap.values()),
    stock,
    variants,
    minPrice,
    maxPrice,
    hasPriceRange: minPrice !== maxPrice,
    fabric: row.fabrics?.name ?? '',
    care: row.fabrics?.care ?? [],
    tags: row.tags ?? [],
    isFeatured: row.is_featured,
    isBestSeller: row.is_best_seller,
    isNewArrival: row.is_new_arrival,
    isActive: row.is_active,
    seo: {
      title: row.seo_title ?? row.name,
      description: row.seo_description ?? row.short_description,
      keywords: row.seo_keywords ?? [],
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    productType: row.product_type,
    stockQuantity: row.stock_quantity,
    trackInventory: row.track_inventory,
    allowBackorders: row.allow_backorders,
    sku: row.sku,
  };
}

/** Every active, non-deleted product with its images/variants/inventory. */
export async function fetchActiveProducts(supabase: SupabaseClient): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as unknown as ProductRow[]).map(mapProductRow);
}

export async function fetchProductBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) return null;
  return mapProductRow(data as unknown as ProductRow);
}

export async function fetchProductsByIds(
  supabase: SupabaseClient,
  ids: string[]
): Promise<Product[]> {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .in('id', ids)
    .is('deleted_at', null);

  if (error || !data) return [];
  return (data as unknown as ProductRow[]).map(mapProductRow);
}

type ProductFlag = 'is_featured' | 'is_best_seller' | 'is_new_arrival';

async function fetchProductList(
  supabase: SupabaseClient,
  limit: number,
  options: { flag?: ProductFlag; categoryIds?: string[]; orderBy?: 'created_at' | 'rating_avg' } = {}
): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_active', true)
    .is('deleted_at', null);

  if (options.flag) query = query.eq(options.flag, true);
  if (options.categoryIds) query = query.in('category_id', options.categoryIds);
  if (options.orderBy === 'rating_avg') query = query.order('rating_avg', { ascending: false });

  const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);

  if (error || !data) return [];
  return (data as unknown as ProductRow[]).map(mapProductRow);
}

/** Products the admin marked "Featured". */
export function fetchFeaturedProducts(supabase: SupabaseClient, limit = 4) {
  return fetchProductList(supabase, limit, { flag: 'is_featured' });
}

export function fetchBestSellers(supabase: SupabaseClient, limit = 4) {
  return fetchProductList(supabase, limit, { flag: 'is_best_seller', orderBy: 'rating_avg' });
}

/**
 * Products marked "New arrival". If the admin hasn't flagged anything
 * yet, the newest uploads are shown instead so a freshly added product
 * always reaches the homepage.
 */
export async function fetchNewArrivals(supabase: SupabaseClient, limit = 6) {
  const flagged = await fetchProductList(supabase, limit, { flag: 'is_new_arrival' });
  return flagged.length > 0 ? flagged : fetchProductList(supabase, limit);
}

export async function fetchProductsInCategories(
  supabase: SupabaseClient,
  categoryIds: string[],
  limit = 8
): Promise<Product[]> {
  if (categoryIds.length === 0) return [];
  return fetchProductList(supabase, limit, { categoryIds });
}

/**
 * Related products for a product detail page: other active products in
 * the same category first (queried directly by `category_id`, not by
 * scanning the whole catalog), falling back to any other active
 * products if the category has none. Two small, indexed queries at
 * most — never pulls the full product catalog just to find 4 items.
 */
export async function fetchRelatedProducts(
  supabase: SupabaseClient,
  productId: string,
  categorySlug: string,
  limit = 4
): Promise<Product[]> {
  const { data: categoryRow } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .maybeSingle();

  if (categoryRow?.id) {
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('is_active', true)
      .eq('category_id', categoryRow.id)
      .is('deleted_at', null)
      .neq('id', productId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error && data && data.length > 0) {
      return (data as unknown as ProductRow[]).map(mapProductRow);
    }
  }

  // Fallback: the category lookup failed or had no other active
  // products — show any other active products instead of nothing.
  const { data: fallbackData, error: fallbackError } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_active', true)
    .is('deleted_at', null)
    .neq('id', productId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (fallbackError || !fallbackData) return [];
  return (fallbackData as unknown as ProductRow[]).map(mapProductRow);
}