/* ============================================
   EIFA COUTURE — Quick product creation (Phase 7)
   ============================================
   Turns the owner's handful of plain-language fields into the full
   product row the store needs, without changing the data model:
   - slug / SKU are generated automatically and checked for uniqueness
   - no sizes chosen  -> 'simple' product (hidden default variant is kept
                         in sync by the DB trigger, migration 0013)
   - sizes chosen     -> 'variant' product, one variant per size, single
                         colour "Default", own stock per size
   - "Price" + "Discounted price" map onto price / compare_at_price
   Browser-client module (RLS is the security boundary), safe for
   Client Components.
   ============================================ */

import {
  createProduct,
  createVariant,
  deleteVariant,
  generateUniqueSlug,
  isProductSkuTaken,
  isSkuTaken,
  setProductActive,
  softDeleteProduct,
  type ProductInput,
} from '@/lib/admin/products-write';
import { uploadProductImages } from '@/lib/admin/storage';
import { activeProductImageCountSchema, MIN_PRODUCT_IMAGES, productFormSchema } from '@/lib/admin/validation';
import { generateSlug } from '@/lib/utils';
import type { DbProduct, ProductAudience } from '@/types/database';

export const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'] as const;

/** Map the owner's "Price" (full price) and optional "Discounted price"
 *  (what customers pay) onto the stored price / compare_at_price. */
export function toStoredPrices(fullPrice: number, discounted: number | null) {
  if (discounted !== null) {
    return { price: discounted, compare_at_price: fullPrice };
  }
  return { price: fullPrice, compare_at_price: null };
}

/** Inverse of toStoredPrices, for the edit form. */
export function fromStoredPrices(price: number, compareAt: number | null) {
  if (compareAt !== null && compareAt > price) {
    return { fullPrice: compareAt, discounted: price };
  }
  return { fullPrice: price, discounted: null as number | null };
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

function skuBase(name: string): string {
  const base = generateSlug(name).replace(/-/g, '').toUpperCase().slice(0, 12);
  return `EIFA-${base || 'ITEM'}`;
}

/** Generates a SKU that is free in BOTH SKU pools (simple products and variants). */
export async function generateUniqueSku(name: string, suffix?: string): Promise<string> {
  const base = suffix ? `${skuBase(name)}-${suffix}` : skuBase(name);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = `${base}-${randomSuffix()}`;
    const [productTaken, variantTaken] = await Promise.all([
      isProductSkuTaken(candidate),
      isSkuTaken(candidate),
    ]);
    if (!productTaken && !variantTaken) return candidate;
  }
  throw new Error('Could not generate a unique SKU. Please try again.');
}

/** Optional extras from "Advanced options"; anything left out gets a default. */
export type QuickCreateOverrides = Partial<
  Pick<
    ProductInput,
    | 'slug'
    | 'sku'
    | 'description'
    | 'short_description'
    | 'fabric_id'
    | 'tags'
    | 'is_best_seller'
    | 'is_active'
    | 'seo_title'
    | 'seo_description'
    | 'seo_keywords'
    | 'track_inventory'
    | 'allow_backorders'
  >
>;

export interface QuickCreateInput {
  name: string;
  audience: ProductAudience;
  category_id: string;
  fullPrice: number;
  discountedPrice: number | null;
  /** Empty = simple product with `stockQuantity`. */
  sizes: { size: string; quantity: number }[];
  stockQuantity: number;
  is_featured: boolean;
  is_new_arrival: boolean;
  photos: File[];
  overrides?: QuickCreateOverrides;
}

export interface QuickCreateResult {
  product: DbProduct | null;
  error: string | null;
  /** Set when the product was saved but some photos failed to upload. */
  photoWarning: string | null;
}

export async function quickCreateProduct(input: QuickCreateInput): Promise<QuickCreateResult> {
  const hasSizes = input.sizes.length > 0;
  const { price, compare_at_price } = toStoredPrices(input.fullPrice, input.discountedPrice);

  const wantsActive = input.overrides?.is_active ?? true;
  if (wantsActive) {
    const check = activeProductImageCountSchema.safeParse(input.photos.length);
    if (!check.success) {
      return { product: null, error: check.error.issues[0]?.message ?? 'Add more photos.', photoWarning: null };
    }
  }

  try {
    const extras = input.overrides ?? {};
    const slug = extras.slug?.trim() || (await generateUniqueSlug(input.name));
    const sku = hasSizes ? null : extras.sku?.trim() || (await generateUniqueSku(input.name));
    const description = extras.description?.trim() || input.name;
    const shortDescription = extras.short_description?.trim() || description.slice(0, 300);

    // Sensible defaults for fields the owner is not asked about. The
    // description is the product name (no invented marketing claims) and
    // can be written properly under "Advanced options".
    const payload: ProductInput = {
      name: input.name,
      slug,
      description,
      short_description: shortDescription,
      price,
      compare_at_price,
      category_id: input.category_id,
      audience: input.audience,
      fabric_id: extras.fabric_id ?? null,
      tags: extras.tags ?? [],
      is_featured: input.is_featured,
      is_best_seller: extras.is_best_seller ?? false,
      is_new_arrival: input.is_new_arrival,
      // Saved hidden first; switched on below once enough photos uploaded.
      is_active: false,
      seo_title: extras.seo_title ?? null,
      seo_description: extras.seo_description ?? null,
      seo_keywords: extras.seo_keywords ?? [],
      product_type: hasSizes ? 'variant' : 'simple',
      sku,
      stock_quantity: hasSizes ? 0 : input.stockQuantity,
      track_inventory: extras.track_inventory ?? true,
      allow_backorders: extras.allow_backorders ?? false,
    };

    const parsed = productFormSchema.safeParse(payload);
    if (!parsed.success) {
      return { product: null, error: parsed.error.issues[0]?.message ?? 'Please check the form.', photoWarning: null };
    }

    const { data: product, error } = await createProduct(payload);
    if (error || !product) return { product: null, error: error ?? 'Failed to create product.', photoWarning: null };

    if (hasSizes) {
      const createdIds: string[] = [];
      for (const { size, quantity } of input.sizes) {
        const variantSku = await generateUniqueSku(input.name, size.replace(/\s+/g, '').toUpperCase());
        const { data: variant, error: variantError } = await createVariant(
          product.id,
          {
            size,
            color_name: 'Default',
            color_hex: null,
            sku: variantSku,
            price_override: null,
            is_active: true,
          },
          quantity,
          3
        );
        if (variantError || !variant) {
          // roll back so the owner is never left with a half-built product
          for (const id of createdIds) await deleteVariant(id);
          await softDeleteProduct(product.id);
          return {
            product: null,
            error: `Could not add size ${size}: ${variantError ?? 'unknown error'}. Nothing was saved.`,
            photoWarning: null,
          };
        }
        createdIds.push(variant.id);
      }
    }

    let photoWarning: string | null = null;
    let uploaded = 0;
    if (input.photos.length > 0) {
      const { data, errors } = await uploadProductImages(product.id, input.photos, 0, false);
      uploaded = data.length;
      if (errors.length > 0) {
        photoWarning = `Product saved, but ${errors.length} photo${errors.length > 1 ? 's' : ''} could not be uploaded (${errors[0].message}). Add them on this page.`;
      } else if (data.length === 0) {
        photoWarning = 'Product saved, but no photos were uploaded. Add them on this page.';
      }
    }

    if (wantsActive) {
      if (uploaded >= MIN_PRODUCT_IMAGES) {
        const { error: activeError } = await setProductActive(product.id, true);
        if (activeError) photoWarning = `Product saved but not live yet: ${activeError}`;
      } else {
        photoWarning = `${photoWarning ?? 'Product saved'} It stays hidden from the store until it has ${MIN_PRODUCT_IMAGES} photos.`;
      }
    }

    return { product, error: null, photoWarning };
  } catch (e) {
    return { product: null, error: e instanceof Error ? e.message : 'Something went wrong.', photoWarning: null };
  }
}

